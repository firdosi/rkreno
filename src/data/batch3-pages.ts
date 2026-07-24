import type { BatchPage } from './batch1-pages';

export const batch3Pages: Record<string, BatchPage> = {
  '/servis-cuci-rumah-kl/': {
    eyebrow: 'Home Cleaning · Kuala Lumpur',
    title: 'Servis Cuci Rumah KL',
    summary: 'Enquire about general, deep, move-in or move-out, and post-renovation home cleaning in Kuala Lumpur, subject to the current supported scope.',
    image: '/assets/media/detailed-kitchen-cleaning-kl-67669628.jpg',
    imageAlt: 'General kitchen cleaning service imagery',
    introTitle: 'Define the property and cleaning scope first',
    intro: 'Property size, furnishing, access and current condition affect the work required. Clear photos or a site review help establish the areas to include before pricing.',
    sections: [
      {
        title: 'Cleaning requirements to discuss',
        items: [
          { title: 'General home cleaning', text: 'Routine work for agreed accessible living areas, bedrooms, bathrooms, kitchen surfaces and floors.' },
          { title: 'Deep cleaning', text: 'A more detailed one-off scope based on the property condition and areas confirmed during enquiry.' },
          { title: 'Move-in or move-out', text: 'Cleaning for an empty or partly furnished property when currently supported and agreed.' },
          { title: 'Post-renovation cleaning', text: 'Dust and residue assessment after renovation, with difficult marks and exclusions identified before work.' },
        ],
      },
      {
        title: 'Areas commonly reviewed',
        items: [
          { title: 'Living and sleeping areas', text: 'Accessible surfaces, floors, fittings and furniture included in the confirmed checklist.' },
          { title: 'Kitchen and bathrooms', text: 'Requested accessible surfaces and fixtures, with delicate materials or heavy build-up identified in advance.' },
          { title: 'Windows and cabinets', text: 'Interior or safely accessible areas only when they are included in the agreed scope.' },
        ],
      },
      {
        title: 'Quotation and service area',
        text: 'Share the Kuala Lumpur location, property type, approximate size, furnished condition and clear photos. Pricing depends on those details, access and the confirmed checklist. Current availability must be confirmed during enquiry.',
        items: [
          { title: 'Read the cleaning guide', text: 'Prepare a useful room-by-room cleaning brief.', href: '/servis-cuci-rumah-kl-the-ultimate-2026-guide-to-a-spotless-home/' },
          { title: 'Browse property services', text: 'See other renovation and property-service options.', href: '/services/' },
          { title: 'Request a review', text: 'Send the property location and photos for an initial discussion.', href: '/contact-us/' },
        ],
      },
    ],
    faqs: [
      { question: 'Is there a fixed cleaning price?', answer: 'No fixed price is published. Property size, condition, furnishing, access and the agreed cleaning areas affect the quotation.' },
      { question: 'Can stain removal be promised?', answer: 'No. Some marks or aged surfaces may not respond to normal cleaning, and aggressive treatment may cause damage. The condition should be reviewed first.' },
      { question: 'Is same-day cleaning available?', answer: 'Availability is not assumed. Ask about the current schedule when sending the property details.' },
    ],
    cta: 'Need a home-cleaning quotation?',
    ctaText: 'Send the location, property size, current condition and photos of the areas to be cleaned.',
  },
};
