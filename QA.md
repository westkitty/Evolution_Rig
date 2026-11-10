## v1.6 corrective release validation

- Restored exactly 20 authored origins across five themes with four origins each. `Skills That Travel` is restored with the exact original v1.4 fields. Extra theme and withdrawn starter references are absent in shipped source and rebuilt `index.html`.
- Static checks: Node syntax for application and catalog modules; Python compile for builder, packaging and browser suites — PASS.
- `node --test tests/test_core.js tests/test_starters.js`: 15/15 PASS.
- `python3 tests/test_guide.py`, `test_starters.py`, `test_immersive.py`, `test_browser.py`, `test_observatory.py`: PASS on the freshly compiled HTML in managed Chromium; no recorded page errors in affected flows.
- Persistent default interface remains 18.5–25.3% on seven measured viewports, below the 30% limit. Modal panels exceed this only by deliberate user action.
- User-authored browser workspace records are retained even if based on a former built-in starter. The correction changes only built-in defaults, not saved user work.
- Actual live-hosted interaction, real-origin storage and remote provider endpoints remain unverified.

## v1.5 / publication preflight (2026-11-09)

- The supplied first v1.5 build contained a missing `hudGuide` button, which caused initialization to fail, and a `.app` stacking context that placed the board scrim over its own drawer. Both were corrected in the rebuilt release.
- The current finite catalog has exactly 20 entries across five themes (Systems 4, Worlds 4, People 4, Planet 4, Strange 4), restoring the original general-purpose seed and removing the extra filter.
- `node --test tests/test_core.js tests/test_starters.js`: 15 PASS.
- `python3 tests/test_browser.py`, `test_observatory.py`, `test_immersive.py`, `test_starters.py`, `test_guide.py`: PASS, including guide entry points, drawer layer ordering, and restored general-purpose seed planting.
- Under-30% default chrome measured across seven viewport sizes (18.5–25.3%). Provider CORS, hardware, and external user-browser behavior remain unverified.

## Seed Vault v1.4 / additional verification

- Content: 20 unique ideas, exactly 4 per theme, independent objectives and complete bounded idea fields (`node --test tests/test_starters.js`: 2 PASS).
- `python3 tests/test_starters.py`: PASS. Verified modal opening from every entry route, 20 filterable and searchable choices, empty query result, native Escape, retained focused buttons, board creation and source receipts, additive root, edit-before-plant, two isolated boards, storage reload, zero network requests, mobile controls, 5 viewport budgets.
- `node --test tests/test_core.js`: 13 PASS.
- Existing `tests/test_browser.py`, `tests/test_observatory.py`, `tests/test_immersive.py`: PASS against v1.4 compiled HTML. Under-30% always-visible chrome at all seven previously tested viewports remains intact.
- Platform caveat: browser runner uses an in-page storage shim. Real `file://` or Pages persistence, live provider APIs, device-specific mobile behavior and external network requests have not been independently verified by these tests.

# Evolution Rig / Causal Observatory / quality and release evidence

Date: 2026-11-09 (task environment).

## Verified on the compiled standalone HTML

- **Core regression:** `node --test tests/test_core.js` — 13 tests PASS. Reference anchors, deterministic jury, negative control, gold scarcity, board isolation, manual overrides, 701-generation ancestry, 155-event receipts, ZIP and import safety unchanged.
- **Legacy browser journeys:** `python3 tests/test_browser.py` — PASS. Board creation/isolation, seed create/edit, N-child branch, drag/drop crossbreeding, picked-pair action, ZIP content independently parsed, overrides, pruning, simulated storage reload, mocked provider profiles, JSON schema request, no keys in exports, and mobile horizontal-overflow test.
- **New Observatory journeys:** `python3 tests/test_observatory.py` — PASS. Actual computed canvas hit targets, lineage selection, pointer click, real ancestor/descendant counts, depth slider (one displayed root vs all three), reveal all, trace focus, zoom/fit, keyboard navigation, original branch action, separate board reset, mobile board creation disclosure, keyboard tablist selection, reduced-motion access, and no browser `pageerror`.
- **Syntax/build:** `node --check source/core.js source/app.js source/observatory.js` (invoked individually), `python3 -m py_compile build.py tests/*.py`, `python3 build.py` — PASS.
- **Visual inspection:** same populated working board in managed Chromium at 1440 desktop and 390px mobile, screenshots in `tests/desktop-preview.png` and `tests/mobile-preview.png`; major panels displayed and mobile document did not overflow.
- **Performance:** measured and honestly reported in `PERFORMANCE_OBSERVATORY.md`; the visual layer adds startup overhead, cached filter cost remains low.

## Independent extracted-release checks

- **Delivered ZIP:** 39 unique and traversal-safe entries; ZIP internal CRC verification PASS.
- **Integrity:** 38 SHA-256 receipt entries PASS and 36 file-manifest entries match both byte size and SHA-256.
- **Extracted project:** 13/13 Node core regression tests PASS; original Chromium browser suite PASS; Causal Observatory Chromium suite PASS. Tests executed against the extracted ZIP contents, not the working source directory.
- **Real-origin:** SKIP, not PASS: the managed Chromium policy rejects loopback HTTP navigation.

## Source/visual invariants

- Every displayed node maps to a real board idea; every edge to a parent ID. Generation rings mean generation depth only; no fabricated chronology, outcome, physical distance or financial effect.
- Archived nodes remain visible in the Observatory even when the original family tree is filtered to active. The original tree and Jury table are accessible alternatives to Canvas.
- Gold remains a scarce locally computed structural designation, never a promise of invention quality or proof of practical feasibility.
- Board workspace JSON schema remains `1`; core, model router, keys, ZIP/folder project export and autopilot semantics are unchanged.
- No added external script, stylesheet, icon library, font, image asset or user-tracking request. No required framework, npm build, backend server or stored server-side keys.
- Original Evolution Rig v1.1 directory and ZIP are preserved as rollback artifacts; new work exists in a separate folder.

## Limitations and quality debt

- Managed Chromium blocks real `file://` and localhost navigation. `tests/test_real_origin.py` exits `SKIP`. Real `file://` persistence, CORS and live model provider requests are **NOT VERIFIED**.
- Live Ollama/LM Studio/MLX/OpenRouter/Anthropic/OpenAI/Azure model calls and provider billing ceilings are **NOT VERIFIED**. Browser tests use an intercepted, mocked network call.
- No screen-reader device testing, high-contrast mode audit, touch-device hardware testing or long-term memory/energy profiling was performed. A keyboard/semantic alternative is implemented, but formal accessibility conformance is **NOT CERTIFIED**.
- This active artifact is an idea-generation workbench rather than a playable video game. No levels, character assets, collision system, game camera, player physics or environmental VFX existed to transform. Their proposed AAA overhaul is **NOT APPLICABLE**, not fabricated.
- No actual audience studies measured awe, emotional impact or commercial-release visual quality. The project has an observed visual transformation, not an empirically certified emotional response.
- Browser autopilot still stops when the tab closes; persistent unattended evolution is intentionally unsupported.

## Release verdict

**VERIFIED LOCAL APPLICATION / PARTIAL PLATFORM PROOF.** New visual and data-driven Observatory controls and existing workbench user journeys passed in managed Chromium. External runtime/provider and accessibility/hardware proof remains outstanding.
