"use client";

// Figma: not in Figma scope — brands/price-range steps removed from design
// Redirecting to deal-types to keep the 2-step flow

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function OnboardingBrandsPage() {
  const router = useRouter();
  useEffect(() => { router.replace("/onboarding/deal-types"); }, [router]);
  return null;
}
