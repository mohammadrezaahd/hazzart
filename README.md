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

- `consts/fakeData.ts`: typed artist, artwork, project and administrator-defined medium data. All titles/dates/descriptions except the supplied Roxy caption are mock content.
- `interfaces/Portfolio.ts`: serializable content interfaces. `mediumId` references a category, so adding a medium does not require changing a TypeScript enum. A project owns a `cover` plus a `gallery` of process images, and `dynamicFields` carries the admin-defined rows of the information column.
- `consts/navigation.ts`: header links and footer controls. New top-level links produce placeholder routes through `app/[section]/page.tsx` on the next build.
- `components/Layouts`: shared header, animated mobile menu, footer and medium picker.
- `components/Home/ViewMode/DeskMode.component.tsx`: table entrance, drag handling, arrangement and resize bounds. GSAP owns the transforms.
- `components/Artwork`: reusable image treatment and an accessible animated artwork dialog.
- `components/Slider`: the slider shared by Paintings and Projects.
  - `useSliderScroll.ts`: the scroll engine. Pointer drags and touch flicks stay native; wheel, keyboard and the range control are damped frame by frame. It measures the track once per layout change and then keeps the 60fps loop out of React, except for the active slide index. `wheelStep="page"` turns one wheel gesture into one slide, which is what a single-item view needs.
  - `ReusableSlider.tsx`: slides, edge arrow and optional range control. `infinite` loops the track (paintings); without it the track is bounded (projects).
  - `SliderPagination.tsx`: the range control — one page per slide plus a thumb whose width mirrors the visible part of the track. The thumb is placed on `position * (1 - size)`, so it rests exactly on the matching page cell. It follows the position on every frame, can be dragged to move the slider and is a `role="slider"` for the keyboard.
- `components/Projects`: the projects experience (one project on screen, its data above the slider), the detail block and a `?debug` read-out used to check the measured geometry in the preview.
- `utils/slider.ts`: the pure slider maths (nearest slide, fling projection, thumb geometry, edge detection) so the behaviour is unit tested without a browser.
- `utils/projects.ts`: cover + gallery helpers.
- `utils/motion.ts`: `clamp`, frame-rate independent `damp`, reduced-motion probe.
- `utils/artworks.ts`: immutable deterministic sorting/shuffling.
- `hooks/useAnimatedDialog.ts`: native modal focus/inert behavior and transitions.
- `hooks/usePaperSound.ts`: opt-in sound with graceful playback failure.

## Interaction

The pencil/scroll intro has been removed. Seven artworks fall onto the table after their images are ready (with a bounded wait on slow connections). Drag works with mouse and touch; movement beyond 6px is a drag, a click opens the work, and Enter/Space provides keyboard access. The active work grows out of its table position; closing by button, background or Escape animates back to the same position. The background is inert while a dialog is open and focus returns to the artwork.

Random reshuffles; Recent and Yearly place newer artwork on top. Medium filters use the category list and preserve the selected order. Changing an arrangement restacks the cards. Dragged positions survive opening/closing a work, but intentionally reset on arrangement/filter changes. Reduced-motion users get immediate placement, immediate dialogs and no inertia or foley.

The phone table, full-screen menu, and black medium sheet follow the supplied mobile frames. No mobile artwork-detail frame was supplied, so that dialog adapts the desktop design to a stacked image/caption layout. Table, Paintings and Projects are implemented; Artist CV, Portfolio and Contact remain placeholder pages.

### Paintings slider

An endless strip: the track is looped in three copies and the scroll position is normalised back to the middle copy, so dragging or scrolling never reaches an end. Artwork keeps its own aspect ratio, and hovering lifts the image slightly.

### Projects slider

One project on screen at a time. Its data sits above the slider and the work itself is the only thing inside the track, so the slider looks like the paintings gallery: same piece treatment, same aspect-ratio box, same image fill.

- The track is bounded, never a loop. One wheel gesture moves exactly one project (40px of intent, then a short cooldown), a drag release is projected by its velocity and snapped, and the range control settles where it is dropped.
- Pushing past either end charges the matching arrow instead of moving the track. The ring around the arrow fills with the push, the track glides aside and the space opens up for the arrow. The charge releases by itself when the visitor stops pushing (or immediately after a click, with a pop), the space closes again and the track re-anchors on the terminal slide — clicking the arrow never jumps the slider.
- The control under the slider is the same slider seen from above: one page per project, an active page cell and a thumb that is exactly one page wide, so it rests on the cell of the project that is on screen. Dragging it scrubs the track continuously and releases on the closest project; Arrow/Page/Home/End keys move it page by page.
- Every slide is exactly as wide as the viewport (`width: 100%` of the track, no `vw` or custom-property maths), which is what keeps the pages, the offsets and the thumb in exact agreement.
- The page is a plain flex column — header space, data, slider, range control — so the range control always stays inside the viewport.
- The edge arrow is a decorative affordance: it repeats what the range control and the keyboard already do, so it is hidden from assistive technology (`aria-hidden`, `tabIndex={-1}`). Everything keeps working when the browser does not support `@property` — only the space then opens a touch less smoothly.
- `?debug` in the URL shows the measured geometry (client, scroll, max, offsets, thumb box) in the corner, which is how the preview can be checked without dev tools.

## Assets and sound

Artwork fills and navigation SVGs were extracted from the supplied Figma file; the swimming image already existed at `public/images/5.jpg` and matches that Figma fill. Image reflection/rotation from the design is applied separately from drag transforms. All assets and the Alef font are local, with no expiring Figma asset URLs in shipped code.

Project covers reuse those same files, so the projects page adds no new binaries: `/images/1.png` (restaurant line study), `/images/2.jpg` (plate with a birthday note), `/images/3.jpg` (car interior), `/images/4.jpg` (figure on a sofa), `/images/5.jpg` (figure in water), `/images/6.jpg` (shells), `/images/7.jpg` (ink shadow pass) and the `artworks/*` files are all referenced from `fakeData.projects`.

`public/audio/paper-drop.wav` is original synthesized paper-on-table foley. Regenerate with `python scripts/generate-paper-sound.py`. Sound starts off and requires the Sound button because browsers restrict unsolicited playback. Enable it and use Random to replay the entrance with sound.

There are no API routes, database calls, credentials or backend changes. Future API data can replace `fakeData` while retaining the same `PortfolioData` contract.

## Validation

`npm test` checks hydration-stable ordering, shuffle integrity, source immutability, chronology, category references, asset existence, navigation, sound validity, the project data (uniqueness, copy, existing covers/galleries, aspect ratios) and the slider maths (nearest slide, fling projection, thumb geometry, edge detection, damping). `npm run lint`, TypeScript checking and the production build are additional gates. Live browser visual QA is currently blocked by this work environment's localhost access restriction; desktop/mobile visual comparison and touch-device QA remain to be performed.
