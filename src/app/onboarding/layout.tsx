import Image from "next/image";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex flex-col bg-bg overflow-hidden">
      {/* Orange radial gradient blob */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-37.5 -left-25 w-150 h-150 rounded-full opacity-[0.08]"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(254,152,0,1) 0%, rgba(254,152,0,0) 70%)",
          filter: "blur(60px)",
        }}
      />

      {/* LTSD Logo — top-left, outside content column */}
      <div className="absolute top-4 left-4 z-20">
        <Image
          src="/images/ltsd-logo.png"
          alt="LTSD Super Deals"
          width={56}
          height={56}
          priority
          style={{ width: 56, height: 56 }}
        />
      </div>

      {/* Content — centered, max 480px */}
      <div className="relative z-10 flex flex-col flex-1 w-full max-w-[480px] mx-auto px-4 pt-20 pb-8">
        {children}
      </div>
    </div>
  );
}
