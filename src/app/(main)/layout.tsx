import { Header } from "@/components/layout/header";
import { BottomTabNav } from "@/components/layout/bottom-tab-nav";
import { OfflineNotice } from "@/components/pwa/offline-notice";
import { InstallPrompt } from "@/components/pwa/install-prompt";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-bg">
      {/* Offline banner — shown when navigator.onLine = false */}
      <OfflineNotice />

      {/* Desktop header — hidden on mobile */}
      <Header />

      {/* Page content — padded bottom on mobile for bottom nav */}
      <main className="flex-1 main-content-pb lg:pb-0">
        {children}
      </main>

      {/* Mobile bottom tab bar — hidden on desktop */}
      <BottomTabNav />

      {/* PWA install nudge */}
      <InstallPrompt />
    </div>
  );
}
