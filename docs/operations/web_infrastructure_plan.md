# Web Infrastructure Plan

## Domain Registration and DNS
- **Domain choice:** The production domain is [`sc9photobook2025.com`](http://sc9photobook2025.com/).
- **Registrar account:** Use a registrar that supports programmatic DNS management (e.g., Cloudflare, Google Domains, Namecheap).
- **Registration steps:**
  1. Confirm the domain is registered under the team account, with auto-renewal enabled and the domain locked against transfers.
  2. Ensure WHOIS contact details and payment information stay current so renewals are not blocked.
- **DNS configuration for GitHub Pages:**
  - Keep registrar name servers in place; GitHub Pages works with registrar-hosted DNS.
  - For the apex domain, create four `A` records pointing to GitHub Pages: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, and `185.199.111.153`.
  - If `www.sc9photobook2025.com` should redirect to the apex, add a `CNAME` record pointing to `<github-username>.github.io` (replace with the organization/user that owns this repository).
  - Add a `_github-pages-challenge-<org>` TXT record if GitHub requests verification for the custom domain.
  - Maintain TXT records for SPF/DKIM/DMARC if email sending is required.
  - Document TTL values, and validate propagation with `dig` or the registrar's DNS tools.

## Hosting Pipeline
- **Hosting provider:** Serve the site with GitHub Pages so every merge to `main` publishes the latest build.
- **Repository integration:**
  - Enable GitHub Pages under **Settings → Pages**, selecting the `main` branch (or a dedicated `pages` branch) and the `/` root.
  - Commit a `CNAME` file containing `sc9photobook2025.com` at the repository root so GitHub Pages remembers the custom domain.
- **Deployment strategy:**
  - For static content, let GitHub Pages build directly from the branch.
    - The repository root contains `index.html` plus the `assets/` directory for styles and scripts, so no build step is required.
  - For generated sites (e.g., static site generators), configure a GitHub Actions workflow that runs the build and publishes the output to the Pages artifact.
  - Use branch protection on `main` and require pull-request reviews to avoid unvetted deployments.
- **Build automation:**
  - Define the build steps in `.github/workflows/pages.yml` (install dependencies, run tests, build static output, upload artifact).
  - Store tokens or secrets (if required) in GitHub repository secrets; avoid hard-coding configuration.
  - Enable workflow-failure notifications (email/Slack) through GitHub notifications or custom webhooks.
- **Rollback plan:**
  - Use Git tags or release branches to bookmark stable states.
  - Re-run the GitHub Pages deploy workflow from an older commit to restore a previous version if necessary.

## HTTPS and CDN Caching
- **TLS certificates:**
  - After the custom domain is saved in the GitHub Pages settings, request GitHub's automated certificate (Let's Encrypt).
  - Monitor the certificate provisioning status and keep "Enforce HTTPS" enabled once available so visitors are redirected to `https://sc9photobook2025.com/`.
- **HSTS:** Once HTTPS is reliably enforced, add an HSTS header via a `_headers` file (for static-site generators) or by proxying through a CDN such as Cloudflare.
- **Caching:**
  - GitHub Pages serves content through its global CDN; ensure static assets are versioned with cache-busting file names.
  - If additional control is needed, front the site with Cloudflare or Fastly to manage custom cache rules and edge redirects.
- **Monitoring:**
  - Set up uptime monitoring and TLS expiration alerts (e.g., GitHub status page, StatusCake, UptimeRobot).
  - After DNS propagation completes, verify that [http://sc9photobook2025.com/](http://sc9photobook2025.com/) and `https://` resolve to the GitHub Pages site without warnings.

## Routine Operations
- **Monthly content refresh:**
  - Review homepage and featured galleries for outdated imagery or copy.
  - Check analytics to identify underperforming sections and plan updates.
  - Log changes in a content calendar.
- **Backups:**
  - Schedule automated backups of site assets and the Git repository (if self-hosted).
  - Store backups in redundant storage (cloud bucket with versioning enabled).
  - Test restore procedures quarterly.
- **Link checks:**
  - Run automated link checker (e.g., `npm run check:links` or an external service) monthly.
  - Track failures in an issue tracker and resolve promptly.

## Annual Reviews and Reminders
- **Hosting costs:** Audit hosting/CDN invoices annually; compare usage metrics against plan limits and adjust tiers if necessary.
- **Domain renewal:** Confirm domain auto-renewal is active and that payment details are current.
- **Reminder setup:**
  - Create calendar events (shared team calendar) for annual reviews of hosting costs and domain renewal.
  - Add notification reminders 30 days in advance and a follow-up 7 days before due dates.
- **Documentation review:** Update this plan annually based on infrastructure changes or new provider features.

## Change Management
- Track infrastructure changes in the repository using pull requests.
- Require approvals for modifications to DNS, deployment settings, or CDN rules.
- Maintain a changelog of infrastructure updates for auditing purposes.
