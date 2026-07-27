# Prompt 4.1 Provider Values Checklist

## Non-secret values

- Approved preview hostname
- Approved production hostname: `rkrenosolution.com`
- SMTP host, port and security mode
- Form recipient email
- Verified sender email
- Turnstile expected preview and production hostnames
- GA4 property confirmation
- Search Console property confirmation
- Future VPS directory
- Enquiry service loopback port
- Preferred authentication method

## Secret values

- VPS login credential
- SMTP username when sensitive and SMTP password
- Turnstile preview and production secrets
- Basic-auth password
- Cloudflare/API tokens, only if later required

Do not commit secrets to Git, place them in public reports, paste them into source code, or provide them before an explicitly authorized remote step. Store them only in the server environment or an approved secret store.
