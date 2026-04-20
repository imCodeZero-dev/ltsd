// Email utility — Nodemailer with SMTP (Gmail or any SMTP provider)
// Configure via EMAIL_* env vars

import nodemailer from "nodemailer";

function createTransport() {
  const port   = Number(process.env.EMAIL_PORT ?? 587);
  const secure = process.env.EMAIL_SECURE === "true"; // port 465 = true, port 587 = false

  // .trim() guards against CRLF line endings on Windows which silently corrupt values
  const user = process.env.EMAIL_USER?.trim() ?? "";
  const pass = process.env.EMAIL_PASS?.trim() ?? "";

  console.log("[email] transport config — host:", process.env.EMAIL_HOST?.trim(),
    "port:", port, "secure:", secure, "user:", user, "passLength:", pass.length);

  return nodemailer.createTransport({
    host:   process.env.EMAIL_HOST?.trim(),
    port,
    secure,
    auth:   { user, pass },
    tls:    { rejectUnauthorized: false },
  });
}

export interface EmailPayload {
  to:      string;
  subject: string;
  html:    string;
  text?:   string;
}

export async function sendEmail(payload: EmailPayload): Promise<void> {
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER) {
    console.log("[email] EMAIL_HOST not set — skipping send to", payload.to, "|", payload.subject);
    return;
  }

  const transport = createTransport();

  try {
    const info = await transport.sendMail({
      from:    `"LTSD" <${process.env.EMAIL_USER}>`,
      to:      payload.to,
      subject: payload.subject,
      html:    payload.html,
      text:    payload.text,
    });
    console.log("[email] sent to", payload.to, "— messageId:", info.messageId);
  } catch (err) {
    // Log the real error so it appears in server stdout
    console.error("[email] FAILED to send to", payload.to, "|", payload.subject);
    console.error("[email] Error:", err instanceof Error ? err.message : err);
    throw err; // re-throw so caller decides whether to swallow
  }
}

export async function sendWelcomeEmail(email: string): Promise<void> {
  await sendEmail({
    to:      email,
    subject: "Welcome to LTSD — Limited Time Super Deals!",
    html:    `<p>Welcome! Start tracking deals at <a href="${process.env.NEXTAUTH_URL}">LTSD</a>.</p>`,
    text:    `Welcome! Start tracking deals at ${process.env.NEXTAUTH_URL}`,
  });
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const url = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;
  await sendEmail({
    to:      email,
    subject: "Reset your LTSD password",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2 style="color:#000A1E">Reset your password</h2>
        <p>We received a request to reset the password for your LTSD account.</p>
        <p>
          <a href="${url}"
             style="display:inline-block;padding:12px 24px;background:#000A1E;color:#fff;border-radius:6px;text-decoration:none;font-weight:600">
            Reset Password
          </a>
        </p>
        <p style="color:#6B7280;font-size:14px">
          This link expires in <strong>1 hour</strong>. If you didn't request this, you can safely ignore this email.
        </p>
        <p style="color:#6B7280;font-size:12px">Or copy this URL: ${url}</p>
      </div>
    `,
    text: `Reset your LTSD password: ${url}\n\nLink expires in 1 hour. If you didn't request this, ignore this email.`,
  });
}

export async function sendPriceDropEmail(
  email:        string,
  dealTitle:    string,
  currentPrice: number,
  targetPrice:  number,
  dealUrl:      string,
): Promise<void> {
  await sendEmail({
    to:      email,
    subject: `Price drop alert: ${dealTitle}`,
    html:    `<p><strong>${dealTitle}</strong> is now <strong>$${(currentPrice / 100).toFixed(2)}</strong> (your target: $${(targetPrice / 100).toFixed(2)}). <a href="${dealUrl}">View deal →</a></p>`,
    text:    `${dealTitle} is now $${(currentPrice / 100).toFixed(2)} (target: $${(targetPrice / 100).toFixed(2)}). View: ${dealUrl}`,
  });
}
