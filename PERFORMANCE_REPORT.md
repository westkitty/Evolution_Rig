# Evolution Rig — Matched Performance Pass

Date: 2026-11-09. Original baseline is from untouched v1.0 `index.html`. Final build is from v1.1 source. Both were tested with the same `tests/benchmark.py`, local managed Chromium, same 60- and 180-idea synthetic workspaces, same representative graph filter action and same measurement method. Timings are wall-clock for initial load and `performance.now()` for synchronous graph-filter handler; they are **not** typical-device benchmarks or p95 latencies.

| Workload / metric | Original v1.0 | Uplift v1.1 | Matched measured delta |
|---|---:|---:|---|
| 60 nodes / initial load | 585.7 ms | 203.8 ms | 65.2% less time |
| 60 nodes / graph filter median | 173.4 ms | 2.4 ms | 98.6% less time |
| 180 nodes / initial load | 5,245.2 ms | 489.4 ms | 90.7% less time |
| 180 nodes / graph filter median | 1,469.3 ms | 5.7 ms | 99.6% less time |

### Root cause

The original UI recomputed every candidate's board-relative jury across repeated sort comparisons, per-card rendering, gold shortlist queries and inspector updates. Peer-scoring cost compounded with multiple render surfaces. The improvement uses one memoized **jury snapshot per actual board mutation** and reuses its verdicts in both per-card displays and gold selection. Every edit, override, import, generation, archive action, board switch and persisted mutation invalidates the snapshot; stale scores are not allowed to survive data changes.

### Distinct trust improvements (not performance measurements)

- Fixed anchors remain weak 3/15, medium 9/15, strong 15/15. A padded nonsense paragraph fell from 15/15 to 10/15 after unique-informative-token coverage was added.
- Gold rejects later near-duplicates that cannot improve on an earlier equal-or-better idea; it does **not** punish the earlier original for attracting similar descendants.
- Deep ancestry traversal is now iterative; a 701-node chain is fully returned rather than silently truncated. Individual verdict history is retained instead of only the last 120 receipts.

### Limits

This is a deterministic fixture, not a measured distribution of user workloads. The managed browser prohibits loopback HTTP navigation, so true origin storage and real model CORS tests remain unverified. A large real workspace may exceed localStorage quotas; browser warnings and workspace JSON export mitigate but do not eliminate that constraint. Text scoring remains a heuristic, not an independent ground-truth evaluator.

### Reproduction

```sh
python3 tests/benchmark.py
node --test tests/test_core.js
python3 tests/test_browser.py
python3 tests/test_real_origin.py
```

The last command prints an explicit SKIP when the browser administrator blocks loopback navigation. The baseline numbers are retained in `tests/perf_before.json` and the final numbers in `tests/perf_after.json`.
