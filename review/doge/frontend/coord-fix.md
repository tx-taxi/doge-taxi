# Incoming chart coord failure

The public review accumulated an intermittent `Cannot read properties of undefined (reading 'coord')` error by the pending-page check. Five additional public navigation rounds and eight local pending loads did not reproduce it directly.

The actual dependency reproduces that exact exception deterministically in `getVisualGradient` (ECharts LineView): incoming-chart visualMap contained one unbounded `gte:0` piece with a constant color, yielding no finite gradient stops. Empty data passes; the first zero or nonzero observation throws. `coord-repro.cjs` executes the real dependency and records full before-fix stacks and successful after-fix rendering in `coord-repro.json`.

Replaced the unnecessary uniform visualMap with the identical native gold / Original green series color. No data, sizing or update semantics changed. Existing moving-average white styling remains explicit. Also corrected the reachable navbar's inherited Litecoin graphs label to Dogecoin graphs.

Actual Angular incoming-chart component was driven through empty, one zero, two zeros, and positive observations in both themes. No page errors; `coord-browser.json`. Harness init storage access is guarded for opaque child frames. Production Angular build and native stylesheet packaging passed, `coord-build.log`. Initial public results remain unchanged as failure evidence.
