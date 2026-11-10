# Causal Observatory / matched performance evidence

Measured with the existing `tests/benchmark.py` on managed Linux Chromium, Python 3.13 and Node 22. Same synthetic 60- and 180-node boards, same viewport, same DOM method and input work. Baseline is the unchanged Evolution Rig v1.1 build in `/mnt/data/evolution_rig/` at the start of this task. New build is `evolution_rig_v1_2/index.html`.

| Workload and metric | v1.1 control | Observatory | Observed change |
|---|---:|---:|---|
| 60 ideas: initial `set_content` load | 199.7 ms | 271.5 ms | +71.8 ms overhead |
| 60 ideas: graph filter median | 1.8 ms | 2.0 ms | +0.2 ms (measurement-level difference) |
| 180 ideas: initial `set_content` load | 503.6 ms | 529.7 ms | +26.1 ms overhead |
| 180 ideas: graph filter median | 6.2 ms | 4.8 ms | -1.4 ms; cannot attribute to a proven optimization |

Source files: `tests/perf_v1_1_control.json`, `tests/perf_v1_2_final.json`.

## Interpretation

- The interactive overview adds measurable initial work, chiefly layout and first canvas painting, without undoing the v1.1 fast cached-jury graph-filter path.
- The new canvas has no idle `setInterval` or self-perpetuating animation loop. Redraw is scheduled only after updates, pointer movement, changes in zoom/depth/selection, resize or view re-entry. This is source-confirmed, not a measured claim of zero idle device power draw.
- Browser DPR is capped at 2. The canvas visual overlay uses no external asset request, WebGL context or texture uploads.
- `setSelection` no longer invalidates the jury cache when only the selected idea changes; the family graph still rebuilds on selection, so heavy-board selection responsiveness is a potential future benchmark target.

## Evidence limits

One benchmark trial is not a statistical study; small deltas cannot establish performance dominance. Device-specific mobile hardware, thermal behavior, memory growth across multi-hour sessions, real-origin reload, and model networking remain unmeasured. The visual upgrade is an intentional startup-cost tradeoff, not a claim of free graphics.
