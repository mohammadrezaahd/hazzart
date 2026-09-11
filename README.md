# Ghazal Shafiei / Hazzart

Next.js App Router + TypeScript + GSAP. The table experience follows the desktop and mobile designs in [Ghazal Shafiei on Figma](https://www.figma.com/design/IZQs5Jp3TMpm0BAtEGrmyl/Ghazal-Shafiei?node-id=98-3).

## Run

Use Node.js 22.18+ or 24 LTS.

```sh
npm ci
npm run dev
npm run lint
npm test
npm run build
```

## Structure

- `consts/fakeData.ts`: typed artist, artwork and administrator-defined medium data. All titles/dates/descriptions except the supplied Roxy caption are mock content.
- `interfaces/Portfolio.ts`: serializable content interfaces. `mediumId` references a category, so adding a medium does not require changing a TypeScript enum.
- `consts/navigation.ts`: header links and footer controls. New top-level links produce placeholder routes through `app/[section]/page.tsx` on the next build.
- `components/Layouts`: shared header, animated mobile menu, footer and medium picker.
- `components/Home/ViewMode/DeskMode.component.tsx`: table entrance, drag handling, arrangement and resize bounds. GSAP owns the transforms.
- `components/Artwork`: reusable image treatment and an accessible animated artwork dialog.
- `utils/artworks.ts`: immutable deterministic sorting/shuffling.
- `hooks/useAnimatedDialog.ts`: native modal focus/inert behavior and transitions.
- `hooks/usePaperSound.ts`: opt-in sound with graceful playback failure.

## Interaction

The pencil/scroll intro has been removed. Seven artworks fall onto the table after their images are ready (with a bounded wait on slow connections). Drag works with mouse and touch; movement beyond 6px is a drag, a click opens the work, and Enter/Space provides keyboard access. The active work grows out of its table position; closing by button, background or Escape animates back to the same position. The background is inert while a dialog is open and focus returns to the artwork.

Random reshuffles; Recent and Yearly place newer artwork on top. Medium filters use the category list and preserve the selected order. Changing an arrangement restacks the cards. Dragged positions survive opening/closing a work, but intentionally reset on arrangement/filter changes. Reduced-motion users get immediate placement, immediate dialogs and no inertia or foley.

The phone table, full-screen menu, and black medium sheet follow the supplied mobile frames. No mobile artwork-detail frame was supplied, so that dialog adapts the desktop design to a stacked image/caption layout. Only the table page is implemented; Paintings, Projects, Artist CV, Portfolio and Contact are intentionally placeholder pages.

## Assets and sound

Artwork fills and navigation SVGs were extracted from the supplied Figma file; the swimming image already existed at `public/images/5.jpg` and matches that Figma fill. Image reflection/rotation from the design is applied separately from drag transforms. All assets and the Alef font are local, with no expiring Figma asset URLs in shipped code.

`public/audio/paper-drop.wav` is original synthesized paper-on-table foley. Regenerate with `python scripts/generate-paper-sound.py`. Sound starts off and requires the Sound button because browsers restrict unsolicited playback. Enable it and use Random to replay the entrance with sound.

There are no API routes, database calls, credentials or backend changes. Future API data can replace `fakeData` while retaining the same `PortfolioData` contract.

## Validation

`npm test` checks hydration-stable ordering, shuffle integrity, source immutability, chronology, category references, asset existence, navigation and sound validity. `npm run lint`, TypeScript checking and the production build are additional gates. Live browser visual QA is currently blocked by this work environment's localhost access restriction; desktop/mobile visual comparison and touch-device QA remain to be performed.
