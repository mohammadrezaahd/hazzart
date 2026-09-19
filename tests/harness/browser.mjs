/**
 * End-to-end check of the projects slider in a real browser: wheel travel both ways, the
 * range dot, the edge arrows, dragging the strip, dragging the dot, the keyboard and the
 * responsive layouts. One line per check; exit code 1 if anything failed.
 *
 * Needs a browser and a dev server. The layout bugs this suite exists to catch (a strip
 * measured while its entrance animation inflated it, a grid column sized to the whole
 * track) are invisible to jsdom, which has no layout at all.
 *
 *   CHROME_PATH=/path/to/chromium         # or PUPPETEER_EXECUTABLE_PATH
 *   BASE_URL=http://127.0.0.1:3000        # a running `npm run dev`
 *   node tests/harness/browser.mjs
 *
 * `LD_LIBRARY_PATH` may need to point at the browser's own libraries (see README).
 */
import puppeteer from 'puppeteer-core';

const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:3000';
const executablePath = process.env.CHROME_PATH ?? process.env.PUPPETEER_EXECUTABLE_PATH;
if (!executablePath) {
  console.error('Set CHROME_PATH to a Chromium/Chrome binary.');
  process.exit(2);
}

const browser = await puppeteer.launch({
  executablePath,
  headless: 'shell',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

let failures = 0;
const check = (label, ok, detail = '') => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures += 1;
};

const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto(`${BASE_URL}/projects`, { waitUntil: 'networkidle2', timeout: 45000 });
await new Promise(r => setTimeout(r, 2200));

const state = () => page.evaluate(() => {
  const vp = document.querySelector('.projects-slider .reusable-slider__viewport');
  const rail = document.querySelector('.slider-pagination__rail');
  const card = document.querySelector('.projects-slider');
  const dot = document.querySelector('.slider-pagination__dot');
  const cta = document.querySelector('.reusable-slider__edge-cta');
  const dotBox = dot?.getBoundingClientRect();
  const railBox = rail?.getBoundingClientRect();
  return {
    left: Math.round(vp.scrollLeft),
    max: vp.scrollWidth - vp.clientWidth,
    position: Number(rail.style.getPropertyValue('--range-position')),
    edge: card.dataset.edge,
    progress: Number(card.style.getPropertyValue('--edge-progress') || 0),
    cta: cta ? Math.round(cta.getBoundingClientRect().left) : null,
    dotFraction: dotBox && railBox ? (dotBox.left + dotBox.width / 2 - railBox.left) / railBox.width : null,
    railBottom: railBox ? Math.round(railBox.bottom) : null,
    viewportH: window.innerHeight,
  };
});
const wheel = async (times, delta, pause = 80) => {
  await page.mouse.move(720, 520);
  for (let i = 0; i < times; i++) { await page.mouse.wheel({ deltaY: delta }); await new Promise(r => setTimeout(r, pause)); }
  await new Promise(r => setTimeout(r, 700));
};
const settle = ms => new Promise(r => setTimeout(r, ms));

let s = await state();
check('the strip has travel', s.max > 0, `max=${s.max}`);
check('the range control sits inside the page', s.railBottom <= s.viewportH, `rail bottom ${s.railBottom} of ${s.viewportH}`);

await wheel(4, 160);
s = await state();
check('wheel forward moves the strip', s.left > 300, `left=${s.left} of ${s.max}`);
check('the dot tracks the strip', Math.abs(s.position - s.left / s.max) < 0.02, `position=${s.position.toFixed(4)} left/max=${(s.left / s.max).toFixed(4)}`);
check('the dot is drawn along the rail', Math.abs(s.dotFraction - s.position) < 0.03, `dot=${s.dotFraction?.toFixed(3)} position=${s.position.toFixed(3)}`);

await wheel(12, 240);
s = await state();
check('wheel forward reaches the end', s.left === s.max, `left=${s.left} max=${s.max}`);
check('the dot lands on the end of the line', s.position > 0.985, `position=${s.position.toFixed(4)}`);

await page.mouse.move(720, 520);
for (let i = 0; i < 2; i++) { await page.mouse.wheel({ deltaY: 180 }); await new Promise(r => setTimeout(r, 90)); }
await settle(320);
s = await state();
check('pushing past the end opens the space', s.edge === 'next' && s.progress > 0.1, `edge=${s.edge} progress=${s.progress.toFixed(2)}`);
check('the strip stays at the end while charging', s.left === s.max, `left=${s.left}`);
check('the next arrow appears in the opened space', s.cta !== null, `arrow left=${s.cta}`);
await settle(2600);
s = await state();
check('the space closes by itself and the strip stays put', s.edge === 'none' && s.left === s.max, `edge=${s.edge} left=${s.left}`);

// Back to the start.
await page.mouse.move(720, 520);
for (let i = 0; i < 6; i++) { await page.mouse.wheel({ deltaY: -200 }); await new Promise(r => setTimeout(r, 90)); }
await settle(2600);
s = await state();
check('wheel back reaches the start', s.left === 0, `left=${s.left}`);
check('the dot returns to the start', s.position < 0.002, `position=${s.position}`);

for (let i = 0; i < 2; i++) { await page.mouse.wheel({ deltaY: -180 }); await new Promise(r => setTimeout(r, 90)); }
await settle(320);
s = await state();
check('pushing past the start opens the previous arrow', s.edge === 'previous', `edge=${s.edge} progress=${s.progress.toFixed(2)}`);
await settle(2600);
s = await state();
check('the previous space closes again', s.edge === 'none' && s.left === 0, `edge=${s.edge} left=${s.left}`);

// Drag the strip with a finger (the native touch pan, as on a tablet).
const touchPage = await browser.newPage();
await touchPage.setViewport({ width: 1024, height: 900, hasTouch: true, isMobile: false });
await touchPage.goto(`${BASE_URL}/projects`, { waitUntil: 'networkidle2', timeout: 45000 });
await settle(2000);
await touchPage.touchscreen.touchStart(800, 520);
for (let x = 800; x >= 300; x -= 50) { await touchPage.touchscreen.touchMove(x, 520); await new Promise(r => setTimeout(r, 25)); }
await touchPage.touchscreen.touchEnd();
await settle(1500);
const touchLeft = await touchPage.evaluate(() => Math.round(document.querySelector('.projects-slider .reusable-slider__viewport').scrollLeft));
check('dragging the strip with a finger moves it', touchLeft > 100, `left=${touchLeft}`);
await touchPage.close();

// Drag the dot.
const railBox = await page.evaluate(() => document.querySelector('.slider-pagination__rail').getBoundingClientRect().toJSON());
await page.mouse.move(railBox.left + railBox.width * 0.8, railBox.top + railBox.height / 2);
await page.mouse.down();
await page.mouse.move(railBox.left + railBox.width * 0.9, railBox.top + railBox.height / 2, { steps: 8 });
await page.mouse.up();
await settle(1200);
s = await state();
check('dragging the dot moves the strip', s.left / s.max > 0.75, `left=${s.left} of ${s.max}`);

// Keyboard on the dot.
await page.evaluate(() => document.querySelector('.slider-pagination__dot').focus());
const beforeKeys = await state();
await page.keyboard.press('ArrowLeft');
await settle(900);
s = await state();
check('the arrow key steps back one image', s.left < beforeKeys.left, `left=${s.left} was ${beforeKeys.left}`);

// The document itself must not scroll: the page owns the wheel.
const docScroll = await page.evaluate(() => document.documentElement.scrollTop + document.body.scrollTop);
check('the page itself does not scroll', docScroll === 0, `scrollTop=${docScroll}`);

// Responsive layouts.
for (const [width, height] of [[1920, 1080], [1280, 800], [1024, 768], [834, 1112], [390, 844]]) {
  await page.setViewport({ width, height });
  await settle(1200);
  const view = await page.evaluate(() => {
    const vp = document.querySelector('.projects-slider .reusable-slider__viewport');
    const rail = document.querySelector('.slider-pagination__rail');
    const slides = Array.from(document.querySelectorAll('.projects-slider .reusable-slider__slide'));
    const boxes = slides.slice(0, 3).map(sl => sl.getBoundingClientRect());
    const gaps = boxes.slice(1).map((b, i) => Math.round(b.left - (boxes[i].left + boxes[i].width)));
    const railBox = rail.getBoundingClientRect();
    const detail = document.querySelector('.projects-detail').getBoundingClientRect();
    return {
      max: vp.scrollWidth - vp.clientWidth,
      slide: `${Math.round(boxes[0].width)}x${Math.round(boxes[0].height)}`,
      gaps,
      railInside: railBox.bottom <= window.innerHeight + 0.5 && railBox.left >= 0 && railBox.right <= window.innerWidth + 0.5,
      stripTop: Math.round(vp.getBoundingClientRect().top),
      detailBottom: Math.round(detail.bottom),
      railBottom: Math.round(railBox.bottom),
    };
  });
  check(`${width}x${height}: the strip scrolls and fills the width`, view.max > 0 && view.gaps.every(g => g === 0) && view.railInside,
    JSON.stringify(view));
}

console.log(failures === 0 ? '\nALL CHECKS PASSED' : `\nFAILURES: ${failures}`);
await browser.close();
process.exit(failures === 0 ? 0 : 1);
