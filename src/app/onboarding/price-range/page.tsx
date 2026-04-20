"use client";

// Figma: not in Figma scope — redirecting to success

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function OnboardingPriceRangePage() {
  const router = useRouter();
  useEffect(() => { router.replace("/onboarding/success"); }, [router]);
  return null;
}
