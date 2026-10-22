import {
  OG_IMAGE,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_URL,
} from "@/lib/site";

/**
 * Structured data (JSON-LD) untuk halaman publik SuperPOS.
 * Ditulis sebagai server component dan ditempel di root layout,
 * sehingga crawler menerima schema di setiap halaman.
 */
export default function StructuredData() {
  const organizationId = `${SITE_URL}/#organization`;
  const websiteId = `${SITE_URL}/#website`;
  const appId = `${SITE_URL}/#software`;

  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationId,
        name: SITE_NAME,
        url: SITE_URL,
        logo: `${SITE_URL}${OG_IMAGE.url}`,
        description: SITE_DESCRIPTION,
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        url: SITE_URL,
        name: SITE_NAME,
        description: SITE_DESCRIPTION,
        inLanguage: "id-ID",
        publisher: { "@id": organizationId },
      },
      {
        "@type": "SoftwareApplication",
        "@id": appId,
        name: `${SITE_NAME} - ${SITE_TAGLINE}`,
        url: SITE_URL,
        description: SITE_DESCRIPTION,
        applicationCategory: "BusinessApplication",
        applicationSubCategory: "Point of Sale",
        operatingSystem: "Web, Android, iOS",
        inLanguage: "id-ID",
        publisher: { "@id": organizationId },
        // `offers` sengaja tidak diisi karena harga belum diumumkan di halaman publik.
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      // JSON-LD harus inline; tidak ada input pengguna di dalamnya.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
