# RK Reno VPS production deployment

This runbook prepares RK Reno independently of ConvortAI. It uses the dedicated
`/var/www/rkreno` tree, the `rkreno` system user, a separate systemd service and
Nginx virtual hosts without `default_server`.

## Current readiness

- Google Site Kit currently loads Google tag `GT-T944JBVZ` on WordPress.
- No `GTM-*` container, Meta Pixel, or Search Console HTML verification token was
  visible in the production homepage source on 23 July 2026.
- The Astro implementation supports all four integrations through public build
  variables. Analytics is emitted only when `DEPLOY_TARGET=vps` and
  `PUBLIC_ANALYTICS_ENABLED=true`.
- The form API and deployment workflow are prepared but cannot be activated until
  the owner supplies the VPS, SMTP and Turnstile values listed below.

## Owner inputs required

### VPS and preview

- VPS IPv4 address and optional IPv6 address.
- SSH hostname, port and a restricted deployment username.
- Ed25519 private key for the deployment user and a verified `known_hosts` line.
- A temporary HTTPS hostname that resolves to the VPS, or approval to test with a
  local hosts-file override plus a certificate already valid for the test hostname.
- Confirmation that Node.js 22+, Nginx and Certbot are installed.

### Secure form

- Cloudflare Turnstile site key and secret key. Add the preview hostname,
  `rkrenosolution.com`, and `www.rkrenosolution.com` to the widget.
- SMTP host, port, username and password/API key. For Gmail, use an app password,
  never the normal account password.
- Approved sender address. Enquiries are delivered to
  `rkrenosolution@gmail.com`.

### Measurement

- Confirm that Google tag `GT-T944JBVZ` should remain attached to the same GA4
  property.
- GTM container ID (`GTM-...`), if a container is wanted.
- Meta Pixel numeric ID.
- Search Console HTML verification token, unless the domain property is already
  verified through DNS.

Do not configure a second GA4 page-view tag inside GTM while the direct Google tag
is enabled, or page views will be duplicated.

## One-time VPS installation

1. Create the isolated service account and directories:

   ```bash
   sudo useradd --system --home /var/www/rkreno --shell /usr/sbin/nologin rkreno
   sudo install -d -o rkreno -g www-data -m 0750 /var/www/rkreno/releases
   sudo install -d -o root -g root -m 0700 /etc/rkreno
   ```

2. Install `ops/env/form-api.env.example` as `/etc/rkreno/form-api.env`, replace
   every placeholder, then secure it:

   ```bash
   sudo chown root:root /etc/rkreno/form-api.env
   sudo chmod 600 /etc/rkreno/form-api.env
   ```

3. Install the service:

   ```bash
   sudo cp ops/systemd/rkreno-form-api.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable rkreno-form-api
   ```

4. Install the Nginx files:

   ```bash
   sudo cp ops/nginx/rkreno-http.conf /etc/nginx/conf.d/
   sudo cp ops/nginx/snippets/security-headers.conf /etc/nginx/snippets/rkreno-security-headers.conf
   sudo cp ops/nginx/snippets/site-common.conf /etc/nginx/snippets/rkreno-site-common.conf
   sudo cp ops/nginx/redirects.conf /etc/nginx/snippets/rkreno-redirects.conf
   ```

5. Replace `__PREVIEW_HOST__` in `rkreno-preview.conf.template`, save the result as
   `/etc/nginx/sites-available/rkreno-preview.conf`, issue its certificate with
   Certbot, enable only that virtual host, and run `sudo nginx -t` before reload.
   Do not enable `rkreno-production.conf` yet.

6. Give the deployment user write access only to `/var/www/rkreno` and passwordless
   sudo access only for `systemctl restart rkreno-form-api`.

## GitHub configuration

Create the `rkreno-vps` environment. Add these encrypted secrets:

- `RKRENO_VPS_HOST`
- `RKRENO_VPS_PORT`
- `RKRENO_VPS_USER`
- `RKRENO_VPS_SSH_KEY`
- `RKRENO_VPS_KNOWN_HOSTS`

Add these repository or environment variables:

- `RKRENO_VPS_DEPLOY_ENABLED=true`
- `RKRENO_DEPLOY_TARGET=vps-preview`
- `RKRENO_TEST_ORIGIN=https://temporary-hostname`
- `PUBLIC_TURNSTILE_SITE_KEY`
- `PUBLIC_ANALYTICS_ENABLED=false`
- `PUBLIC_GOOGLE_TAG_ID=GT-T944JBVZ`
- `PUBLIC_GTM_ID` when supplied
- `PUBLIC_META_PIXEL_ID` when supplied
- `PUBLIC_GOOGLE_SITE_VERIFICATION` when supplied

After these values exist, every push to `main` builds, validates, packages only
`dist/` and the form service, creates a release, atomically switches the `current`
symlink, restarts the form API and tests all 131 routes.

## Preview verification

The preview build and Nginx host both block indexing. Verify:

```bash
curl -I https://temporary-hostname/
curl https://temporary-hostname/robots.txt
curl https://temporary-hostname/sitemap.xml
curl https://temporary-hostname/api/health
```

Run `npm run test:routes -- https://temporary-hostname`. Use a Turnstile testing
widget and testing secret for the first form test, then replace both with production
keys and send one owner-approved live enquiry. Confirm delivery, reply-to, rate
limits, success/error messages and analytics events.

## Final cutover

1. Set `RKRENO_DEPLOY_TARGET=vps`, `PUBLIC_ANALYTICS_ENABLED=true`, and supply the
   approved analytics variables.
2. Manually dispatch the VPS workflow with target `vps`.
3. Enable `ops/nginx/rkreno-production.conf`, obtain a certificate covering apex
   and `www`, run `nginx -t`, then reload Nginx.
4. Test through a hosts-file override before DNS:

   ```text
   VPS_IPV4 rkrenosolution.com www.rkrenosolution.com
   ```

5. Re-run route, form, analytics, sitemap, robots, canonical, SSL and security
   header checks.
6. Only after approval, update DNS.

Required final DNS records:

```text
A      @      VPS_IPV4       TTL 300
CNAME  www    rkrenosolution.com.  TTL 300
AAAA   @      VPS_IPV6       TTL 300   # only if IPv6 is configured and tested
```

Remove any old conflicting apex `A`/`AAAA` and `www` records during cutover. Exact
record values cannot be finalized until the owner provides the VPS IP addresses.

## Rollback

List releases and select the last known-good commit SHA:

```bash
find /var/www/rkreno/releases -mindepth 1 -maxdepth 1 -type d -printf '%f\n'
sudo -u rkreno bash /path/to/rollback-release.sh PREVIOUS_40_CHARACTER_SHA
```

The rollback script atomically repoints `/var/www/rkreno/current`, restarts the
form API and verifies its local health endpoint. If DNS has already changed and the
whole Astro deployment must be abandoned, restore the prior DNS records and leave
the previous WordPress server untouched until DNS propagation is complete.
