# Prompt 1.2 style-conflict removals

| File / selector or logic | Reason | Replacement | Routes | Regression |
|---|---|---|---|---|
| `BaseLayout.astro` conditional exact/generic chrome | Two shell implementations produced route-dependent shared chrome | One `Header.astro` and one `Footer.astro` | All 48 | Prompt 1.1 retained |
| `ExactHomeHeader.astro` | Duplicated and source-inaccurate menu hierarchy | Native `rk-header` system | Homepage | Prompt 1.1 retained |
| `ExactHomeFooter.astro` | Navy demo footer contradicted the white WordPress footer | Native `rk-footer` system | Homepage | Prompt 1.1 retained |
| Generic `.site-header`, `.site-footer`, `.contact-actions` | Legacy rules remain isolated and cannot target the new source-scoped classes | `.rk-header`, `.rk-footer`, `.rk-contact-actions` | All 48 | No selector collision |
| Competing design variables | Old variables varied between route bundles | Source-derived aliases in `tokens.css` loaded last | All 48 | Token validation |
| HTML `details` navigation logic | Could not reproduce source drawer, focus or Escape behavior | `shared-chrome.ts` | All 48 | Interaction validation |

Page-specific selectors were not deleted because Prompt 1.3 body work is explicitly out of scope.
