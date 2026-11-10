# Evolution Rig v2.0 — release proof ledger

- Build reproducibility: `python3 build.py`; `python3 tests/test_rebuild.py` confirms byte-for-byte match.
- Node tests: `node --test tests/test_core.js tests/test_starters.js tests/test_uplift.js` — 28/28 PASS after final integration.
- Browser tests: `test_browser.py`, `test_observatory.py`, `test_immersive.py`, `test_starters.py`, `test_guide.py`, `test_uplift_browser.py`, `test_usage_browser.py` — PASS in managed Chromium against compiled HTML; storage shim is used for non-real-origin suites.
- True HTTP and IndexedDB: `test_real_origin.py` — SKIP in managed Chromium because loopback HTTP navigation is administratively blocked, not because feature passed. CI attempts this in a different environment.
- Default persistent UI: measured 18.5–25.3% across seven sizes in the viewport budget test, always below 30%; the modal is deliberately larger only while opened.
- External model routes: no paid calls; local network/CORS behavior probed only with test doubles unless real origin passes.
- No craft-related starter or filter in the current build.
- Source and tests must be checked into GitHub together with its exact compiled HTML, then the actual GitHub Actions workflow/deployment run checked for that commit.

See `IMPLEMENTATION_MATRIX.md` for feature-by-feature proof limits.
