import { Header } from "@/components/layout/header";
import { BottomTabNav } from "@/components/layout/bottom-tab-nav";
import { AppFooter } from "@/components/layout/app-footer";
import { OfflineNotice } from "@/components/pwa/offline-notice";
import { InstallPrompt } from "@/components/pwa/install-prompt";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-bg">
      <OfflineNotice />
      <Header />

      {/* Page content */}
      <main className="flex-1 pb-20 md:pb-0">
        {children}
      </main>

      {/* Desktop footer */}
      <div className="hidden md:block">
        <AppFooter />
      </div>

      {/* Mobile bottom nav */}
      <BottomTabNav />
      <InstallPrompt />
    </div>
  );
}
