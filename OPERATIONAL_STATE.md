# Evolution Rig / Operational State / 2026-11-09 — The Seed Vault

## Current deliverable

**Evolution Rig Cosmic Field Manual (v1.6; immersive interface, five-theme Seed Vault and field guide)** — one self-contained `index.html` plus editable `source/`, `build.py`, docs, performance fixtures, unit and Chromium UI tests. Original v1.0 and v1.1 ZIPs remain intact as rollback artifacts. This deliverable working copy has no local `.git` directory. The GitHub repository is a distinct published target; local source and remote HTML revisions must be reconciled explicitly before updating it. The remote website should not be considered updated until the new remote revision and deployment are observed.

## Source-of-truth layout

- `source/core.js`: deterministic idea rules, calibration, jury, lineage, export and import guards.
- `source/app.js`: UI state, cache invalidation, observatory report adapter, autopilot, model routing and browser persistence.
- `source/observatory.js`: read-only Canvas 2D lineage projection, depth reveal, focus, pointer and keyboard navigation.
- `source/observatory.css`: editorial instrument styling and responsive original workbench layout.
- `source/immersive.css`, `source/immersive.js`: full-viewport mode and delegated command/disclosure controls, no data mutation.
- `source/shell.html`: markup and original CSS. `build.py` regenerates `index.html` from the shell and all inline CSS/JS sources.
- `UX_AUDIT_v1.0.md`: **read-only baseline UX proposal**; its broader staged redesign recommendations were not implemented by this release.
- `COMPETITIVE_RECON.md`, `PERFORMANCE_REPORT.md`, `QA.md`, `CHANGELOG.md`: investigation, comparisons, evidence and accepted changes.

## Verified capabilities / protected invariants

- Dependency-free offline HTML; static HTML can function without a server when browser file-origin policy permits. Offline model mode uses rule-based ideas, not inference.
- Board isolation, manual seed, up to eight child branches, drag/drop and accessible picked-pair crossbreed, full archived ancestry.
- Independent computed O/F/I scoring 1–5; weak/medium/strong anchors 3/9/15, padded negative control 10/15; manual score overrides and event receipts.
- Earlier strong source idea survives the near-duplicate gold gate; later copies must improve to compete; top-decile scarcity retained.
- One memoized verdict set per board mutation. Same 180-node filter test 1,469.3ms original → 5.7ms final median on managed Chromium.
- Evolution Lens displays word-level parent/child changes and score delta without unsupported semantic inference.
- No silent 500-generation ancestry or 120-event receipt truncation; tested 701 generations, 155 events.
- Ollama model-generation request includes explicit count-bounded idea JSON schema; other providers unchanged; no model assigns jury scores.
- Gold ZIP includes `claude.md` and all original handoff files. Workspace JSON/export excludes credentials; model keys browser session/local only.
- Active browser autopilot works by manual step and timed setTimeout while the page is open; it stops on board change/import/closure and archives non-root leaves instead of deleting ancestry.
- Original and expanded test suite passes, desktop/mobile screenshots inspected, benchmark and security constraints documented.

## New verified capability / validation boundaries

- Causal Observatory consumes real board idea, parent, generation and verdict data. No fabricated ideas, synthetic outcomes, model network calls or code-derived rankings in the renderer.
- Canvas point click, keyboard-select, zoom, fit, trace-selected, generation-depth reveal, accessible Signal alternatives, mobile board disclosure, tab keyboard navigation and original workbench integration passed a new managed Chromium interaction suite.
- Original 13 Node core tests and original browser interaction suite remain passing. Local single-file build remains dependency-free, and persistent workspace schema 1 has not changed.
- The observatory is presentation-only: no world/game/canon assets or playable game mechanics are implied. Real-world effectiveness of jury scores remains unverified.
- Baseline v1.1 and new v1.2 matched Chromium workloads were measured; new canvas introduces an additional cost on initial load while graph filtering remains quick. See `PERFORMANCE_OBSERVATORY.md`.

## Causal Field verification / 2026-11-09

- The default view is a full-viewport canvas; the persistent control/chrome budget, including empty-state card when shown, is **strictly below 30%** in managed Chromium at 1440×900, 1300×850, 1024×768, 390×844, 375×667, 320×568 and 720×400. These are measured layout claims, not device-independent guarantees.
- `tests/test_immersive.py` exercises create-board, modal idea creation, source-backed branch and edge counts, canvas point hit, zoom/fit/trace, generation-depth reveal, original Jury/Autopilot/Models access, mode roundtrip, Escape close, inert hidden panels, preference persistence, and reduced motion.
- Independent source-of-truth remains `source/core.js` and `source/app.js`. The full-screen HUD delegates actions to existing handlers. Workspace schema, privacy, provider paths and exports are unchanged.
- The 30% cap concerns always-visible chrome; expanded drawers, inspectors and editing views intentionally exceed it after user action. In particular, the accessibility workbench remains fully available; hiding its essential functions would defeat the product.
- Package distribution from this working copy excludes Git internals, scratch and cache files. External GitHub Pages deployment must be proven separately and may be blocked by the execution environment's network resolution.

## Seed Vault v1.4 / 2026-11-09

- `source/starter-ideas.js` contains **exactly 20** curated, non-authoritative root-idea proposals grouped four each across five themes. Every proposal supplies an independent board objective plus all ten current idea fields; the frozen in-memory catalog is not persisted as user workspace data.
- `source/starter.css` and a native modal gallery provide theme filters, search, selected-detail review, keyboard-native buttons, and a responsive focus surface. Modal/drawer UI exceeds the 30% budget only when deliberately opened; default chrome remains unchanged in height.
- `source/app.js` plants selected ideas through the same `C.board`, `addIdeas`, normalization, historical receipts, jury, persistence and render paths as the previous workbench. Actions: start independent board, append root to current board, prefill original editor for customisation. Merely previewing/searching does not mutate user state.
- Browser tests with a storage shim confirm board isolation, exact content, receipts, additive planting, editing, reload, no model requests, keyboard focus and close behavior. Existing immersive, observatory, core and browser interaction regressions passed against the new output. Real-origin storage and actual device/browser tests remain unverified as above.
- This working copy intentionally does not include `.git` from v1.3; remote delivery must be verified independently after publishing `index.html`, and no local Git staging/commit is implied.

## Unverified or intentionally unsupported

1. Browser-admin policy blocks real file/loopback navigation in this environment. `tests/test_real_origin.py` prints SKIP. Real-origin storage persistence/reload and CORS require user-machine execution.
2. Live Ollama / LM Studio / MLX / OpenRouter / Anthropic / OpenAI / Azure model endpoint acceptance and usage cost remain unverified.
3. User-selected folder write with `showDirectoryPicker` and extended timed autopilot/visibility behavior remain unverified.
4. No real-world outcome dataset has calibrated jury against external originality/feasibility/impact judgments. Scores are text-structure indicators only.
5. LocalStorage quota remains a scaling ceiling. Complete receipts intentionally require more capacity; surface quota failure and export independent backups. IndexedDB is a future migration only with rollback planning.
6. Previous remote v1.2 Pages deployment was reported and observed on `main` (`c06558f`); this new local work is not delivered until its actual remote revision and deployment can be verified. No Google Drive archival root chosen from duplicate `GPT` directories.

## Next verified-use step

Open the standalone file on the intended browser and run one real local Ollama or LM Studio generation with a known installed model and a restricted test prompt. Confirm CORS origin, full JSON fields and reload persistence, then export workspace JSON. Do not grant continuous unattended paid-model evolution before a provider budget ceiling exists.

## v1.5 local release reconciliation

- Previously unverified draft v1.5 missed the `hudGuide` DOM control and failed to initialize; a container stacking context blocked the board drawer behind its own scrim. Both regressions are corrected and covered by `tests/test_guide.py` and the re-run starter flow.
- The current finite catalog restores the five-theme, four-per-theme roster; the intermediate mistaken specialty starter is not a current default. No schema change or silent alteration of user-owned boards.
- The native help modal opens from HUD and board rail, is dismissible, and restores access; the old core, browser, observatory, immersive and Seed Vault suites pass on the corrected compiled HTML.
- Local final-artifact release is validated. GitHub commit/Pages deployment is to be recorded only after actual remote and CI verification.

## v1.6 corrective decision / 2026-11-10

- The user's current instruction retracts the specialty starter introduced in v1.5. Restore the v1.4-approved `Skills That Travel` entry as the fourth People idea; remove the extra theme and related public copy. This change applies to shipped application/catalog assets, not to user-created ideas saved inside a browser.
- Preserve all existing UI functions, modal flows, local-only privacy, exact twenty starters, original five-theme distribution, and <30% persistent HUD.
- Test the compiled artifact before publishing; verify GitHub `main` commit and Pages deployment separately.

### v1.6 validation record

- `node --test tests/test_core.js tests/test_starters.js`: 15/15 PASS for the restored five-theme roster, frozen data objects, complete fields, jury, import and lineage.
- `python3 tests/test_guide.py`, `test_starters.py`, `test_immersive.py`, `test_browser.py`, `test_observatory.py`: PASS in managed Chromium against newly rebuilt `index.html` using a browser-storage shim. Exact file-origin persistence remains unverified.
- New distributed source and built HTML have no withdrawn specialty content; historical v1.5 files outside this new release are not modified.
- The independent starter flow restores `Skills That Travel` as the fourth People entry; no workspace migration, deletion or replacement of user-authored ideas.
- Deployment and hosted smoke are separate from local test evidence; record the verified GitHub commit and workflow run after publication.

## v2.0 / 19-feature uplift / 2026-11-10

- Active source baseline: corrected v1.6 `84933dab641881f2000ca9c67b9f30f32af4e50e`. New local build: `evolution_rig_v2_0/index.html`, with source and CI in same project folder.
- Protected: 20 original seeds and five themes, no withdrawn specialty, schema 1, offline single-file deployment, <30% persistent chrome, old Board/Editor/Jury/Autopilot/Provider/Export paths.
- Optional Lab functionality and regression evidence: see `IMPLEMENTATION_MATRIX.md`, `RELEASE_QA_V2.md`. The user explicitly requested all 19 eligible COOL ideas, including source/CI handoff.
- Known proof gaps: managed Chromium denies localhost, so true IndexedDB/reload/CORS validation is a SKIP here; human reviewer calibration, real provider cost, real assistive tech and large mobile runtime require external evidence. Do not claim them verified.
- Remote state must be updated only after successful local build/test and an atomic GitHub commit, followed by checking the final workflow run. Historical v1.6 remote remains rollback until this succeeds.

- First v2.0 GitHub Actions run 42762941286: source byte parity and 28 Node tests passed; browser installation **FAILED** because `ubuntu-latest` transitioned to Ubuntu 26.04, unsupported by pinned Playwright 1.57 Chromium installer. Remediation pins `ubuntu-24.04`. Never describe first run as a successful deployment.
