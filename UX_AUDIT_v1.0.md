# Evolution Rig 1.0 — Zero-Loss UX Audit (Original Baseline)

**Mode:** Read-only audit of the original v1.0 interface and source. This document is a redesign proposal, **not** an implementation claim. The companion uplift operates under a separate implementation directive. Date: 2026-11-09.

## 1. Executive verdict

The underlying operating model is unusually transparent: boards, ancestry, jury and exports are real. The largest UX problem is **task fragmentation**. A newcomer faces a permanent board-creation form, four feature-oriented tabs, a horizontally scrollable ancestry graph, and an unusually long inspector before understanding a simple loop: **state the goal → propose → branch/combine → compare → export**. The strongest zero-loss redesign is *task-centered, contextual work* while preserving a direct route to every advanced control.

## 2. Product truth and evidence

- Purpose: explore goal-anchored ideas through manual creation, procedural or model-assisted evolution, independently computed scoring and portable project handoff.
- Primary flow: create board → seed idea → inspect computed verdict → branch or crossbreed → compare/override → choose gold candidate → ZIP/folder export.
- Protected: fully offline procedural mode; independent JavaScript jury and reference gate; 3 metrics /15; manual overrides and history; 1- or 2-parent ancestry; archive-not-delete; board isolation; local workspace backup/import; 8 model routes with browser-only keys; visible autopilot cadence and explicit stop; exact portable handoff files.
- Evidence: `source/shell.html`, `source/app.js`, `source/core.js`, `tests/test_core.js`, `tests/test_browser.py`, desktop and 390px screenshots, 7 passing Node tests, passing Chromium browser suite. The managed browser tests use in-page storage and a mocked endpoint; real file/HTTP navigation and model CORS are unverified.
- Evidence labels in this report: **CODE** = inspected source; **OBSERVED** = passing interaction test or inspected screenshot; **INFERRED** = plausible friction without formal usability-study results; **UNVERIFIED** = inaccessible device/assistive-technology behavior.

## 3. Capability baseline — current route, future route, parity gate

| ID | Confirmed capability | Existing entry point | Proposed entry point | Parity test | Evidence |
|---|---|---|---|---|---|
| C01 | Isolated boards with goals | Rail → New independent board | Compact board switcher → Create/edit | Board A/B data never mixes | CODE/OBSERVED |
| C02 | Local persistent state | Implicit localStorage + notice | Persistent status + backup center | Reload and backups retain graph | CODE/SHIM OBSERVED |
| C03 | Workspace import/export | Rail buttons | Data/Backup menu + visible status | Export/import schema and keys absent | CODE/OBSERVED |
| C04 | Manual structured seed | Studio → New seed | Primary Create | Full fields and edit preserved | CODE/OBSERVED |
| C05 | Edit idea fields | Inspector → Edit | Inline edit + full editor | All 10 fields roundtrip | CODE |
| C06 | N-child branch | Studio/Inspector + N | Node action → Branch N | N bounded 1–8 and lineage | CODE/OBSERVED |
| C07 | Drag-drop crossbreeding | Drag one card onto another | Graph drag/drop with same semantics | Exactly 2 distinct parents | OBSERVED |
| C08 | Accessible crossbreed fallback | Pick parent twice | Compare/Combine drawer + keyboard pick | Touch/keyboard fallback works | CODE/partially OBSERVED |
| C09 | Graph filtering/search | Studio workbar | Contextual toolbar | Active/all/gold + search parity | CODE |
| C10 | Selected-node inspector | Right-hand pane | Context drawer/panel | All fields, ancestry and event history | OBSERVED |
| C11 | Reference calibration | Jury tab | Jury diagnostics | Weak/medium/strong anchors unchanged | CODE/OBSERVED |
| C12 | Computed O/F/I score | Graph + Jury + Inspector | Same with clear score evidence | Deterministic 1–5 each, /15 | CODE/OBSERVED |
| C13 | Scarce gold gate | Dynamic badge | Shortlist panel | Gate and cap unchanged | CODE/OBSERVED |
| C14 | Manual score overrides | Inspector dropdowns | Verdict details → Override | Reason/value/history, revert to auto | CODE/OBSERVED |
| C15 | Historical verdict events | Inspector bottom | History/receipts panel | Full receipts export preserved | CODE |
| C16 | Full ancestral lineage | Graph + ancestry buttons | Graph + timeline drawer | Archived ancestors remain addressable | CODE/OBSERVED |
| C17 | Manual archive/restore | Inspector Archive/Restore | More → Archive/Restore | No deletion from lineage | CODE/OBSERVED |
| C18 | Autopilot timed/manual | Autopilot tab | Run control + advanced scheduler | Cadence, cap, threshold, stop | CODE/OBSERVED (manual) |
| C19 | Execution log | Autopilot tab | Run history | Parent choices, cuts, sources visible | CODE/OBSERVED |
| C20 | Eight provider profiles | Models tab | Settings → Models | Profiles and keys stay browser side | CODE/OBSERVED (mock) |
| C21 | Connection probe | Models tab | Settings → Test | Real request requires explicit action | CODE/OBSERVED (mock) |
| C22 | Gold ZIP/folder handoff | Inspector | Qualified winner → Export | `claude.md` and JSON evidence unchanged | CODE/OBSERVED ZIP; folder UNVERIFIED |
| C23 | Reduced-motion styling | CSS media query | Preserve across redesign | No forced motion | CODE |
| C24 | Keyboard card activation | Graph Enter/Space | Equivalent cards + context action | Keyboard select and operate | CODE, AT UNVERIFIED |

**Parity rule:** Do not approve a redesign unless every C01–C24 row passes in the revised application. A screenshot is not parity evidence.

## 4. UX friction map

| Severity | Issue and evidence | Consequence | Proposed response | Acceptance check |
|---|---|---|---|---|
| MAJOR | Permanent board-creation form pushes active work down on mobile (screenshot) | First-view task obscured | Collapse creation when a board exists; keep one-click Create | Active board/title/actions visible within initial viewport |
| MAJOR | Dense inspector lists nearly every field before ancestry and jury evidence (source/screenshots) | Difficult scanning and repeated scrolling | Progressive disclosure: Overview, Compare, Evidence, History | All original fields and events still reachable |
| MAJOR | Graph does not explain child vs. parent improvement (source) | Evolution can feel like score chasing | Difference inspector that compares parent vs. child | User can inspect actual changed fields and score deltas |
| MAJOR | High values awarded to repeated verbose text (core heuristic; testable) | Trust in score and gold degrades | Anti-padding calibration fixtures, rationale | Padding cannot win 13+/15 |
| MAJOR | Graph rerenders rerun full jury repeatedly (source and 180-node benchmark) | Latency compounds at meaningful board sizes | One cached verdict snapshot per mutation | Same scores, lower 180-node input latency |
| MAJOR | Disabled gold export says qualification is needed but not next actionable gap (source) | Mystery blocking useful action | Explain failing metrics and shortlist rank | Show next criterion, not only general rules |
| MAJOR | Incomplete undo for field edits and overrides (event history records change but does not restore) | Recoverability depends on backups | Reversible per-node snapshots | Edit/override undo works without loss |
| MINOR | Crossbreed is split across graph drag/drop and inspector pick controls | Discoverability depends on tutorial | Explicit Combine interaction next to Branch | Keyboard/touch flow discoverable |
| MINOR | Active filter can hide a currently selected archived node | Visual selection and detail mismatch | Reveal selection filter state; offer show selected | No seemingly orphaned inspector |
| MINOR | Four feature-oriented tabs force switching between idea, verdict, run and model | Workflow interrupts | Task-first navigation + compact settings | Primary journey stays in one working context |
| MINOR | Graph uses fixed narrow columns and nested scrolling (CSS) | Orientation lost in deep trees | Fit-selected, breadcrumb, generation minimap | 50+ nodes navigable without losing active idea |
| MINOR | Manual override reason is recommended but optional | Weak explanations for subjective changes | Label reason clearly; preserve low-friction choice | Override history explains difference |
| MINOR | No board metadata editing after creation | Typos require new board/export | Edit board title/goal with explicit re-evaluation | Goal change transparently flags score assumptions |
| MINOR | Console/network errors become temporary toast | Diagnostics may disappear before action | Persistent last-failure detail with copy option | Error remains inspectable until cleared |
| MINOR | Tiny 10–11px labels and low-contrast tertiary text (screenshots) | Small-text strain, especially mobile | Increase metadata legibility and contrast | WCAG check; minimum target sizes |
| MINOR | No direct same-board idea side-by-side comparison | Hard to choose winner | Compare two candidates via selected pair | Differentiation and evidence visible without recall |
| POLISH | Score labels show O/F/I but require decoding | Extra learning overhead | Tooltip/key and expanded labels at first use | First-time interpretation unambiguous |
| POLISH | No recent outcome summary after a generation | User must inspect new nodes/log | Inline run summary of parents, children, cuts | One visible outcome for each run |

## 5. Three strategies

| Strategy | Description | Preservation risk | Cost | Decision |
|---|---|---|---|---|
| A. Surgical simplification | Collapse board creator; label and group controls; declutter inspector and log | Low if verified | Low | Immediate candidate |
| B. Structural reorganization | Task-centered Studio with Compare/Evidence drawers; separate Models/Advanced; clearer graph focus | Medium: routes, keyboard, discoverability | Medium | **Recommended staged target** |
| C. Radical reimagination | One zoomable spatial evolutionary surface replacing tabs and inspector | High: accessibility, data legibility and interaction complexity | High | Reject for now; no evidence that it outperforms B |

## 6. Recommended future experience

**Operating model: Goal → Ideas → Experiments → Decision.** The active board and selected idea remain visible. A primary toolbar offers New idea, Branch, Combine and Compare. The central graph remains the orientation surface, with a lightweight right pane containing Overview, Comparison, Jury Evidence and History. One contextual panel handles scheduled evolution and route status, while the full model configuration remains discoverable in Settings. Workspace import/export remains one click from a clear Data menu.

- **Desktop:** board switcher left; graph center; inspector as contextual right pane; compare drawer reachable beside branch.
- **Tablet:** graph + inspector stack with sticky selected-node summary and visible parent chips.
- **Mobile:** board summary and primary action first; creation/settings collapsed; graph remains horizontally scrollable but zoom/fit controls and a legible selected-node action strip mitigate orientation loss. No force-zoom or hidden-only gestures.
- **Keyboard:** tab to cards, Enter to select, contextual Combine to choose second parent; focus returns to action origin after dialog close; Escape closes dialogs; tablist arrow navigation if proper tab semantics are adopted.
- **States:** explicit empty board, filter-empty, model loading, offline mode, failed CORS, storage blocked, autopilot paused, gold disqualified, successful export and import confirmation.

## 7. Twenty ranked improvements (recommendations only)

1. Cache one jury snapshot per board mutation; maintain transparent invalidation (high, low effort).
2. Reject score-padding and repeated boilerplate through adversarial reference checks (high, medium effort).
3. Show a concrete per-child difference from parent; keep two-parent contributions distinct (high, medium effort).
4. Add candidate comparison view with field and score deltas (high, medium effort).
5. Show why gold export is disabled with precise failed conditions (high, low effort).
6. Collapse permanent Create board form after first board exists (high, low effort).
7. Turn long inspector into progressive evidence layers (high, medium effort).
8. Add local recoverable undo for field edits/overrides, with export receipts (high, medium effort).
9. Make selection, filtering and archive visibility consistent (medium, low effort).
10. Provide a dedicated Combine action with explicit parent chips, preserving drag/drop (medium, medium effort).
11. Keep autopilot progress/result summary attached to active board (medium, low effort).
12. Add graph fit-to-selection and generation breadcrumbs (medium, medium effort).
13. Allow editing board title/goal, while warning if scoring context changes (medium, medium effort).
14. Make storage health/backup currency actionable, not just passive text (medium, low effort).
15. Add score-domain glossary and interactive feature contributions (medium, low effort).
16. Permit direct keyboard navigation between tabs with correct ARIA tab relationships (medium, low effort).
17. Increase small metadata font legibility and contrast on mobile (medium, low effort).
18. Offer a comparison-oriented jury table filter and transparent sort order (medium, low effort).
19. Keep failed route/probe diagnostic visible until dismissed (medium, low effort).
20. Add board-level decision memo export bundling winner, runners-up and rejected counterexamples (medium, medium effort).

## 8. Before → after task journeys (projected, not measured)

| Journey | Current code-confirmed path | Target workflow | What improves | Preservation obligation |
|---|---|---|---|---|
| Start an existing board | Scroll past creation controls on narrow screens → board header → New seed | Board summary → New idea | Less visual distraction | Create board still one click |
| Compare two variants | Select A → read inspector → select B → remember A | Pick two → Compare with explicit differences | Removes working-memory comparison | No score/lineage changes |
| Crossbreed | Drag/drop or choose each inspector Pick parent → Crossbreed picked pair | Combine → choose A/B, with drag/drop still supported | Fewer unexplained steps | Exact 2-parent ancestry |
| Diagnose why no gold | Select → read generic gold rule → inspect scores and jury | Qualification checklist with failing criteria | Actionable next step | Gate stays deterministic |
| Recover an accidental edit | Edit → events logged but prior content not restorable | Undo snapshot → re-judge | Faster reliable recovery | Original provenance kept |

## 9. Zero-loss parity matrix

C01–C24 in §3 are the mandatory parity matrix; all entries must be mapped with browser tests before the redesign is accepted. No redesign has yet been executed or certified by this read-only report.

## 10. Implementation roadmap (approval-gated for this UX-specific redesign)

- **Tier 1:** cache and anti-padding checks; contextual qualification; board creator collapse; status/recovery messages. Gate: existing tests + adversarial scoring + mobile screenshot.
- **Tier 2:** Compare view, inspector progressive layers, clear Combine flow, keyboard tab compliance. Gate: C04–C17 behavioral tests; screen-reader audit.
- **Tier 3:** undo snapshots, board-goal edits, graph navigation aids; scalable large-board rendering. Gate: import/export compatibility, 180+ nodes and no lost lineage.
- **Tier 4:** metadata contrast/density refinements and motion polish only if real user tasks remain fully legible.

## 11. Adversarial review

- A cleaner screenshot could conceal advanced functionality. Reject unless C01–C24 parity passes.
- Collapsing the board creator must not remove simple creation on mobile.
- A compare drawer can increase screen chrome; allow closing and avoid mandatory extra steps.
- Rich zoom/minimap rendering may cost more than it saves on 200+ nodes; benchmark before adoption.
- More elaborate jury UI must never imply that text-structure heuristics validate economic or scientific truth.
- Undo based only on the visible page is insufficient if persistence or imported data is lost.
- No accessibility certification is justified by the present mouse-driven Chromium suite.

## 12. Verification and open questions

**Verified:** original 7/7 Node tests and scripted Chromium flows; screenshot inspection; source inventory; benchmark shows 180-node `nodeSearch` repaint ~1.47s median under this test environment. **Not verified:** real filesystem origin storage, native screen-reader focus order, actual touch drag/drop, mobile device thermal behavior, live provider CORS and real timed long-running autopilot. No real usability cohort or user-task timing study was conducted.

## 13. Final design thesis

**Make the interface smaller in the user's mind, not smaller in what it can do.** The graph is the workspace, the jury is evidence, the controls are actions on selected ideas, and the handoff is an explicit decision. The deepest evolution experience is not visual spectacle: it is being able to discover exactly what changed between generations and whether the evidence actually got stronger.
