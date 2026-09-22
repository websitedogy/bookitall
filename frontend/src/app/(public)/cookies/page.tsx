import Link from "next/link";
import { InfoCard, InfoPage, LegalNav } from "@/features/legal/info-page";

import { publicPageMeta } from "@/shared/lib/seo";

export const metadata = publicPageMeta({
  title: "Cookie policy | Book It All",
  description: "Cookies and local storage used by Book It All for sign-in, cart and preferences — no ad trackers.",
  path: "/cookies",
});

export default function CookiesPage() {
  return (
    <InfoPage
      kicker="Legal"
      title="Cookie and local storage policy"
      intro="Book It All uses cookies and browser/app storage so the product works: you stay signed in, the cart is not emptied on refresh, and the website can talk to the API. We do not run third-party advertising pixels."
      updated="22 August 2026"
    >
      <LegalNav current="/cookies" />

      <InfoCard id="what" title="1. What we store on your device">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--text)]">
                <th className="py-2 pr-4 font-semibold">Name</th>
                <th className="py-2 pr-4 font-semibold">Type</th>
                <th className="py-2 font-semibold">Why</th>
              </tr>
            </thead>
            <tbody className="text-[var(--text-muted)]">
              <tr className="border-b border-[var(--border)] align-top">
                <td className="py-3 pr-4 font-medium text-[var(--text)]">bookitall-auth</td>
                <td className="py-3 pr-4">Local storage</td>
                <td className="py-3">Access and refresh tokens, name, phone, role — so website and app sessions continue.</td>
              </tr>
              <tr className="border-b border-[var(--border)] align-top">
                <td className="py-3 pr-4 font-medium text-[var(--text)]">bookitall-cart</td>
                <td className="py-3 pr-4">Local storage</td>
                <td className="py-3">Cart lines (listing, qty, dates, address) until you pay or clear the cart.</td>
              </tr>
              <tr className="border-b border-[var(--border)] align-top">
                <td className="py-3 pr-4 font-medium text-[var(--text)]">bookitall-last-order</td>
                <td className="py-3 pr-4">Session storage</td>
                <td className="py-3">Last checkout result so the success page can show booking numbers.</td>
              </tr>
              <tr className="align-top">
                <td className="py-3 pr-4 font-medium text-[var(--text)]">Location permission</td>
                <td className="py-3 pr-4">Browser / OS</td>
                <td className="py-3">Not a cookie. Used only when a page asks for GPS to sort nearby listings.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </InfoCard>

      <InfoCard id="duration" title="2. How long they last">
        <p>
          Auth storage lasts until you sign out or clear site data. Refresh tokens are issued for up to 90 days on the server. Cart storage lasts
          until checkout succeeds or you remove items. Session storage for the last order is cleared when the browser tab session ends.
        </p>
      </InfoCard>

      <InfoCard id="third" title="3. Third parties">
        <p>
          We do not drop advertising cookies. Maps or payment gateways in production may set their own cookies when you use those features; their
          policies apply on those domains. Google sign-in on the app is handled by Google’s SDK on the device.
        </p>
      </InfoCard>

      <InfoCard id="control" title="4. How to control them">
        <p>
          Sign out from Account to drop the auth session. Clear cookies and site data in the browser to remove cart and tokens. Block location in
          site settings if you do not want nearby distance. Blocking all storage will stop sign-in and cart from working.
        </p>
        <p>
          More on data use:{" "}
          <Link href="/privacy" className="font-medium text-[var(--primary)]">
            Privacy policy
          </Link>
          . Product rules:{" "}
          <Link href="/terms" className="font-medium text-[var(--primary)]">
            Terms of use
          </Link>
          .
        </p>
      </InfoCard>
    </InfoPage>
  );
}
