# RK Reno Solution — static Astro migration

This repository contains the static Astro replacement for the existing RK Reno Solution WordPress website. The current production website is not modified by this project.

## Local development

Requirements: Node.js 22 or later.

```powershell
npm install
npm run dev
```

The live-site audit is repeatable and reads only public pages plus the local read-only backup exports:

```powershell
npm run audit
```

## Builds

Production build (root path and production canonical URLs):

```powershell
npm run build
```

GitHub Pages staging build (`/rkreno/`, noindex and staging banner):

```powershell
$env:DEPLOY_TARGET='github'
npm run build
Remove-Item Env:DEPLOY_TARGET
```

GitHub Actions deploys `main` to `https://firdosi.github.io/rkreno/`.

## Content and SEO

Public page content and metadata are stored in `src/data/site-pages.json`. The migration preserves production URL paths, titles, descriptions, canonical URLs, headings, public images and JSON-LD. Reusable UI is in `src/components`; shared presentation is in `src/styles/global.css`.

Run `npm run audit` to refresh the URL inventory and public comparison reports. Review generated changes before committing because the live WordPress website may change.

## Secure contact form

Production uses a dedicated VPS form API with server-side Cloudflare Turnstile
validation, a honeypot, strict field validation, request-size limits and
application plus Nginx rate limiting. SMTP and Turnstile secrets live only in
`/etc/rkreno/form-api.env`; GitHub contains placeholders only.

## VPS deployment

The isolated release directory, Nginx configuration, systemd service, GitHub
Actions workflow, route tests and rollback procedure are documented in
[`docs/production-deployment.md`](docs/production-deployment.md).

## Private backup safety

`wp-old-site-backup/`, SQL, archives, WordPress XML, environment files and WordPress configuration are excluded from Git. Never stage, commit, upload, rename or modify the private backup folder. It is an audit input only.
