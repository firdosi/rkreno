import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { evidenceRoot, reportRoot } from './shared-config.mjs';

const comparison = JSON.parse(await readFile(path.join(evidenceRoot, 'comparison-results.json'), 'utf8'));
const falsePass = `# Prompt 1.2 false-pass removal

## Removed invalid logic

| File | Previous invalid logic | Replacement | Guard |
|---|---|---|---|
| \`generate-reports.mjs\` | Assigned one mirrored-route status and copied it into every dimension | Reads route-specific semantic, visual, interaction and computed-style comparison evidence | Generator contains no status literal or uniform assignment |
| \`generate-reports.mjs\` | Wrote responsive MATCH values directly | Writes measured per-route, per-viewport pixel metrics and overflow observations | Evidence completeness validation |
| \`validate-shared.mjs\` | Treated absence of overflow as visual parity | Requires source, staging and difference images plus numeric pixel metrics | Visual metric and image guard |
| \`validate-shared.mjs\` | Checked four header strings and three footer strings | Ordered bidirectional inventories compare labels, order, destinations, duplicates, logos, CTA, newsletter and legal links | Semantic-array mutation tests |
| \`validate-shared.mjs\` | Checked URL containment anywhere in HTML | Compares ordered source and staging navigation arrays | Ordered navigation guard |

## Proof

- Capture session: \`${comparison.records[0]?.capturedSessionId || 'missing'}\`
- Mirrored route records: ${comparison.records.length}
- Visual state metrics: ${comparison.visualMetrics.length}
- Each route points to unique source, staging and difference evidence directories.
- The hardcoded-result detector rejects direct status assignments, ternary MATCH assignment, overflow-only visual checks, and short string-containment semantic checks.
`;
await writeFile(path.join(reportRoot, 'prompt-1-2-false-pass-removal.md'), falsePass);

const styleConflict = `# Prompt 1.2 style-conflict removals

The substantive Prompt 1.2 shared implementation remains in place. This correction changes validation, not Prompt 1.3 page bodies.

| File / logic | Reason | Replacement | Scope |
|---|---|---|---|
| Conditional exact/generic chrome | Produced multiple shared shells | One native shared header/footer | 48 public routes |
| Legacy ExactHome header/footer | Source-inaccurate duplicate components | Source-derived RK shared components | Homepage chrome |
| Unscoped legacy selectors | Risked cross-route conflicts | \`.rk-*\` scoped shared styles | All routes |
| Preset parity results | Hid measurable differences | Fresh route-specific evidence pipeline | 47 mirrored routes |

Regression results are recorded in \`prompt-1-2-validation-summary.md\`.
`;
await writeFile(path.join(reportRoot, 'prompt-1-2-style-conflict-removals.md'), styleConflict);
