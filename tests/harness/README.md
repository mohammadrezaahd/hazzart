# Headless slider harness

The slider engine talks to real DOM elements, so a plain unit test cannot cover it.
This harness mounts the real `ReusableSlider` in jsdom with stubbed element metrics
(jsdom has no layout) and drives it with real wheel events. It is how the wheel →
track → range-dot chain is checked without a browser.

The harness needs `jsdom` and `esbuild`, which are **not** project dependencies — install
them without saving them (or point the commands below at an installation kept elsewhere).

```bash
# once
npm i --no-save jsdom esbuild

# bundle the harness against the app sources, then run it
node_modules/.bin/esbuild tests/harness/harness.tsx --bundle --format=esm --platform=node \
  --jsx=automatic --alias:@="$PWD" --outfile=tests/harness/harness.mjs --loader:.css=empty
node tests/harness/run.mjs
```

The bundle (`harness.mjs`) is generated, so it is ignored by Git — rebuild it after
touching the slider sources.

It asserts that the slides render, that the range rail subscribes, that one wheel
gesture over the page moves the strip and is prevented, that the dot tracks the strip
and lands exactly on both ends, and that pushing past either end opens the matching
edge arrow instead of moving the track. Every other path (the damped frame loop, the
pointer fling, the charge release) is exercised through the same code.
