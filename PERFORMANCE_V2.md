# Evolution Rig v2.0 — matched browser benchmark

Managed Chromium replay on the same container in the same test run, with the same fixture generator. v1.6 and v2.0 run as standalone compiled HTML under the same browser-test shim. These numbers are not independent performance claims about real devices, cloud providers, or long running sessions.

| Nodes | v1.6 initial load | v2.0 initial load | v1.6 filter median | v2.0 filter median |
|---:|---:|---:|---:|---:|
| 60 | 236.9 ms | 250.2 ms | 1.2 ms | 1.2 ms |
| 180 | 509.4 ms | 504.3 ms | 5.3 ms | 3.8 ms |

Raw snapshots: `tests/baseline_v1_6.json`, `tests/after_v2_0.json`. Variation is small relative to what is needed for a causal performance claim; **no proven speedup**. No mobile thermal/FPS test and no 1,000-node longitudinal benchmark. v2.0 adds a bounded inverted index for semantic candidate relationships, viewport-culls certain lines, and caps labels, but large-node performance is a monitoring concern, not resolved proof.
