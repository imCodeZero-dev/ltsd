/**
 * Watchlist price-drop alerts.
 *
 * Runs once daily (called from the existing daily-sync cron — no new
 * schedule). For every active watchlist item, compares the deal's current
 * price against `lastAlertedPrice` (the price at the last alert sent).
 * A user with multiple qualifying items gets ONE combined email/push,
 * never one message per product.
 *
 * Trigger rules (see WatchlistItem.priceAlert / discountAlert):
 *   priceAlert:    alert when currentPrice < lastAlertedPrice (or first-ever
 *                  check), and — if targetPrice is set — only once price has
 *                  reached it.
 *   discountAlert: alert when discountPercent >= minDiscount AND price has
 *                  moved since the last alert (same "don't repeat" guard).
 */

import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { sendPushToUser } from "@/lib/push";
import { logError } from "@/lib/system-log";

function inQuietHours(start: string | null, end: string | null): boolean {
  if (!start || !end) return false;
  const now = new Date();
  const nowMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const startMinutes = sh * 60 + sm;
  const endMinutes   = eh * 60 + em;
  if (startMinutes === endMinutes) return false;
  if (startMinutes < endMinutes) return nowMinutes >= startMinutes && nowMinutes < endMinutes;
  // wraps past midnight (e.g. 22:00 -> 08:00)
  return nowMinutes >= startMinutes || nowMinutes < endMinutes;
}

interface QualifyingItem {
  watchlistItemId: string;
  dealId:          string;
  title:           string;
  slug:            string;
  imageUrl:        string | null;
  currentPrice:    number;
  originalPrice:   number | null;
  savings:         number;
}

function buildEmailHtml(items: QualifyingItem[], baseUrl: string): string {
  const cards = items.map(i => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #E7E8E9">
        <table role="presentation" width="100%"><tr>
          <td style="width:64px;vertical-align:top">
            ${i.imageUrl ? `<img src="${i.imageUrl}" width="56" height="56" style="border-radius:8px;object-fit:cover" alt="">` : ""}
          </td>
          <td style="padding-left:12px;vertical-align:top">
            <p style="margin:0;font-size:14px;font-weight:600;color:#000A1E">${i.title.slice(0, 80)}</p>
            <p style="margin:4px 0 0;font-size:14px;color:#000A1E">
              <strong>$${i.currentPrice.toFixed(2)}</strong>
              ${i.originalPrice ? `<span style="color:#6B7280;text-decoration:line-through;margin-left:6px">$${i.originalPrice.toFixed(2)}</span>` : ""}
            </p>
            <a href="${baseUrl}/deals/${i.slug}" style="font-size:12px;color:#000A1E;font-weight:600">View deal →</a>
          </td>
        </tr></table>
      </td>
    </tr>`).join("");

  return `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
      <h2 style="color:#000A1E">${items.length === 1 ? "A watched product just dropped in price" : `${items.length} of your watched products just dropped in price`}</h2>
      <table role="presentation" width="100%">${cards}</table>
      <p style="margin-top:16px">
        <a href="${baseUrl}/watchlist?sort=recent-price-drops" style="display:inline-block;padding:12px 24px;background:#000A1E;color:#fff;border-radius:6px;text-decoration:none;font-weight:600">
          View Watchlist
        </a>
      </p>
      <p style="color:#6B7280;font-size:12px;margin-top:20px">
        Manage alert preferences: <a href="${baseUrl}/settings">${baseUrl}/settings</a>
      </p>
    </div>`;
}

export async function checkWatchlistPriceDrops(): Promise<{ usersNotified: number; itemsChecked: number; errors: string[] }> {
  const errors: string[] = [];
  const baseUrl = process.env.NEXTAUTH_URL ?? "https://limitedtimesuperdeals.app";

  const items = await db.watchlistItem.findMany({
    where: { isActive: true, OR: [{ priceAlert: true }, { discountAlert: true }] },
    include: {
      deal: {
        select: { id: true, title: true, slug: true, imageUrl: true, currentPrice: true, originalPrice: true, discountPercent: true, isActive: true },
      },
      user: {
        select: { id: true, email: true, preferences: { select: { emailAlerts: true, pushAlerts: true, quietHoursEnabled: true, quietHoursStart: true, quietHoursEnd: true } } },
      },
    },
  });

  const qualifyingByUser = new Map<string, QualifyingItem[]>();
  const updates: { id: string; price: number }[] = [];

  for (const item of items) {
    if (!item.deal.isActive) continue;

    const refPrice = item.lastAlertedPrice ?? item.deal.originalPrice ?? item.deal.currentPrice;
    const dropped   = item.deal.currentPrice < refPrice;
    if (!dropped) continue;

    const hitTarget = item.targetPrice == null || item.deal.currentPrice <= item.targetPrice;
    const priceTrigger    = item.priceAlert && hitTarget;
    const discountTrigger = item.discountAlert && item.minDiscount > 0 && (item.deal.discountPercent ?? 0) >= item.minDiscount;

    if (!priceTrigger && !discountTrigger) continue;

    updates.push({ id: item.id, price: item.deal.currentPrice });

    const prefs = item.user.preferences;
    if (!prefs?.emailAlerts && !prefs?.pushAlerts) continue; // nothing enabled — still update baseline above
    if (prefs.quietHoursEnabled && inQuietHours(prefs.quietHoursStart, prefs.quietHoursEnd)) continue;

    const list = qualifyingByUser.get(item.user.id) ?? [];
    list.push({
      watchlistItemId: item.id,
      dealId:          item.deal.id,
      title:           item.deal.title,
      slug:            item.deal.slug,
      imageUrl:        item.deal.imageUrl,
      currentPrice:    item.deal.currentPrice,
      originalPrice:   item.deal.originalPrice,
      savings:         (item.deal.originalPrice ?? item.deal.currentPrice) - item.deal.currentPrice,
    });
    qualifyingByUser.set(item.user.id, list);
  }

  // Update lastAlertedPrice baselines for every item that dropped, regardless
  // of whether the user has notifications enabled — keeps the guard accurate.
  if (updates.length) {
    await Promise.all(updates.map(u =>
      db.watchlistItem.update({ where: { id: u.id }, data: { lastAlertedPrice: u.price } })
        .catch(err => errors.push(`update ${u.id}: ${err instanceof Error ? err.message : String(err)}`)),
    ));
  }

  let usersNotified = 0;

  for (const [userId, qualifying] of qualifyingByUser) {
    const user = items.find(i => i.user.id === userId)!.user;
    const prefs = user.preferences!;

    try {
      if (prefs.emailAlerts) {
        await sendEmail({
          to: user.email,
          subject: qualifying.length === 1
            ? `Price drop alert: ${qualifying[0].title.slice(0, 60)}`
            : `${qualifying.length} watchlist prices dropped`,
          html: buildEmailHtml(qualifying, baseUrl),
        });
      }
      if (prefs.pushAlerts) {
        const biggestSaving = Math.max(...qualifying.map(q => q.savings));
        await sendPushToUser(userId, {
          title: qualifying.length === 1 ? "Price drop!" : `${qualifying.length} watchlist prices dropped`,
          body:  qualifying.length === 1
            ? qualifying[0].title.slice(0, 80)
            : `Your biggest saving is $${biggestSaving.toFixed(2)}.`,
          url:   "/watchlist?sort=recent-price-drops",
        });
      }

      await db.notification.create({
        data: {
          userId,
          dealId: qualifying[0].dealId,
          type:   "PRICE_DROP",
          title:  qualifying.length === 1 ? "Price drop on a watched item" : `${qualifying.length} watchlist prices dropped`,
          body:   qualifying.map(q => q.title.slice(0, 60)).join(", "),
        },
      });

      await db.alertHistory.createMany({
        data: qualifying.map(q => ({ userId, dealId: q.dealId, type: "PRICE_DROP" as const, channel: "EMAIL" as const, success: true })),
      });

      usersNotified++;
    } catch (err) {
      errors.push(`user ${userId}: ${err instanceof Error ? err.message : String(err)}`);
      logError("notifications:watchlist", err, { userId });
    }
  }

  return { usersNotified, itemsChecked: items.length, errors };
}
