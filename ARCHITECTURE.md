## Evolution Lab extensions / v2.0

`source/uplift-core.js` holds pure derived operations; `source/uplift-ui.js` owns optional dialog controls, local IndexedDB checkpoints and per-session provider governance; `source/uplift.css` styles the opt-in Lab. `source/app.js` owns state, validates new records through `source/core.js`, and preserves schema 1. Build remains fully self-contained. CI builds and tests `index.html` from tracked source. Consult `IMPLEMENTATION_MATRIX.md` for feature-level contracts.

# Evolution Rig / Architecture contract

## Boundaries

**Pure core (`source/core.js`)**: idea normalization; reference fixture calibration; token novelty metrics; weighted feature contributions with anti-repetition control; 1-5 normalization; source-preserving near-duplicate gold selection; deep iterative lineage traversal; rule-based mutations; portable export file payload; ZIP (store-method) encoding; import schema validation and acyclic cross-board isolation.

**Browser application (`source/app.js`)**: UI events and document rendering; local/session storage; active board and selection; one lazily cached jury snapshot invalidated on mutations; Evolution Lens comparison; one active autopilot timer with bounded spacing; model request routing (native Ollama idea-schema mode) and JSON validation; browser download and optional folder picker; status feedback. Model output has no authority over scores or project execution.

**Causal Observatory (`source/observatory.js`)**: read-only Canvas 2D projection of the current board's real idea IDs and parent edges. The layout is derived from generation depth and stable record order, not a simulated world. The renderer has independent pointer/zoom/keyboard presentation state, a user-controlled generation-depth filter, and requestAnimationFrame redraws only after updates or interaction. It never changes board state or calls a model. The browser adapter in `source/app.js` computes the side report from the existing jury snapshot and full recorded lineage. `source/observatory.css` contains the instrument-specific visual system and responsive treatment. `build.py` inlines both into the standalone HTML. The original DOM family tree and jury table remain accessible alternatives.

**HTML shell**: semantic layout, accessible controls and mobile styles; no third-party script, stylesheet, font, CDN or analytics request.

## Conceptual state

`workspace = { schema:1, boards[], ideas[], selectedBoardId, selectedIdeaId, preferences }`.

A board is `{id,title,objective,createdAt}`.

An idea is `{id,boardId,parents[],generation,createdAt,status,source,overrides,history,...fields}`. `parents` is 0, 1 or 2 distinct IDs; import rejects cycles and removes cross-board parent edges. Ancestry follows IDs and does not depend on archived/active status. History receipts preserve manual overrides, generations, score snapshots, archival and project exports.

Keys are excluded from workspace and from both project export formats. The model router keeps provider-specific endpoint/model profiles in a separate browser config store, and keys in separate session/local stores.

## Autopilot transition

`IDLE -> RUNNING -> [SELECT PARENTS -> GENERATE -> NORMALIZE -> SCORE -> ARCHIVE LOW LEAVES -> SAVE -> LOG] -> RUNNING`.

On generation failure: transition to IDLE and surface error. On board change/import: stop timer. Closing the tab ends timers. No catch-up replay for missed hidden-tab time; no hidden system daemon or paid inference without the open page's active schedule.

## Jury truth boundary

The jury measures text structure and board-relative distinctness. A calibrated score of 5 does **not** prove feasibility or novelty in the outside world. The anchor gate is a control against indiscriminate grade inflation, not an experimental proof of usefulness. Manual overrides are explicitly visible and logged; no model-written score field is trusted.

## Export boundaries

Gold qualification is checked at the click point, not assumed from an earlier render. ZIP is encoded with a small standards-compliant store-method encoder and independently inspected with Python `zipfile` in browser tests. Folder export creates a fresh timestamp-suffixed directory to avoid silently replacing a prior project folder. File names are generated slugs; no API keys are part of exported file content.

## Production hardening / follow-ups (not implemented)

- Test Ollama, LM Studio, MLX and hosted APIs against real reachable endpoints and specific selected model IDs, including CORS/origin policies.
- Optionally add a separately authorized local background agent if the rig must continue after tab closure. Do not mislabel a browser timer as durable scheduling.
- Replace localStorage with IndexedDB if sustained use with thousands of ideas exceeds origin quota or needs transaction guarantees.
- Add human-labelled outcome datasets and empirical jury weight calibration to move beyond structural text heuristics.
- Consider budgets, retry limits, idempotent generation IDs, and remote quota controls before long unattended paid-model use.

## Version 1.1 evidence and safeguards

- A fourth reference adversarial fixture requires repeated boilerplate to score <=11/15 before gold is enabled. Weak/medium/strong remain 3/9/15.
- Gold's near-duplicate test is ordered by generation/time/id. Earlier source ideas are not disqualified by their offspring; later copies only qualify when they outperform an earlier close peer.
- Child Evolution Lens is lexical only: fields changing, new mechanism terms and score delta relative to the strongest parent in the same peer set.
- No per-idea history retention cap. Browser quota failure is visible via storage notice and independent JSON backups.
- `source/core.js` is still Node-testable; `tests/benchmark.py` measures actual browser graph operations using the standalone HTML.
- Schema 1 remains compatible with prior workspaces; newly rejected malformed overlong/duplicate IDs fail closed.
