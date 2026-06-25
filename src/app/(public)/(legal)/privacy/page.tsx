import type { Metadata } from "next";
import { LegalTitle, H2, P, UL } from "../_prose";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How LTSD (Limited Time Super Deals) collects, uses, and protects your personal information.",
};

const UPDATED = "June 21, 2026";
const CONTACT = "support@limitedtimesuperdeals.app";

export default function PrivacyPolicyPage() {
  return (
    <article>
      <LegalTitle title="Privacy Policy" updated={UPDATED} />

      <P>
        This Privacy Policy explains how LTSD (&ldquo;Limited Time Super Deals&rdquo;,
        &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) collects, uses, and
        safeguards your information when you use our website at{" "}
        <strong>limitedtimesuperdeals.app</strong> and related services (the
        &ldquo;Service&rdquo;). By using the Service, you agree to the practices
        described below.
      </P>

      <H2>Information We Collect</H2>
      <P>We collect the following categories of information:</P>
      <UL>
        <li>
          <strong>Account information.</strong> When you create an account or sign in
          with Google, we receive your name, email address, and profile picture. If
          you register with email and password, we store your email and a securely
          hashed password.
        </li>
        <li>
          <strong>Preferences.</strong> The categories, brands, price ranges, discount
          thresholds, and notification settings you choose so we can personalize the
          deals and alerts you see.
        </li>
        <li>
          <strong>Notification data.</strong> If you enable push notifications, we
          store the push subscription your browser provides so we can deliver alerts.
        </li>
        <li>
          <strong>Usage data.</strong> Basic technical information such as device type,
          browser, and pages viewed, used to operate and improve the Service.
        </li>
      </UL>

      <H2>How We Use Your Information</H2>
      <UL>
        <li>To provide, maintain, and personalize the Service.</li>
        <li>To send deal alerts and notifications you have opted into, via email or push.</li>
        <li>To authenticate you and keep your account secure.</li>
        <li>To respond to your requests and provide support.</li>
        <li>To analyze and improve the performance and features of the Service.</li>
      </UL>

      <H2>Sign in with Google</H2>
      <P>
        When you choose to sign in with Google, Google shares your basic profile
        information (name, email address, and profile image) with us, consistent with
        the permissions you grant. We use this information solely to create and manage
        your account. We do not access your Google contacts, files, or any other Google
        data, and we do not sell this information. Google&rsquo;s handling of your data
        is governed by Google&rsquo;s own Privacy Policy.
      </P>

      <H2>Affiliate Links</H2>
      <P>
        LTSD is a participant in affiliate programs, including the Amazon Associates
        Program. When you click a deal and make a purchase, we may earn a commission at
        no additional cost to you. Affiliate links may include a tag that identifies us
        as the referrer.
      </P>

      <H2>How We Share Information</H2>
      <P>
        We do not sell your personal information. We share data only with service
        providers who help us operate the Service, such as:
      </P>
      <UL>
        <li>Authentication and database hosting providers.</li>
        <li>Email delivery providers used to send your alerts.</li>
        <li>Image and content delivery providers.</li>
        <li>When required by law, or to protect our rights and the safety of users.</li>
      </UL>

      <H2>Cookies</H2>
      <P>
        We use cookies and similar technologies that are necessary to keep you signed
        in and to remember your preferences. You can control cookies through your
        browser settings, though some features may not function without them.
      </P>

      <H2>Data Retention</H2>
      <P>
        We retain your information for as long as your account is active or as needed to
        provide the Service. You may delete your account at any time, after which we
        will delete or anonymize your personal information except where we are required
        to retain it by law.
      </P>

      <H2>Your Rights</H2>
      <P>
        Depending on your location, you may have the right to access, correct, export,
        or delete your personal information, and to withdraw consent for processing. To
        exercise these rights, contact us at the address below.
      </P>

      <H2>Children&rsquo;s Privacy</H2>
      <P>
        The Service is not directed to children under 13, and we do not knowingly
        collect personal information from them.
      </P>

      <H2>Changes to This Policy</H2>
      <P>
        We may update this Privacy Policy from time to time. We will post the revised
        version on this page and update the &ldquo;Last updated&rdquo; date above.
      </P>

      <H2>Contact Us</H2>
      <P>
        If you have questions about this Privacy Policy, contact us at{" "}
        <a href={`mailto:${CONTACT}`} className="text-badge-bg hover:underline font-semibold">
          {CONTACT}
        </a>
        .
      </P>
    </article>
  );
}
