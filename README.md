## Current release / v2.0 — Evolution Lab

The full-screen Causal Field remains the default. A new **Lab** control (bottom dock, board rail, and workbench) opens an optional 17-section overlay. It adds hypothesis/observed-experiment records, literal mission locks, Explore/Refine generation, side-by-side comparisons, Pareto trade-offs, source-backed shared-term connections, operator review, nonvisual lineage tracing, edit snapshots, cross-board copy, global search, IndexedDB workspace checkpoints, autopilot preview, a hosted-provider request governor, non-gold Markdown candidate briefs and scale diagnostics. No user-controlled project is created until explicitly requested.

The Lab is **not** a human scientific authority: jury scores remain structural heuristics; human review inputs remain operator claims; lexical links are not causal links; and HTTP/IndexedDB hardware coverage is subject to the explicitly recorded test gaps.

**Build and tests:** `python3 build.py`, `python3 tests/test_rebuild.py`, `node --test tests/test_core.js tests/test_starters.js tests/test_uplift.js`, and the Playwright scripts in `tests/`. GitHub Actions builds, verifies byte parity, tests and publishes only `index.html` when its release gates pass. Source, test and release proof are in `IMPLEMENTATION_MATRIX.md`, `RELEASE_QA_V2.md`, and `PERFORMANCE_V2.md`.

**Storage caution:** v2.0 retains workspace schema 1 for compatibility. New optional fields are validated and survive JSON export/import. Recovery checkpoints use browser-local IndexedDB when available; they are not a substitute for exporting JSON out of the browser. Two tabs changing the same workspace may require export/reload reconciliation. Hosted provider requests are disabled until explicitly opted into per session; local model routes remain separate.

## Current release / v1.6
- The Seed Vault offers 20 ideas across five equal themes; the general-purpose Skills That Travel seed is restored.
- Space-themed background and eight-section Field Manual remain available.

## Previous release / v1.5
- Space-themed shell with star-field background.
- Field Manual help modal.

# Evolution Rig — The Causal Field

A local-first evolutionary idea laboratory with a causal observatory for discovering recorded ancestry, branching and trade-offs. One complete dependency-free web application plus editable source and tests.

## Causal Field / full-screen default

The opening surface is the **Causal Field**: the actual board genealogy fills the viewport, with a compact top command bar and bottom navigation/depth controls. This is not a simulation of fabricated data. Nodes are stored ideas; edges are recorded parent IDs. With no recorded ideas, the field is intentionally empty.

**Persistent interface budget:** less than 30% of the viewport area at rest on tested desktop, phone, tablet and short-landscape sizes; the canvas itself occupies the full viewport. Open-on-request board drawer, record panel, idea editor, and full **Workbench** deliberately expand beyond that default budget. This limit applies to default persistent controls, not every deliberately opened editing surface.

Use **Field / Choose a board** to select or create an independent board. **+ Seed** opens the original detailed idea editor. **Workbench ↗** exposes the complete Studio, Jury, Autopilot, and Models interfaces. **Return to field** restores the full-screen map. This preference is saved separately from the workspace schema, and does not alter ideas or exports.

The bottom dock offers zoom, fit, trace and a temporary selected-record report. The slim generation-depth slider unfolds actual stored generations, never simulated events. Click/tap a point or use keyboard arrows on the canvas to inspect a real lineage. When the board drawer or record is open, Escape closes it. In the field, B opens boards, N creates a seed, and ? opens the record unless a form/dialog has focus. Motion respects `prefers-reduced-motion`.

## The Seed Vault / twenty possible beginnings

Select **Seeds** in the Causal Field dock, **Seed Vault / 20** in the workbench, or **Explore twenty starters** in the board drawer. The gallery offers 20 fully specified, offline proposals across five themes: Systems, Worlds, People, Planet, and Strange (four ideas per theme). Filter by theme or search the descriptions, mechanism and problem. A selected origin explains the tension, causal mechanism, first experiment, validation method and failure risk.

**Plant as new board** creates an independent board with its own objective and a real generation-zero root idea, using the same normalization, jury, history and persistence pipeline as a manually entered seed. **Add to current board** adds a new independent root without overwriting anything; it is disabled until a board exists. **Edit first** prefills the existing idea editor so its fields can be changed before creation. Selecting or previewing a starter alone does not mutate workspace data. All 20 are hypotheses, not asserted solutions, demonstrated outcomes, or live research.

The gallery is deliberately opened on request and does not enlarge the always-visible UI. It makes no network calls and introduces no storage-schema changes. The entire catalog is editable in `source/starter-ideas.js`; its layout is in `source/starter.css`. Browser interaction regressions live in `tests/test_starters.py` and the exactly-20 content contract in `tests/test_starters.js`.

### Start

1. Open `index.html` in a modern browser. No npm, CDN, backend, account or database is needed for offline operation.
2. Choose **Field / Choose a board**, then create a board with a **title** and a **goal/directive**.
3. Select **+ Seed** (or **New seed** in the full workbench). Enter the problem, mechanism, execution plan, differentiation and validation to get a meaningful jury result.
4. Select an idea and use **Branch selected** (1-8 children), or drag one card onto another to **crossbreed** two different parent ideas. On touch devices, use the inspector's **Pick parent** button twice and then **Crossbreed picked pair**.
5. Inspect the current computed verdict, signal-by-signal rationale, previous receipts, overrides and full family lineage.
6. Open **Workbench** and use **Autopilot** for manual one-step evolution or an interval-based loop, and **Models** to select a local or remote language model.
7. Export a qualified gold candidate as a portable ZIP containing `claude.md`, structured idea data, jury evidence and ancestry. Supported browsers can also write to a user-selected local folder.

Your work persists in this browser's `localStorage` where supported. Use **Export workspace JSON** as an independent backup. Import replaces the current workspace after confirmation, so export before importing.

### Serving from localhost (optional)

If your browser restricts `file://` storage or local model requests, serve the directory locally:

```sh
cd evolution_rig
python3 -m http.server 8765 --bind 127.0.0.1
```

Then open `http://127.0.0.1:8765/` on that same machine. This only serves static files and does not process or store keys. Python is **not** required for the standalone HTML in browsers that support direct opening.

For access from another device (such as a phone), you must explicitly provide a reachable local address and assess the privacy of the network. This package does not open a LAN listener by default.

## Causal Observatory

The opening Studio includes a fully local interactive **Causal Observatory**. This is not an unrelated game or simulated universe: every plotted point is an actual idea from the selected board, and every connection comes from recorded parent IDs. Gold, archived and hybrid ideas are visibly distinguished. The view includes archived ideas so pruning never appears to erase history.

- **Select a point** in the canvas or use the accessible **Signals** buttons. The inspector and jury remain the authoritative detailed views.
- **Trace selected** centers the chosen record and discloses recorded ancestors and descendants. The side report summarizes direct parent identity, archival descendants, latest event receipt and strongest descendant score relative to that record. A small inset compares the strongest recorded jury score at each generation of the selected idea's actual ancestry.
- **Unfold / generation depth** scrubs through only the generations that actually exist, showing the rise of ideas without inventing events or silently changing stored workspace data. **Reveal all** and **Fit field** reset the view.
- **Pan** by dragging empty canvas, **zoom** with the mouse wheel or visible buttons; keyboard focus on the canvas accepts Left/Right to select previous/next idea, +/- to zoom, and Home to reset. The complete family tree and jury table remain available as non-canvas alternatives.
- The view is redraw-on-change, not a continuous animation loop; no particle engine, external asset, WebGL library, sound playback, model calls, or network request is required.

In the full workbench, small-screen board creation collapses after an existing board is loaded; tap **Create a board** to expand it. All original actions, fields, routes and persistence formats remain available.

A 1–5 structural jury rating remains a **heuristic**, not evidence that an idea is actually original or successful. The Observatory is a causal record, not predictive intelligence.

## The four work areas

- **Studio**: isolated goal-anchored boards; manual seeds; generations; drag/drop and accessible two-parent crossbreeding; editable idea fields; graph edges; selection, search and filtering; archived nodes retained in ancestry; project ZIP or folder export for gold ideas.
- **Jury**: code-computed Originality, Feasibility and Impact, each 1-5; total out of 15; calibrated weak/medium/strong fixed fixtures; visible weak/medium/strong plus anti-padding reference results and comparative text signals; per-metric manual overrides; historical verdict receipts.
- **Autopilot**: one step or an in-page loop; the effective interval is the slower of `3600 / stepsPerHour` and `secondsBetween`; higher-scored ideas are favored but alternatives get chances; each step branches or crossbreeds; low-scoring leaves are archived and active population is capped. No original idea or ancestor is deleted by the evolutionary pruner.
- **Models**: procedural offline mode (default), Ollama, LM Studio, MLX-compatible endpoint, OpenRouter, Anthropic, OpenAI, and Azure OpenAI. Providers can retain separate local endpoint/model configurations. All model-generated ideas are re-evaluated by the **same independent JavaScript jury**, never by the model.

### Routing examples

| Provider | Typical chat endpoint | Notes |
|---|---|---|
| Offline | None | Works without a model or network. Generation is rule-based recombination, not AI inference. |
| Ollama | `http://127.0.0.1:11434/api/chat` | Start Ollama and choose an installed chat model; browser Origin permissions may need adjustment. |
| LM Studio | `http://127.0.0.1:1234/v1/chat/completions` | Start the local model server and use its loaded model ID. |
| MLX | `http://127.0.0.1:8080/v1/chat/completions` | Requires a separately running OpenAI-compatible MLX server on your chosen port. |
| OpenRouter | `https://openrouter.ai/api/v1/chat/completions` | Direct key-bearing browser request; provider browser policy applies. |
| Anthropic | `https://api.anthropic.com/v1/messages` | Uses the explicit direct-browser-access header; some organizations block CORS. |
| OpenAI | `https://api.openai.com/v1/chat/completions` | Direct browser key usage may be blocked or insecure for production. |
| Azure | Exact Azure deployment chat completions URL including API version | URL and deployment depend on your Azure account. |

You configure the endpoint and model; bundled defaults are examples, **not proof** that those services or model IDs are available on your machine. The probe button makes a real request and can use tokens/billing.

### Privacy and limits

- All board/idea persistence, scoring, lineage, pruning, calibration and exports run locally in the browser.
- API keys are held in **sessionStorage by default**, or `localStorage` if you check the explicit opt-in. These are both browser-managed client storage. Key material never enters app workspace exports, project handoff ZIPs or a server-side file handler in this package.
- A configured model request sends the board directive and selected parent idea fields to the entered endpoint. The key is sent only when required to authenticate to that endpoint. Review the endpoint carefully, especially if it is not loopback.
- This is not a secret-safe multi-user API gateway. Browsers and extensions can expose keys; remote APIs may refuse browser CORS. Do not store high-privilege keys on shared computers.
- Only `http://localhost`, loopback HTTP and HTTPS endpoints are accepted. The app does not expose a proxy or open a remote port.
- The autopilot operates while the page is open; it is **not** a system daemon, worker or persistent background job. Timers may be throttled or suspended in inactive tabs. Closing the page stops scheduled generations.
- The jury is an **inspectable structural rubric**: it evaluates specificity, mechanism, board-relative token novelty, plans, tests, audiences and outcome statements. It cannot establish commercial uniqueness, real-world feasibility, or real impact. Gold is a strict within-board shortlist, not an objective investment recommendation.
- Stored board data lives in the browser's origin, and moving between file origins, browsers or private windows can leave data behind. Export the workspace JSON before migrating.
- Directory export uses `showDirectoryPicker`, which is not available in every browser. ZIP export is the portable alternative.

## Scoring / gold mechanics

`source/core.js` computes raw feature contributions for each metric. Hardcoded weak and strong fixture raw values define a per-metric 1-5 normalization; the medium fixture checks that scores are not all at one extreme. The reference gate must pass before any gold designation is allowed. The current baseline is weak 3/15, medium 9/15, strong 15/15 in isolation.

For board candidates, a gold idea must score **at least 13/15**, have **no metric below 4**, pass calibration and fit within a shortlist of approximately the top 10 percent of **active** candidates (minimum one slot per non-empty board). User overrides are recorded and still subject to the gold criteria. Every active candidate is rescored against currently active peer ideas after a board-data mutation, so board-relative originality may change as the board evolves.

## Gold project folder structure

```text
<idea-slug>/
  claude.md
  README.md
  brief/
    first-increment.md
  jury/
    verdict.json
  lineage/
    family-tree.json
  source/
    idea.json
```

`claude.md` contains the goal, problem, user, mechanism, difference, expected impact, smallest testable increment, validation, constraints, risks, open questions, lineage and jury rationale. The ZIP contains no credentials.

## Source and testing

```text
index.html                 Standalone release artifact (all CSS and JS inline)
source/shell.html          HTML + CSS shell (build source)
source/core.js             Deterministic rules, scoring, genealogy, exports
source/app.js              Browser UI, persistence, model connectors, autopilot
source/observatory.js      Data-backed causal graph navigation (Canvas 2D)
source/observatory.css     Observatory presentation and workbench styling
source/immersive.js        Full-screen field mode, delegated controls and accessible drawers
source/immersive.css       Viewport-budget CSS and responsive field layout
build.py                   Concatenates the source into the standalone HTML
README.md                  This file
ARCHITECTURE.md            Technical design and boundaries
OPERATIONAL_STATE.md       Verified and unverified behavior ledger
QA.md                      Results and test limitations
tests/test_core.js         Node built-in test runner, no npm dependencies
tests/test_browser.py      Optional Playwright visual/behavior QA
tests/test_observatory.py  Original canvas behavior and workbench regression
tests/test_immersive.py    Browser-verified <30% viewport chrome and mode transitions
```

To rebuild: `python3 build.py`. For deterministic tests: `node --test tests/test_core.js`. For UI tests: `python3 tests/test_browser.py`, `python3 tests/test_observatory.py`, and `python3 tests/test_immersive.py` (requires Python Playwright plus a Chromium executable; these **test tools** are not runtime dependencies of the app).

## External API references

- Ollama API: https://docs.ollama.com/api/introduction
- LM Studio OpenAI-compatible endpoints: https://lmstudio.ai/docs/developer/openai-compat
- Anthropic browser API authentication/CORS: https://platform.claude.com/docs/en/manage-claude/authentication
- Browser directory picker compatibility: https://developer.mozilla.org/en-US/docs/Web/API/Window/showDirectoryPicker

## Evolution Rig 1.1 Uplift (historical baseline) (2026-11-09)

Version 1.1 adds faster large-board jury reuse, an anti-padding negative control, a near-duplicate gold check that protects earlier source ideas, the **Evolution Lens** in descendant inspectors, native Ollama JSON schema requests, deep lineage that does not truncate at 500 generations, and complete per-idea history receipts. **Existing schema-1 workspace JSON remains compatible.**

The original weak/medium/strong anchors remain **3/9/15**, and a fourth repeated-boilerplate negative control must score **11/15 or lower**. The same jury still computes all scores locally. A lexical novelty score or score increase does not prove market originality, technical feasibility, legal compliance or real impact. Gold requires 13+/15, no metric below 4, reference tests passing, an available top-decile slot, and no earlier near-copy with an equal-or-higher score.

The Evolution Lens compares a descendant with its currently strongest parent and lists word-level changed fields. Its purpose is to expose possible change for human review, not to declare that a branch is a discovery.

Ollama now receives a structured idea JSON schema for **generation** requests. The Test connection probe still uses generic JSON mode. Other provider contracts are unchanged. Backend CORS and endpoint compatibility must be tested on the user's own machine.

**Benchmarks and independent reports:** `PERFORMANCE_REPORT.md`, `UX_AUDIT_v1.0.md`, `COMPETITIVE_RECON.md`, `CHANGELOG.md`, `QA.md`.

**Current test suite:** 13 built-in Node tests; managed Chromium UI test including Ollama-schema request mock; `tests/benchmark.py` with matched 60/180 node fixtures. `tests/test_real_origin.py` is available for environments that allow localhost browser navigation, but prints an explicit SKIP under the restricted managed Chromium here.
