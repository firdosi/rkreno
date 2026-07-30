# Prompt 1.2 style-conflict removals

The substantive Prompt 1.2 shared implementation remains in place. This correction changes validation, not Prompt 1.3 page bodies.

| File / logic | Reason | Replacement | Scope |
|---|---|---|---|
| Conditional exact/generic chrome | Produced multiple shared shells | One native shared header/footer | 48 public routes |
| Legacy ExactHome header/footer | Source-inaccurate duplicate components | Source-derived RK shared components | Homepage chrome |
| Unscoped legacy selectors | Risked cross-route conflicts | `.rk-*` scoped shared styles | All routes |
| Preset parity results | Hid measurable differences | Fresh route-specific evidence pipeline | 47 mirrored routes |

Regression results are recorded in `prompt-1-2-validation-summary.md`.
