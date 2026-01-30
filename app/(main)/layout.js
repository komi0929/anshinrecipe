"use client";

import { DataProvider } from "@/components/DataProvider";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import { ToastProvider } from "@/components/Toast";
import BottomNav from "@/components/BottomNav";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";

export default function MainLayout({ children }) {
  return (
    <DataProvider>
      <GoogleAnalytics
        GA_MEASUREMENT_ID={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}
      />
      <ToastProvider>
        <div className="app-container flex flex-col min-h-screen">
          <main className="flex-grow pb-16">{children}</main>

          <BottomNav />
          <PWAInstallPrompt />
        </div>
      </ToastProvider>
    </DataProvider>
  );
}
