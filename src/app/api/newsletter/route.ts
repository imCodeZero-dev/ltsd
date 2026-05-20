import { db } from "@/lib/db";
import { ok, err, created } from "@/lib/api";

export async function POST(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const email = (body?.email ?? "").trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return err("Please enter a valid email address.", 400);
    }

    const existing = await db.newsletterSubscriber.findUnique({ where: { email } });
    if (existing) {
      return ok({ alreadySubscribed: true });
    }

    const subscriber = await db.newsletterSubscriber.create({ data: { email } });
    return created({ id: subscriber.id, email: subscriber.email });
  } catch {
    return err("Failed to subscribe. Please try again.", 500);
  }
}
