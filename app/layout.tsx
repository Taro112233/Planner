// app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { AppHeader } from "@/components/shared/AppHeader";
import { CookieConsent } from "@/components/CookieConsent";
import { AuthGuard } from "@/components/AuthGuard";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: true,
};

export const metadata: Metadata = {
  title: "Planner — พื้นที่สำหรับทุกแผนของคุณ",
  description: "รวมแผน งาน และทีมไว้ในที่เดียว จัดระเบียบงาน ติดตามความคืบหน้า และเดินหน้าไปด้วยกันกับ Planner",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" suppressHydrationWarning>
      <head>
        {/* CRITICAL: Inline script — apply accent + mode before first paint to prevent flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var validAccents = ["neutral","amber","blue","cyan","emerald","fuchsia","green","indigo","lime","orange","pink","purple","red","rose","sky","teal","violet","yellow"];
                var accent = localStorage.getItem('nextjs-starter-accent') || 'amber';
                if (!validAccents.includes(accent)) accent = 'amber';
                var mode = localStorage.getItem('nextjs-starter-mode') || 'dark';
                if (mode !== 'light' && mode !== 'dark') mode = 'dark';
                var root = document.documentElement;
                root.setAttribute('data-accent', accent);
                root.setAttribute('data-theme', mode);
                if (mode === 'dark') root.classList.add('dark');
              } catch (e) {
                document.documentElement.setAttribute('data-accent', 'amber');
                document.documentElement.setAttribute('data-theme', 'dark');
                document.documentElement.classList.add('dark');
              }
            `,
          }}
        />
      </head>
      <body className={inter.variable} suppressHydrationWarning>
          <AuthGuard>
            <div className="min-h-screen bg-background">
              <AppHeader />
              <main className="relative">{children}</main>
            </div>
            <Toaster />
            <CookieConsent />
          </AuthGuard>
      </body>
    </html>
  );
}
