import type { PortfolioData } from '@/interfaces/Portfolio';

// Temporary content only. Replace this object with the admin/API response later.
// Medium IDs are references to administrator-defined categories, not an enum.
export const fakeData: PortfolioData = {
  artist: { name: 'GHAZAL SHAFIEI', description: 'A multidisciplinary artist working across painting, illustration, animation and design.' },
  mediums: [{ id: 'charcoal', label: 'Charcoal' }, { id: 'digital-painting', label: 'Digital Painting' }],
  paintingCategories: [
    { id: 'charcoal', label: 'Charcoal' },
    { id: 'digital-painting', label: 'Digital Painting' },
    {
      id: 'series',
      label: 'Series',
      children: [
        { id: 'roxy-series', label: 'Roxy' },
        { id: 'table-series', label: 'Table Studies' },
      ],
    },
  ],
  artworks: [
    { id: 'still-life', title: 'Still Life in Shadow', year: 2023, createdAt: '2023-04-12', mediumId: 'digital-painting', paintingCategoryIds: ['digital-painting', 'table-series'], description: 'A study of light, everyday objects and negative space.', dimensions: '3000 × 4000 px', image: { src: '/artworks/artwork-13.png', alt: 'Black and white still life with a hanging lamp and folded fabric', width: 840, height: 1121, flipX: true }, table: { rotation: -10, aspectRatio: 0.75 } },
    { id: 'table-study', title: 'Table Study', year: 2022, createdAt: '2022-09-08', mediumId: 'digital-painting', paintingCategoryIds: ['digital-painting', 'table-series'], description: 'An observational composition in black and white.', dimensions: '3000 × 4000 px', image: { src: '/artworks/artwork-7.png', alt: 'A monochrome study of a plate and objects on a table', width: 841, height: 1122 }, table: { rotation: -12.96, aspectRatio: 0.75 } },
    { id: 'in-transit', title: 'In Transit', year: 2024, createdAt: '2024-02-16', mediumId: 'charcoal', paintingCategoryIds: ['charcoal'], description: 'An exploratory line study based on original photography.', dimensions: '3000 × 4000 px', image: { src: '/artworks/artwork-16.png', alt: 'An intricate line drawing of a quiet moment inside a vehicle', width: 840, height: 1121, flipX: true }, table: { rotation: 10, aspectRatio: 0.75 } },
    { id: 'floating', title: 'Floating', year: 2025, createdAt: '2025-07-03', mediumId: 'digital-painting', paintingCategoryIds: ['digital-painting'], description: 'A figure suspended in water, light and colour.', dimensions: '4000 × 3000 px', image: { src: '/images/5.jpg', alt: 'A painted figure floating in turquoise water', width: 4000, height: 3000, rotate: -90 }, table: { rotation: 10, aspectRatio: 1.334 } },
    { id: 'at-the-table', title: 'At the Table', year: 2023, createdAt: '2023-11-20', mediumId: 'digital-painting', paintingCategoryIds: ['digital-painting', 'table-series'], description: 'A shadow-pass study of a plate and cutlery.', dimensions: '3000 × 4000 px', image: { src: '/artworks/artwork-6.png', alt: 'Black and white painting of a plate, fork and knife', width: 838, height: 1120 }, table: { rotation: 0, aspectRatio: 0.748 } },
    { id: 'roxy-line-study', title: 'Roxy — Line Study', year: 2024, createdAt: '2024-05-09', mediumId: 'charcoal', paintingCategoryIds: ['charcoal', 'roxy-series'], description: 'The original line study for Roxy On A Ride.', dimensions: '3000 × 4000 px', image: { src: '/artworks/artwork-12.png', alt: 'A line drawing of a cat riding in a car', width: 840, height: 1121 }, table: { rotation: 14.96, aspectRatio: 0.75 } },
    { id: 'roxy-on-a-ride', title: 'Roxy On A Ride', year: 2024, createdAt: '2024-06-18', mediumId: 'digital-painting', paintingCategoryIds: ['digital-painting', 'roxy-series'], description: 'Digital Painting based on Original Photography, shadow pass', dimensions: '3000*4000px', image: { src: '/artworks/artwork-19.png', alt: 'Roxy the cat beside a steering wheel, rendered in bold black and white', width: 846, height: 1120, flipX: true }, table: { rotation: 0, aspectRatio: 0.7554 } },
  ],
  projects: [
    {
      id: 'space-cat',
      name: 'Space Cat',
      tagline: 'A story-first portfolio microsite with cinematic motion and editorial pacing.',
      myRole: ['Art Direction', 'UX Design', 'Front-end Development'],
      cover: {
        src: '/images/1.png',
        alt: 'Monochrome space cat project hero composition',
        width: 1600,
        height: 1067,
        aspectRatio: 1.5,
      },
      links: [
        { id: 'live', label: 'Live Site', href: 'https://example.com/space-cat' },
        { id: 'case-study', label: 'Case Study', href: 'https://example.com/space-cat/case-study' },
      ],
      dynamicFields: {
        development: 'Next.js 15, TypeScript, GSAP, responsive image optimization',
        timeline: '6 weeks',
        team: '1 Designer + 1 Developer',
        challenge: 'Maintaining fluid motion without compromising loading performance on mobile.',
      },
    },
    {
      id: 'silent-atlas',
      name: 'Silent Atlas',
      tagline: 'An immersive archive explorer for illustrations, travel notes, and audio fragments.',
      myRole: ['Interaction Design', 'UI Systems', 'Animation Prototyping'],
      cover: {
        src: '/images/3.jpg',
        alt: 'Silent Atlas project visual with layered archival layouts',
        width: 1600,
        height: 1067,
        aspectRatio: 1.5,
      },
      links: [
        { id: 'prototype', label: 'Prototype', href: 'https://example.com/silent-atlas' },
      ],
      dynamicFields: {
        development: 'Design-system driven React app with route-based transitions',
        deliverables: 'IA, design library, prototype, interaction documentation',
        audience: 'Curators and independent publishers',
        stack: 'React, Framer Motion, headless CMS integration plan',
      },
    },
    {
      id: 'table-notes',
      name: 'Table Notes',
      tagline: 'A process diary platform for publishing sketches, revisions, and behind-the-scenes context.',
      myRole: ['Product Strategy', 'Content Architecture', 'Visual Design'],
      cover: {
        src: '/images/6.jpg',
        alt: 'Table Notes project card with textured monochrome styling',
        width: 1600,
        height: 1067,
        aspectRatio: 1.5,
      },
      links: [
        { id: 'preview', label: 'Preview', href: 'https://example.com/table-notes' },
        { id: 'docs', label: 'Documentation', href: 'https://example.com/table-notes/docs' },
      ],
      dynamicFields: {
        development: 'Server-component architecture and markdown rendering pipeline',
        status: 'In production',
        localization: 'English and Persian',
        metrics: 'Targeted 40% reduction in content publishing time',
      },
    },
  ],
};
