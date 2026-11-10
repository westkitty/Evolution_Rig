# Evolution Rig v2.0 — implementation and evidence matrix

Scope: 19 eligible COOL changes (C01-C20 excluding the withdrawn C08). This record distinguishes executable features from independently established outcomes. Source snapshot initially built from the corrected v1.6 release. All changes are additive and optional unless specified. No authored user workspace data was migrated or overwritten by the build.

## Obligations, implementation, and proof

| ID | Feature implemented | Execution evidence and limits | State |
|---|---|---|---|
| C01 | GitHub source package and source-to-deploy build gate | `source/`, `build.py`, browser/core tests, and `.github/workflows/deploy-pages.yml`; workflow builds, checks tracked `index.html` byte parity, runs tests, and publishes **only** `publish/index.html`. Actual remote CI/deployment remains unverified until the GitHub run completes. | LOCAL PASS; REMOTE PENDING |
| C02 | Hypothesis/experiment records separate from the structural jury | Lab > Experiments writes typed `experiments[]` with hypothesis, baseline, method, status, observation and source. Persisted and browser-tested; operator testimony is not external validation. | LOCAL PASS |
| C03 | IndexedDB checkpoints, restore preview/confirmation and cross-tab write suppression | Recovery section offers manual and debounced automatic snapshots (up to 8), protected restore with pre-restore safety snapshot; cross-tab changes block this tab's localStorage persistence. `test_real_origin.py` exercises genuine HTTP/IndexedDB on unrestricted browsers. This managed Chromium environment blocks loopback origin, so durable restore is unverified locally. | PARTIAL; TRUE-ORIGIN PENDING |
| C04 | True HTTP-origin regression test | `tests/test_real_origin.py` now verifies reload, localStorage, IndexedDB checkpoint/restore, fake local-model CORS, schema, and ancestry; CI runs it. Managed local browser returns administrative navigation denial, recorded as SKIP, not PASS. | TEST IMPLEMENTED; RUN PENDING |
| C05 | Opt-in model usage governor | Hosted requests disabled by default each session, bounded per-session request cap and receipt accounting; local model options preserved. `test_usage_browser.py` tests rejection and cap with mocked fetch and no real billable calls. Token cost estimates are not asserted to be provider billing receipts. | LOCAL PASS |
| C06 | Separate operator review and comparison to the heuristic jury | Lab > Blind review records user-supplied 1–5 scores separately; derived MAE compares them with fixed computed jury scores. Blind real-world evaluator study has not occurred; no claimed empirical calibration. | REVIEW TOOL PASS; HUMAN CALIBRATION UNVERIFIED |
| C07 | Alternative offline exploration operators and lexical change receipts | Board-level Refine vs Explore, six distinguishable delivery mechanisms, per-child lexical delta receipt, no claim of semantic novelty. Pure-core and browser regression tests. | LOCAL PASS |
| C09 | Grounded shared-term relationships | Semantic overlay uses only inspected mechanism/constraint/problem token intersections, exposes terms, never invents ancestry; bounded inverted index avoids quadratic all-pairs scan. Edge counts and toggle browser-tested. | LOCAL PASS |
| C10 | Optional contextual three-step first flight | Lab > First flight determines stages from real boards/descendants; actions route to existing controls, create no fixture records. | LOCAL PASS |
| C11 | Literal mission locks | Board-scope required/forbidden literal rules; generated children checked before writing. Explicit warning: text inclusion does **not** prove semantic compliance. | LOCAL PASS |
| C12 | Two/three-way candidate comparison | Lab > Compare uses real records and readonly field-by-field comparison. | LOCAL PASS |
| C13 | Nondominated Pareto compass | Lab > Compass computes 3-axis dominance from existing `effective` heuristic jury metrics, distinct from gold ranking; no invented impact evidence. | LOCAL PASS |
| C14 | Bounded reversible text-edit history | Native editor creates up to 30 field snapshots per idea; Lab > Revisions confirms and restores text only, leaving ancestry/history intact. | LOCAL PASS |
| C15 | Non-mutating autopilot rehearsal | Lab > Rehearsal previews deterministic parent candidates/caps and marks unknown future offspring, model results and actual pruning. No paid calls or state changes on preview. | LOCAL PASS |
| C16 | Cross-board idea reuse | Lab > Reuse copies into an independent destination root, records source provenance, keeps original board IDs and ancestry untouched; tested. | LOCAL PASS |
| C17 | All-board local search | Lab > Search inspects current workspace fields/board titles, returns local results; selecting result changes board intentionally. | LOCAL PASS |
| C18 | Scale safeguards and measurable diagnostics | Observability labels and edge viewport culling, cap on labels, semantic term index, Lab > Scale measures local derived operations. Matched 60/180-node benchmarks do not prove performance beyond tested size. | LOCAL PASS; LARGE-HARDWARE UNVERIFIED |
| C19 | Candidate brief export | Lab > Briefs exports Markdown for regular or archived ideas without bypassing existing gold-project ZIP gate; includes juror disclaimer and provenance. | LOCAL PASS |
| C20 | Linear nonvisual ancestry | Lab > Lineage exposes explicit ordered text hierarchy from recorded parents/ancestors. Browser tested; external assistive-technology device testing not yet performed. | LOCAL PASS; AT DEVICE UNVERIFIED |

## Protected capabilities

- Original 20 seed ideas in original five themes; no withdrawn specialty content.
- Offline standalone `index.html`, zero runtime CDN/dependencies, no background services, no uncontrolled model requests.
- Workspace `schema:1` backward-compatibility, validated imports, explicit JSON export, existing board/idea IDs and ancestry, existing jury scoring and gold qualifications.
- Existing model provider modes and keys excluded from workspace exports; user's browser data is not part of source/release.
- Full screen causal map and **less than 30%** default persistent UI across seven tested viewports; opt-in Lab is allowed to occupy more space when opened.
- Existing Board, Seed Vault, Editor, Jury, Autopilot, Provider, family-tree, Causal Field and export flows.

## Non-passing evidence is not hidden

- Real-origin storage/network/browser QA is locally skipped due managed Chromium policy and must be checked on a runnable host.
- A human-calibrated jury requires actual blinded independent ratings and a representative sample; no such dataset was manufactured.
- Provider pricing and user-specific spend are not measured by the local request ceiling.
- Mobile hardware, assistive technology devices, thousand-node long sessions and external model endpoints are not certified by these local tests.
- Source/CI/deployment identity must be checked against the final GitHub commit before calling remote release complete.
