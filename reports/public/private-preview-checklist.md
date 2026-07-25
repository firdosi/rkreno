# Private preview checklist

## Before upload

- [ ] Owner approves a private preview window and access method.
- [ ] Preview hostname or hosts-file route is separate from production.
- [ ] Directory, service, port and Nginx server block are separate from ConvortAI.
- [ ] `DEPLOY_TARGET=vps-preview`; analytics disabled.
- [ ] Test recipient and preview Turnstile settings are ready privately.
- [ ] Production build, GitHub build, tests and dependency review pass.
- [ ] Release archive contains no backups, SQL, XML, `.env`, credentials or customer data.

## Server configuration

- [ ] Basic Authentication or equivalent blocks public access.
- [ ] `X-Robots-Tag: noindex, nofollow, noarchive` appears on HTML, assets and errors.
- [ ] Preview `robots.txt` disallows `/`.
- [ ] `/api/` proxies only to the isolated test form service.
- [ ] Request body size and allowed origin are restricted.
- [ ] Nginx configuration passes `nginx -t`.
- [ ] Existing WordPress and ConvortAI configurations are unchanged.

## Validation

- [ ] All 42 retained routes and custom 404 load.
- [ ] Navigation works at desktop and mobile widths with no horizontal overflow.
- [ ] No browser console errors or broken images.
- [ ] Keyboard navigation, focus, labels and announcements pass.
- [ ] Canonicals target the future production URLs, while preview robots prevent indexing.
- [ ] Google tag, GTM, Meta Pixel and other analytics do not load.
- [ ] Form failures send no mail and emit no lead event.
- [ ] One accepted test sends one test email and one internal success event only.
- [ ] Telephone and WhatsApp fallback remains visible.
- [ ] Owner reviews privately and records approval.

## Close or preserve

- [ ] Keep the previous preview release for rollback.
- [ ] Rotate/remove temporary credentials when preview access ends.
- [ ] Do not switch DNS, production virtual host or WordPress.
