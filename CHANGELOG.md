## v2.0 — Evolution Lab and reproducible release

Implemented 19 scoped features (C01–C20, except withdrawn C08) with optional Lab controls and schema-1 backward compatibility. Build source, tests, release CI gate and complete verification matrix provided. See `IMPLEMENTATION_MATRIX.md` and `RELEASE_QA_V2.md` for proof-state distinctions.

## v1.6
- Reinstated the five-theme catalog (four ideas per category) and original Skills That Travel seed after an incorrect domain-specific substitution.
- Removed the withdrawn starter from code, interface, help text, tests, and current-release documentation; retained all other functioning features.
- Preserved schema-1 user workspace data without deleting or rewriting pre-existing user-created records.

## v1.5
- Verified the field-manual HUD control and repaired the immersive drawer/scrim stacking order. Added browser regression protection for both.
- Added a space-themed star-field visual treatment across the app shell and Seed Vault.
- Added a new Field Manual modal explaining boards, seeds, evolution, jury scoring, the observatory, autopilot, exports, and the Seed Vault.

## 1.4 / The Seed Vault / 2026-11-09

- Added twenty distinct, actionable and inspectable starting proposals in five themes: Systems, Worlds, People, Planet and Strange.
- Added a full-focus, searchable, theme-filtered Seed Vault accessible from the Causal Field, first-use prologue, board drawer and original workbench without enlarging persistent chrome.
- A starter can become a new independent board with a genuine generation-zero root, join the current board as another root, or prefill the original idea editor for revision. No preview writes workspace data.
- Reused the existing board, seed, jury, history, persistence and field presentation paths; no provider calls, extra dependencies or workspace-schema changes.
- Added catalog contract and Chromium interaction tests for twenty items, filter/search, keyboard focus, Escape, board isolation, additive planting, edit-before-save, reload, mobile dialogs and the original under-30% viewport budget.

# Evolution Rig — Change history

## Causal Field / Immersive interface / 2026-11-09

- Made the real ancestry Canvas 2D map the full-viewport default; moved board management to an accessible drawer, record to an on-demand compact panel, and full editing into a reversible Workbench mode.
- Introduced compact navigation, zoom/fit/trace dock, preserved generation-depth control, concise board and idea telemetry, and contextual empty-field onboarding. No invented nodes or network dependencies.
- Persisted only the surface preference under a separate browser key; preserved workspace schema 1 and original board/idea model, jury, provider router, autopilot and export pipelines.
- Added keyboard Escape close, B/N/? shortcuts outside form fields, inert hidden panels, reduced-motion drawer behavior, and responsive controls for very short landscape viewports.
- Corrected the empty observatory readout to report no generations until a seed exists.
- Added an adversarial Chromium test with explicit <30% persistent chrome measurements at 7 viewports, original workbench roundtrip, canvas hit tests, board/seed creation, depth reveal, focus handling, preference persistence, and no console errors. See `tests/test_immersive.py`.
- Preserved historical tests, prior project source and rollback ZIPs. The requested '30%' is a default persistent-interface budget; open-on-request panels can exceed it by design.


## Causal Observatory visual overhaul / 2026-11-09

- Built the Causal Observatory over the existing v1.1 logic, without replacing the jury, procedural generation, board workspace, model router, or ZIP handoffs.
- Added generation-ring topology and true recorded parent edges, with gold/archived/hybrid visual encoding and ancestor/descendant highlighting.
- Added select-by-pointer, pan, zoom, fit, trace, keyboard arrow navigation and an accessible alternative Signal list.
- Added generation-depth reveal/scrub controls to make accumulated branching visually inspectable without changing stored data.
- Added a truthful Field Report showing observed ancestry, descendants, archived paths, recent receipt and strongest descendant score change.
- Changed the visual system to a restrained archival-instrument treatment: typographic hierarchy, legibility, semantic surface layers, contextual color and a quieter dark field. No external imagery or decorative particle system.
- Preserved selection-time jury cache when only the selected ID changes; added keyboard arrow/Home/End tablist navigation and mobile board-form disclosure after existing data is loaded or created.
- Introduced `source/observatory.js`, `source/observatory.css` and `tests/test_observatory.py`. New feature tests prove real canvas hit testing, data-backed selection, time-depth reveal, focus/zoom, keyboard, mobile disclosures and preserved core actions.
- Original v1.1 remains available separately as a rollback release; the workspace schema remains version 1.

# Evolution Rig Changelog

## 1.1.0 — 2026-11-09

**Compatibility:** Existing workspace schema 1 remains readable; no accounts, new application dependencies, external database or deployment.

### Material changes

- Cached board-wide jury snapshot, invalidated on mutations, removes repeated peer analysis from graph redraws.
- Stronger word-diversity scoring prevents simple repeated boilerplate from automatically winning high scores.
- Fourth negative calibration control prevents anti-padding regression; original three fixed score anchors remain 3/9/15.
- Gold eligibility favors an earlier strong source instead of penalizing it for later near-copy descendants. A later high-overlap copy must improve to compete.
- New Evolution Lens receipt in the selected descendant inspector: strongest-parent score delta, changed fields and new mechanism terms, with honest word-level caveat.
- Native Ollama JSON-schema request for count-bounded idea generation. Other providers retain their prior request format.
- Full iterative deep lineage without a 500-generation truncation.
- No silent truncation of idea-specific verdict history after 120 receipts; corresponding import preserves history.
- Reject duplicate/overlong import identity strings rather than risking ID collisions.
- 13 Node regression tests (up from 7) and expanded Chromium mock request tests; retained original flows.

### Evidence and guardrails

- Matched 180-node filter 1469.3 → 5.7 ms (managed Chromium fixture); see PERFORMANCE_REPORT.md.
- Independent baseline UX audit and current external analogue report included.
- No Git repository existed in this delivered local folder, so no commit, remote push or deployment is claimed.
- Real provider networking, file-origin navigation and OS-level autopilot were not verified or added.
