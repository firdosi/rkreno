# Prompt 1.2 false-pass removal

## Removed invalid logic

| File | Previous invalid logic | Replacement | Guard |
|---|---|---|---|
| `generate-reports.mjs` | Assigned one mirrored-route status and copied it into every dimension | Reads route-specific semantic, visual, interaction and computed-style comparison evidence | Generator contains no status literal or uniform assignment |
| `generate-reports.mjs` | Wrote responsive MATCH values directly | Writes measured per-route, per-viewport pixel metrics and overflow observations | Evidence completeness validation |
| `validate-shared.mjs` | Treated absence of overflow as visual parity | Requires source, staging and difference images plus numeric pixel metrics | Visual metric and image guard |
| `validate-shared.mjs` | Checked four header strings and three footer strings | Ordered bidirectional inventories compare labels, order, destinations, duplicates, logos, CTA, newsletter and legal links | Semantic-array mutation tests |
| `validate-shared.mjs` | Checked URL containment anywhere in HTML | Compares ordered source and staging navigation arrays | Ordered navigation guard |

## Proof

- Capture session: `prompt-1-2-2026-07-30T12-47-25-264Z`
- Mirrored route records: 47
- Visual state metrics: 799
- Each route points to unique source, staging and difference evidence directories.
- The hardcoded-result detector rejects direct status assignments, ternary MATCH assignment, overflow-only visual checks, and short string-containment semantic checks.
