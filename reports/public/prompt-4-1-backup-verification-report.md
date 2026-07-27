# Prompt 4.1 Backup Verification

The ignored local backup directory was read only. SHA-256 values and filenames are stored only under `.audit-cache/prompt-4-1/backup-checksums/`.

| File category | Present | Size (bytes) | Checksum local | Integrity/readability | Sensitive content | Safe for rollback use | Fresh backup required |
|---|---:|---:|---:|---|---|---|---:|
| Full WordPress archive | YES | 290095496 | YES | PASS | YES | CONDITIONAL — restore test required | YES |
| SQL/database backup | YES | 4954079 | YES | PASS | YES | CONDITIONAL — database restore test required | YES |
| WordPress XML export | YES | 13587024 | YES | PASS | POSSIBLE | YES — supplementary import source | YES |
| Elementor export | YES | 642047 | YES | PASS | POSSIBLE | YES — supplementary layout source | YES |
| AIOSEO exports | YES | 890775 | YES | PASS | POSSIBLE | YES — supplementary SEO source | YES |
| wp-config.php backup | YES | 290095496 | YES | PASS | YES | CONDITIONAL — embedded in full archive | YES |
| Uploads/media backup | YES | 290095496 | YES | PASS | POSSIBLE | CONDITIONAL — embedded in full archive | YES |
| Redirect configuration evidence | YES | 290095496 | YES | PASS | POSSIBLE | REVIEW/EXPORT AGAIN BEFORE CUTOVER | YES |
| Contact-form configuration evidence | YES | 290095496 | YES | PASS | POSSIBLE | REVIEW/EXPORT AGAIN BEFORE CUTOVER | YES |

The inventory is useful rollback evidence but does not replace the mandatory fresh, verified pre-cutover file/database backup in Prompt 4.3. No backup content or checksum was committed.
