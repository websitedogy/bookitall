import type { Metadata, Viewport } from "next";
import { Inter, Poppins, Source_Serif_4 } from "next/font/google";
import Script from "next/script";
import { FixedBackButton } from "@/features/public-site";
import { ServiceCatalogProvider } from "@/features/services/service-catalog-provider";
import { JsonLd } from "@/shared/ui/json-ld";
import { organizationGraph } from "@/features/seo/json-ld";
import { SITE_URL } from "@/shared/lib/site-url";
import { GA_MEASUREMENT_ID, GSC_VERIFICATION } from "@/shared/lib/analytics";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans-face",
  subsets: ["latin"],
  display: "swap",
});

const poppins = Poppins({
  variable: "--font-location-face",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  variable: "--font-serif-face",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: "Book It All",
  title: {
    default: "Book Hotels, Tours, Cabs & Home Services | Book It All",
    template: "%s | Book It All",
  },
  keywords: [
    "Book It All",
    "Hyderabad hotel booking",
    "Bhadrachalam local business",
    "book hotels Hyderabad",
    "cab booking Hyderabad",
    "home services Hyderabad",
    "tour packages Hyderabad",
  ],
  description:
    "Book It All is a Bhadrachalam-based local marketplace for hotel booking, cabs, tours and home services in Hyderabad. Compare live listings, choose a slot, and pay securely.",
  appleWebApp: {
    capable: true,
    title: "Book It All",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [{ url: "/icons/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icons/icon.svg" }],
  },
  openGraph: {
    title: "Book Hotels, Tours, Cabs & Home Services | Book It All",
    description: "Book It All is a Bhadrachalam-based local marketplace for hotel booking, cabs, tours and home services in Hyderabad. Compare live listings, choose a slot, and pay securely.",
    type: "website",
    siteName: "Book It All",
    locale: "en_IN",
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "Book Hotels, Tours, Cabs & Home Services | Book It All",
    description: "Book It All helps you reserve hotels, tours, cabs and home services in Hyderabad from one trusted local marketplace.",
  },
  verification: GSC_VERIFICATION ? { google: GSC_VERIFICATION } : undefined,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
      <html lang="en" className={`${inter.variable} ${sourceSerif.variable} ${poppins.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full bg-white font-sans text-[var(--text)]" suppressHydrationWarning>
        <JsonLd data={organizationGraph()} />
        {GA_MEASUREMENT_ID ? (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} strategy="afterInteractive" />
            <Script id="ga4" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_MEASUREMENT_ID}',{anonymize_ip:true});`}
            </Script>
          </>
        ) : null}
        <Script id="pwa-install-capture" strategy="beforeInteractive">
          {`(function(){
            window.addEventListener('beforeinstallprompt', function(e){
              e.preventDefault();
              window.__biaDeferredPrompt = e;
            });
            window.addEventListener('appinstalled', function(){
              try { localStorage.setItem('bookitall-pwa-installed','1'); } catch (err) {}
              window.__biaDeferredPrompt = null;
            });
          })();`}
        </Script>
        <ServiceCatalogProvider>
          <FixedBackButton />
          {children}
        </ServiceCatalogProvider>
      </body>
    </html>
  );
}
