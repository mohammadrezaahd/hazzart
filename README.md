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
  - `useSliderScroll.ts`: the scroll engine. Pointer drags and touch flicks stay native; wheel, keyboard and the range control are damped frame by frame. It measures the track once per layout change and then keeps the 60fps loop out of React, except for the active slide index. The travel is measured from the slides' layout boxes, never from `scrollWidth`, because the entrance tween's x-offset inflates the scrollable area for a moment; what the element actually applied when it is written to is authoritative, so a range that turns out to be shorter corrects the motion instead of stalling it.
  - `ReusableSlider.tsx`: slides, edge arrow and optional range control. `infinite` loops the track (paintings); without it the track is bounded (projects).
  - `SliderPagination.tsx`: the range control — a line with a dot on it. The dot marks how far the visible window has travelled, follows the position on every frame, can be dragged to move the slider and is a `role="slider"` for the keyboard.
- `components/Projects`: the projects experience (one project, its story above the strip and its images stuck together below), the detail block and a `?debug` read-out used to check the measured geometry in the preview.
- `utils/slider.ts`: the pure slider maths (nearest slide, fling projection, edge detection, pointer → dot position) so the behaviour is unit tested without a browser.
- `utils/projects.ts`: project image helpers.
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

### Projects page

The page tells **one project**, not an archive: `fakeData.project` is a single entry, its written story sits at the top and never changes, and the strip underneath holds that project's own images.

- The strip is built exactly like the paintings gallery — same slide markup, same engine, same image fill — and the images are flush: each slide is one image wide (`aspect-ratio` from the file), with no gap or padding between them.
- It is bounded, never a loop. Pushing past either end charges the matching arrow instead of moving the track. The ring around the arrow fills with the push, the strip glides aside and the space opens up for the arrow. The charge releases by itself when the visitor stops pushing (or immediately after a click, with a pop), the space closes again and the strip re-anchors on the terminal slide — clicking the arrow never jumps the slider.
- The range control under the strip is a thin line with a dot that moves along it, so the visitor always sees where they are. The dot follows the scroll on every frame (imperatively, so the 60fps loop stays out of React), can be dragged to scrub the strip, and answers Arrow/Page/Home/End. Its `role="slider"` reports the image it is closest to.
- The page is a plain flex column — header space, story, strip, range control — so the range control always stays inside the viewport. The strip's own grid column is `minmax(0, 1fr)`: an `auto` column grows to the track's full width, which would push the whole card past the page edge and leave the viewport with no travel to scroll.
- The edge arrow is a decorative affordance: it repeats what the range control and the keyboard already do, so it is hidden from assistive technology (`aria-hidden`, `tabIndex={-1}`). Everything keeps working when the browser does not support `@property` — only the space then opens a touch less smoothly.
- `?debug` in the URL shows the measured geometry (client, scroll, max, offsets, dot box, whether the range control is inside the viewport) in the corner, which is how the preview can be checked without dev tools.

## Assets and sound

Artwork fills and navigation SVGs were extracted from the supplied Figma file; the swimming image already existed at `public/images/5.jpg` and matches that Figma fill. Image reflection/rotation from the design is applied separately from drag transforms. All assets and the Alef font are local, with no expiring Figma asset URLs in shipped code.

The project strip reuses those files, so the projects page adds no new binaries: `/images/1.png` (plate and cutlery), `/images/2.jpg` (birthday study), `/images/3.jpg` (ride seen through a window), `/images/4.jpg` (figure with a laptop), `/images/5.jpg` (swimmer in water), `/images/6.jpg` (shells) and `/images/7.jpg` (ink shadow pass) are referenced from `fakeData.project`.

`public/audio/paper-drop.wav` is original synthesized paper-on-table foley. Regenerate with `python scripts/generate-paper-sound.py`. Sound starts off and requires the Sound button because browsers restrict unsolicited playback. Enable it and use Random to replay the entrance with sound.

There are no API routes, database calls, credentials or backend changes. Future API data can replace `fakeData` while retaining the same `PortfolioData` contract.

## Validation

`npm test` checks hydration-stable ordering, shuffle integrity, source immutability, chronology, category references, asset existence, navigation, sound validity, the project data (complete copy, existing images, aspect ratios) and the slider maths (nearest slide, fling projection, edge detection, pointer → dot position, damping). `npm run lint`, TypeScript checking and the production build are additional gates.

`tests/harness` holds two integration harnesses for the slider, both documented in its README: a jsdom one that drives the real component with real wheel events, and a real-browser one (`tests/harness/browser.mjs`) that walks the strip, drags it with a finger, scrubs the dot, uses the keyboard and re-checks five viewport sizes. The browser harness is the one that catches layout bugs — jsdom has no layout — and needs a Chromium binary plus a running dev server, so it is not part of `npm test`.
