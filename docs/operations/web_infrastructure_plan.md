# Web Infrastructure Plan

## Domain Registration and DNS
- **Domain choice:** Select a primary domain that reflects the "2025 Photobook" brand.
- **Registrar account:** Use a registrar that supports programmatic DNS management (e.g., Cloudflare, Google Domains, Namecheap).
- **Registration steps:**
  1. Verify the domain is available and purchase it for a minimum of one year.
  2. Enable auto-renewal during checkout.
  3. Lock the domain to prevent unauthorized transfers.
- **DNS configuration:**
  - Delegate name servers to the hosting/CDN provider (e.g., Cloudflare) or configure registrar DNS records directly.
  - Create the following baseline records:
    - `A`/`AAAA` records pointing to the production web host or load balancer.
    - `CNAME` records for `www`, `cdn`, or other subdomains.
    - `TXT` record for domain verification and email sender policies (SPF, DKIM, DMARC).
  - Document TTL values and propagation checks.

## Hosting Pipeline
- **Repository integration:** Connect the Git repository to the hosting provider (e.g., Netlify, Vercel, AWS Amplify).
- **Deployment strategy:**
  - Prefer Git-based continuous deployment from the `main` branch.
  - Configure preview deployments for pull requests when supported.
- **Build automation:**
  - Define build commands in provider settings (e.g., `npm install && npm run build`).
  - Store environment variables and secrets via provider dashboard or secrets manager.
  - Enable build notifications (email/Slack) for failures.
- **Rollback plan:** Maintain previous build artifacts or deploy history to enable single-click rollback.

## HTTPS and CDN Caching
- **TLS certificates:**
  - Use the hosting provider's automatic certificate management (Let's Encrypt or equivalent).
  - Enforce HTTPS redirects at the CDN/edge.
- **HSTS:** Enable HTTP Strict Transport Security (HSTS) with a max-age of at least 6 months once HTTPS is confirmed.
- **CDN caching:**
  - Configure caching rules for static assets (images, CSS, JS) with long max-age and cache-busting via file hashes.
  - Set appropriate cache-control headers for HTML (shorter TTL, e.g., 5 minutes) to allow quick content updates.
  - Enable image optimization or WebP/AVIF variants if available.
- **Monitoring:**
  - Set up uptime monitoring and TLS expiration alerts through the provider or third-party services.
  - After DNS propagation completes, verify that [http://sc9photobook2025.com/](http://sc9photobook2025.com/) loads the latest build and note the expected HTTPS redirect once TLS is active.

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
