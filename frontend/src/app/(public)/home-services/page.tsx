import { HOME_SERVICES_SEO } from "@/features/seo/category-copy";
import { publicPageMeta } from "@/shared/lib/seo";
import { ServicesCatalog } from "@/features/home/components/services-catalog";
import { JsonLd } from "@/shared/ui/json-ld";
import { faqJsonLd, serviceJsonLd } from "@/features/seo/json-ld";
import { SITE_URL } from "@/shared/lib/site-url";

export const metadata = publicPageMeta({
  title: HOME_SERVICES_SEO.title,
  description: HOME_SERVICES_SEO.description,
  path: HOME_SERVICES_SEO.path,
});

export default function Page() {
  const seo = HOME_SERVICES_SEO;
  return (
    <>
      <JsonLd
        data={serviceJsonLd({
          name: seo.h1,
          serviceType: seo.serviceType,
          url: `${SITE_URL}${seo.path}`,
          description: seo.description,
        })}
      />
      <JsonLd data={faqJsonLd(seo.faqs)} />
      <ServicesCatalog heading={seo.h1} />
    </>
  );
}
