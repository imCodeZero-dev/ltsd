import type { Metadata } from "next";
import Link from "next/link";
import { LegalTitle, H2, P, UL } from "../_prose";

export const metadata: Metadata = {
  title: "Terms and Conditions",
  description:
    "The terms and conditions that govern your use of LTSD (Limited Time Super Deals).",
};

const UPDATED = "June 21, 2026";
const CONTACT = "support@limitedtimesuperdeals.app";

export default function TermsPage() {
  return (
    <article>
      <LegalTitle title="Terms and Conditions" updated={UPDATED} />

      <P>
        These Terms and Conditions (&ldquo;Terms&rdquo;) govern your access to and use
        of LTSD (&ldquo;Limited Time Super Deals&rdquo;, &ldquo;we&rdquo;,
        &ldquo;us&rdquo;, or &ldquo;our&rdquo;), available at{" "}
        <strong>limitedtimesuperdeals.app</strong> (the &ldquo;Service&rdquo;). By
        accessing or using the Service, you agree to be bound by these Terms. If you do
        not agree, please do not use the Service.
      </P>

      <H2>The Service</H2>
      <P>
        LTSD helps you discover deals, track product prices, and receive notifications
        based on your preferences. Deals, prices, and availability are provided for
        convenience and may change at any time. We are not the seller of any product
        and do not process purchases; transactions occur on third-party retailer
        websites subject to their own terms.
      </P>

      <H2>Accounts</H2>
      <UL>
        <li>You must provide accurate information when creating an account.</li>
        <li>You are responsible for maintaining the confidentiality of your credentials and for all activity under your account.</li>
        <li>You must be at least 13 years old to use the Service.</li>
        <li>You may not share, transfer, or use another person&rsquo;s account without permission.</li>
      </UL>

      <H2>Acceptable Use</H2>
      <P>You agree not to:</P>
      <UL>
        <li>Use the Service for any unlawful purpose or in violation of these Terms.</li>
        <li>Attempt to gain unauthorized access to the Service or its systems.</li>
        <li>Scrape, copy, or redistribute content except as permitted by us.</li>
        <li>Interfere with or disrupt the integrity or performance of the Service.</li>
      </UL>

      <H2>Affiliate Disclosure</H2>
      <P>
        LTSD participates in affiliate programs, including the Amazon Associates
        Program. We may earn a commission when you purchase through links on the
        Service, at no additional cost to you. This does not influence the prices you
        pay.
      </P>

      <H2>Pricing and Availability</H2>
      <P>
        Prices, discounts, and product information are sourced from third parties and
        may be inaccurate, outdated, or unavailable. We do not guarantee that any deal,
        price, or product will be available, and we are not responsible for the actions,
        products, or content of third-party retailers.
      </P>

      <H2>Intellectual Property</H2>
      <P>
        The Service, including its design, logos, and content created by us, is owned by
        LTSD and protected by applicable laws. You may not use our branding without our
        prior written consent.
      </P>

      <H2>Disclaimer of Warranties</H2>
      <P>
        The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;
        without warranties of any kind, whether express or implied, including
        merchantability, fitness for a particular purpose, and non-infringement. We do
        not warrant that the Service will be uninterrupted, secure, or error-free.
      </P>

      <H2>Limitation of Liability</H2>
      <P>
        To the maximum extent permitted by law, LTSD shall not be liable for any
        indirect, incidental, special, consequential, or punitive damages, or any loss
        of profits or data, arising from your use of or inability to use the Service.
      </P>

      <H2>Termination</H2>
      <P>
        We may suspend or terminate your access to the Service at any time if you
        violate these Terms or for any other reason. You may stop using the Service and
        delete your account at any time.
      </P>

      <H2>Changes to These Terms</H2>
      <P>
        We may update these Terms from time to time. Continued use of the Service after
        changes take effect constitutes acceptance of the revised Terms.
      </P>

      <H2>Privacy</H2>
      <P>
        Your use of the Service is also governed by our{" "}
        <Link href="/privacy" className="text-badge-bg hover:underline font-semibold">
          Privacy Policy
        </Link>
        .
      </P>

      <H2>Contact Us</H2>
      <P>
        If you have questions about these Terms, contact us at{" "}
        <a href={`mailto:${CONTACT}`} className="text-badge-bg hover:underline font-semibold">
          {CONTACT}
        </a>
        .
      </P>
    </article>
  );
}
