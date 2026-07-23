export function buildLegalRequirements() {
  return `# RK Reno legal-page requirements

This is a requirements list, not legal advice or final legal wording. The owner must confirm business practices and obtain professional review where appropriate.

## Required pages and notices

### Privacy Policy

- Identify the legal business/operator name, registration details if applicable, postal address, email and telephone contact.
- Explain enquiry-form fields, purposes, lawful basis/consent, recipients, retention period, access/correction/deletion requests and complaint contact.
- Disclose hosting, SMTP/email delivery, Cloudflare Turnstile, Google Analytics/Tag Manager and Meta Pixel processing.
- State whether information leaves Malaysia and what safeguards apply.

### Terms of Use

- Define permitted website use, service-enquiry limitations, intellectual-property ownership, third-party links, accuracy limitations and governing law.
- Do not imply quoted prices, timelines, warranties or service guarantees unless the owner approves them.

### Cookie notice and consent

- Inventory essential, analytics, advertising and Turnstile cookies/storage before launch.
- Decide whether prior consent is required for GA4, GTM and Meta Pixel in the target jurisdictions.
- Provide reject/manage choices when required; do not load non-essential tracking before valid consent.

## Contact-form wording and retention

- Keep an explicit privacy-consent statement beside the form.
- State who receives enquiries, the expected retention period and whether data enters a CRM or only email.
- Provide a privacy-policy link and explain spam screening by Cloudflare Turnstile.
- Confirm deletion and data-subject request handling.

## Owner information required

- Legal business name and registration number.
- Business and privacy contact addresses.
- Approved retention periods and processors.
- Countries served and applicable governing law.
- Analytics/advertising tools that will actually be enabled.
- Approved warranty, pricing and liability wording.

No legal page should be published as final until the owner and, where necessary, a qualified professional approve it.
`;
}

export function buildOwnerDecisions({ records, claims }) {
  const portfolios = records.filter((record) =>
    record['Portfolio authenticity status'] !== 'NOT_APPLICABLE');
  const images = records.filter((record) => record['Image dependency status'].startsWith('BLOCKED'));
  const ecommerce = records.filter((record) =>
    /^\/(?:product|product-category|shop|wishlist|cart|checkout|my-account)\//.test(record['Current route']));
  const archives = records.filter((record) => record['WordPress content type'] === 'taxonomy');
  const claimRoutes = new Set(claims.filter((claim) =>
    claim['Verification status'] === 'OWNER_CONFIRMATION_REQUIRED').map((claim) => claim.Route));
  return `# RK Reno owner decisions required

These questions are grouped to avoid repetitive page-by-page requests. No item below is approved by this report.

## Portfolio authenticity

Confirm whether any of the ${portfolios.length} portfolio routes represents real RK Reno work. Current evidence shows repeated foreign theme-demo material. For any genuine project, provide the client-approved title, Malaysian location, scope, completion period and original photographs. Otherwise approve removal.

## Testimonials

Confirm that Vincent Pham/P., Sophia Martinez, Emily Chen and any other named testimonials are not RK Reno customers. Supply explicit publication permission and source evidence for any real testimonial.

## Team and leadership

Provide real names, roles, biographies and approved photos if a team section is wanted. Decide whether \`/our-team/\` remains; the imported \`/team-detail/\` is proposed for removal.

## Company history

Supply the genuine founding year, milestones, legal business identity and verifiable history. Do not reuse Vastcon, Vinceta, PCL or foreign construction-company copy.

## Business claims, certifications, ratings and project counts

Claims on ${claimRoutes.size} non-demo routes need owner evidence. Group evidence by: customer/project counts, 24/7 availability, safety compliance, guarantees/warranties, ratings, electrician/wireman credentials and years of experience. Unsupported claims should be removed, not softened into new invented numbers.

## Career page

Confirm whether RK Reno is actively recruiting and provide real Malaysian role/location/contact details. Otherwise approve 410 for the Sydney/Melbourne demo career page.

## Pricing

Confirm whether any prices may be published and their validity conditions. Imported theme pricing and unsupported sample prices must be removed.

## Missing project photographs

${images.length} routes have missing or hotlinked image dependencies. Provide original approved media, confirm reuse rights, and identify which images show genuine RK Reno work.

## Legal information

Provide the information listed in [legal-page-requirements.md](legal-page-requirements.md), including legal identity, retention periods, processors, governing law and approved analytics/advertising configuration.

## Ecommerce removal

Confirm RK Reno does not operate an online product store and approve removal of all ${ecommerce.length} live/export ecommerce routes, including Cart, Checkout, My Account, Shop, Wishlist, product category and product pages.

## Category/archive strategy

Approve temporary noindex for thin category/tag archives, the three exact tag-to-category merges, blog pagination consolidation and service-category consolidation. There are ${archives.length} taxonomy routes in the reconciled set (23 generated plus 7 existing portfolio-taxonomy 404s).

## Final approval

Approve or amend the route-level actions in [route-disposition-plan.csv](route-disposition-plan.csv) before any redirect, 410, noindex or redesign implementation begins.
`;
}
