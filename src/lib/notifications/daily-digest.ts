/**
 * Daily personalized deal-digest email.
 *
 * Runs once daily (called from the existing daily-sync cron — no new
 * schedule). For each user with at least one category preference and email
 * alerts enabled: picks new deals (synced in the last 24h) from their
 * categories, ranked by newest + biggest discount + Lightning/Limited Time
 * first, excludes deals already shown in a previous digest, and skips the
 * send entirely when there's nothing new (never send an empty "nothing new"
 * email).
 */

import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { logError } from "@/lib/system-log";
import type { DealType } from "@prisma/client";

const ALREADY_SHOWN_LOOKBACK_DAYS = 14;

interface DigestDeal {
  id: string; title: string; slug: string; imageUrl: string | null;
  currentPrice: number; originalPrice: number | null; discountPercent: number | null;
  dealType: DealType; expiresAt: Date | null;
}

function perCategoryQuota(categoryCount: number): number {
  if (categoryCount <= 1) return 4;
  if (categoryCount === 2) return 3;
  return 2;
}

function rankDeals(deals: DigestDeal[]): DigestDeal[] {
  const priorityType = (t: DealType) => (t === "LIGHTNING_DEAL" || t === "LIMITED_TIME" ? 0 : 1);
  return [...deals].sort((a, b) => {
    if (priorityType(a.dealType) !== priorityType(b.dealType)) return priorityType(a.dealType) - priorityType(b.dealType);
    const discountDiff = (b.discountPercent ?? 0) - (a.discountPercent ?? 0);
    if (discountDiff !== 0) return discountDiff;
    const aExpires = a.expiresAt?.getTime() ?? Infinity;
    const bExpires = b.expiresAt?.getTime() ?? Infinity;
    return aExpires - bExpires;
  });
}

function buildEmailHtml(byCategory: { categoryName: string; deals: DigestDeal[] }[], baseUrl: string): string {
  const sections = byCategory.map(({ categoryName, deals }) => `
    <h3 style="font-size:14px;color:#000A1E;margin:20px 0 8px">${categoryName}</h3>
    <table role="presentation" width="100%">
      ${deals.map(d => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #E7E8E9">
            <table role="presentation" width="100%"><tr>
              <td style="width:64px;vertical-align:top">
                ${d.imageUrl ? `<img src="${d.imageUrl}" width="56" height="56" style="border-radius:8px;object-fit:cover" alt="">` : ""}
              </td>
              <td style="padding-left:12px;vertical-align:top">
                <p style="margin:0;font-size:14px;font-weight:600;color:#000A1E">${d.title.slice(0, 80)}</p>
                <p style="margin:4px 0 0;font-size:13px;color:#000A1E">
                  <strong>$${d.currentPrice.toFixed(2)}</strong>
                  ${d.originalPrice ? `<span style="color:#6B7280;text-decoration:line-through;margin-left:6px">$${d.originalPrice.toFixed(2)}</span>` : ""}
                  ${d.discountPercent ? `<span style="color:#B45309;margin-left:6px">${d.discountPercent}% off</span>` : ""}
                </p>
                <a href="${baseUrl}/deals/${d.slug}" style="font-size:12px;color:#000A1E;font-weight:600">View Deal →</a>
              </td>
            </tr></table>
          </td>
        </tr>`).join("")}
    </table>`).join("");

  return `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
      <h2 style="color:#000A1E">Your newest LTSD deals just dropped!</h2>
      <p style="color:#6B7280;font-size:14px">Here's a sample of the deals we found for you.</p>
      ${sections}
      <p style="margin-top:20px">
        <a href="${baseUrl}/deals" style="display:inline-block;padding:12px 24px;background:#000A1E;color:#fff;border-radius:6px;text-decoration:none;font-weight:600">
          See All of Your Deals
        </a>
      </p>
      <p style="color:#6B7280;font-size:12px;margin-top:20px">
        <a href="${baseUrl}/settings/preferences">Manage deal categories</a> ·
        <a href="${baseUrl}/settings">Manage alert preferences</a> ·
        <a href="${baseUrl}/settings">Unsubscribe from daily deal emails</a>
      </p>
    </div>`;
}

export async function sendDailyDigests(): Promise<{ usersEmailed: number; usersSkipped: number; errors: string[] }> {
  const errors: string[] = [];
  const baseUrl = process.env.NEXTAUTH_URL ?? "https://limitedtimesuperdeals.app";
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const shownCutoff = new Date(Date.now() - ALREADY_SHOWN_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);

  const users = await db.user.findMany({
    where: {
      isActive: true,
      preferences: { emailAlerts: true },
      categoryPreferences: { some: {} },
    },
    select: {
      id: true, email: true,
      preferences: { select: { alertThresholdPercent: true } },
      categoryPreferences: { select: { category: { select: { id: true, name: true, slug: true } } } },
    },
  });

  let usersEmailed = 0;
  let usersSkipped = 0;

  for (const user of users) {
    try {
      const categories = user.categoryPreferences.map(c => c.category);
      const quota = perCategoryQuota(categories.length);
      const totalCap = 8;
      const minDiscount = user.preferences?.alertThresholdPercent ?? 0;

      const alreadyShown = await db.alertHistory.findMany({
        where: { userId: user.id, type: "SYSTEM", channel: "EMAIL", sentAt: { gte: shownCutoff } },
        select: { dealId: true },
      });
      const excludeIds = new Set(alreadyShown.map(a => a.dealId).filter((id): id is string => !!id));

      const byCategory: { categoryName: string; deals: DigestDeal[] }[] = [];
      const usedDealIds = new Set<string>();
      let totalSelected = 0;

      for (const cat of categories) {
        if (totalSelected >= totalCap) break;

        const candidates = await db.deal.findMany({
          where: {
            isActive: true,
            createdAt: { gte: since },
            id: { notIn: [...excludeIds, ...usedDealIds] },
            categories: { some: { categoryId: cat.id } },
            ...(minDiscount > 0 && { discountPercent: { gte: minDiscount } }),
          },
          select: { id: true, title: true, slug: true, imageUrl: true, currentPrice: true, originalPrice: true, discountPercent: true, dealType: true, expiresAt: true },
          take: 50,
        });

        const ranked = rankDeals(candidates).slice(0, Math.min(quota, totalCap - totalSelected));
        if (!ranked.length) continue;

        byCategory.push({ categoryName: cat.name, deals: ranked });
        for (const d of ranked) usedDealIds.add(d.id);
        totalSelected += ranked.length;
      }

      if (totalSelected === 0) {
        usersSkipped++;
        continue;
      }

      await sendEmail({
        to: user.email,
        subject: "Your newest LTSD deals just dropped!",
        html: buildEmailHtml(byCategory, baseUrl),
      });

      const allDealIds = [...usedDealIds];
      await db.alertHistory.createMany({
        data: allDealIds.map(dealId => ({ userId: user.id, dealId, type: "SYSTEM" as const, channel: "EMAIL" as const, success: true })),
      });
      await db.notification.create({
        data: {
          userId: user.id,
          type:   "SYSTEM",
          title:  "New deals in your feed",
          body:   `${totalSelected} new deal${totalSelected === 1 ? "" : "s"} in your categories.`,
        },
      });

      usersEmailed++;
    } catch (err) {
      errors.push(`user ${user.id}: ${err instanceof Error ? err.message : String(err)}`);
      logError("notifications:digest", err, { userId: user.id });
    }
  }

  return { usersEmailed, usersSkipped, errors };
}
