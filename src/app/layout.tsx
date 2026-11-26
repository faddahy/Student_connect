import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ADSENSE_CLIENT, APP_NAME, APP_TAGLINE, SITE_URL } from "@/lib/config";
import { RegisterSW } from "@/components/RegisterSW";
import { NetworkAds } from "@/components/NetworkAds";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: APP_NAME, template: `%s · ${APP_NAME}` },
  description: APP_TAGLINE,
  applicationName: APP_NAME,
  appleWebApp: { capable: true, title: APP_NAME, statusBarStyle: "black-translucent" },
  icons: {
    icon: [{ url: "/icons/192", type: "image/png", sizes: "192x192" }],
    apple: [{ url: "/icons/180", sizes: "180x180" }],
  },
  openGraph: { title: APP_NAME, description: APP_TAGLINE, siteName: APP_NAME, type: "website" },
  other: ADSENSE_CLIENT ? { "google-adsense-account": ADSENSE_CLIENT } : {},
};

export const viewport: Viewport = {
  themeColor: "#0b1220",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${jakarta.variable} font-sans antialiased`}>
        {children}
        <RegisterSW />
        <NetworkAds />
      </body>
    </html>
  );
}
