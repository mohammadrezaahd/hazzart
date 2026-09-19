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
  // One project, told as a single story page: the copy at the top stays put while the
  // strip below walks through the project's own images.
  project: {
    id: 'daily-notes',
    name: 'Daily Notes',
    tagline: 'A drawing practice that keeps one small observation a day — a plate, a window, the sea.',
    description: 'Daily Notes collects the studies made since the autumn of 2023: charcoal plates and cutlery, ink drawings of rides and quiet rooms, and the photographs they start from. Every sheet is finished in one sitting, so the series keeps the hand and the light of the day it was made on.',
    year: 2025,
    discipline: 'Drawing & Painting',
    client: 'Personal practice',
    myRole: ['Drawing', 'Photography', 'Digital painting'],
    images: [
      { src: '/images/1.png', alt: 'Black and white painting of a plate with a fork, a knife and a dark shape', width: 143, height: 190, aspectRatio: 0.7526, caption: 'Plate — charcoal on paper' },
      { src: '/images/2.jpg', alt: 'Ink line drawing of a birthday card, a candle and a plate on a table', width: 3024, height: 4032, aspectRatio: 0.75, caption: 'Birthday — ink on paper' },
      { src: '/images/3.jpg', alt: 'Line drawing of a ride seen through a car window with a figure outside', width: 3024, height: 4032, aspectRatio: 0.75, caption: 'On the road — ink on paper' },
      { src: '/images/4.jpg', alt: 'Line drawing of a figure sitting with a laptop in a bright room', width: 919, height: 1225, aspectRatio: 0.7502, caption: 'Afternoon — ink on paper' },
      { src: '/images/5.jpg', alt: 'Photograph of a swimmer floating in turquoise water seen from above', width: 3024, height: 4032, aspectRatio: 0.75, caption: 'Water — reference photograph' },
      { src: '/images/6.jpg', alt: 'Photograph of three white shells arranged in a circle on sand', width: 3024, height: 4032, aspectRatio: 0.75, caption: 'Shells — reference photograph' },
      { src: '/images/7.jpg', alt: 'High contrast black and white painting of folded fabric and shadow', width: 919, height: 1225, aspectRatio: 0.7502, caption: 'Folds — digital painting' },
    ],
    links: [
      { id: 'series', label: 'Full series', href: 'https://example.com/daily-notes' },
      { id: 'studio', label: 'Studio notes', href: 'https://example.com/daily-notes/studio' },
    ],
    dynamicFields: {
      Medium: 'Charcoal, ink, photography',
      Started: 'Autumn 2023',
      Sheets: '40 finished, 7 shown here',
      Status: 'In progress',
    },
  },
};
