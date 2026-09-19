# Headless slider harness

The slider engine talks to real DOM elements, so a plain unit test cannot cover it.
This harness mounts the real `ReusableSlider` in jsdom with stubbed element metrics
(jsdom has no layout) and drives it with real wheel events. It is how the wheel →
track → range-dot chain is checked without a browser.

```bash
# once, from the repository root (not part of the dependencies)
npm i --no-save jsdom esbuild

# bundle the harness against the app sources, then run it
node_modules/.bin/esbuild tests/harness/harness.tsx --bundle --format=esm --platform=node \
  --jsx=automatic --alias:@="$PWD" --outfile=tests/harness/harness.mjs --loader:.css=empty
node tests/harness/run.mjs
```

It asserts that the slides render, that the range rail subscribes, that one wheel
gesture over the page moves the strip and is prevented, that the dot tracks the strip
and lands exactly on both ends, and that pushing past either end opens the matching
edge arrow instead of moving the track. Every other path (the damped frame loop, the
pointer fling, the charge release) is exercised through the same code.
