import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-bg overflow-hidden px-4 py-12">
      {/* Figma background: blurred orange gradient blob (opacity 8%) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-268.5 left-27.75 w-304.25 h-304.25 rounded-full opacity-[0.08]"
        style={{
          background: "linear-gradient(180deg, rgba(152,91,0,0) 0%, rgba(254,152,0,1) 100%)",
          filter: "blur(80px)",
        }}
      />
      {/* Content — 366px wide (matches Figma form width), no card */}
      <div className="relative z-10 w-full max-w-91.5 flex flex-col items-center gap-6">
        {/* LTSD Logo */}
        <Image
          src="/images/ltsd-logo.png"
          alt="LTSD Super Deals"
          width={72}
          height={72}
          priority
          style={{ width: 72, height: 72 }}
        />
        {children}
      </div>
    </div>
  );
}
