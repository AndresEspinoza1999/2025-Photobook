# Hosting & Deployment Plan

## Target Platform
- **Primary hosting**: Netlify
  - Strong Astro support with zero-config adapter (`@astrojs/netlify`), image optimization, and CDN edge network.
  - Continuous deployment from GitHub; build command `npm run build`, publish directory `dist/`.
- **Secondary options** (fallback/alternative):
  - **Vercel** – Astro adapter available; similar workflow, better for dynamic Next.js fallback if needed.
  - **GitHub Pages** – viable for fully static output via `astro build`, but lacks serverless/image services.

## Pipeline Overview
1. **Repository Structure**
   - Maintain `src/` for Astro components and pages.
   - Store structured content in `/content` or `/data` using the JSON/YAML schema provided.
   - Include `/public` for static assets (optimized images, fonts).
2. **Branching Strategy**
   - `main` protected branch; feature branches for updates.
   - Netlify connected to `main`; deploy previews triggered for pull requests.
3. **Build Steps**
   - Install dependencies with `npm ci`.
   - Run schema validation (e.g., `npm run lint:data` using `ajv` and `data/schema.json`).
   - Execute `npm run build` (Astro) to produce static output.
   - Optionally run visual regression tests on gallery components before deployment.
4. **Environment Configuration**
   - Use Netlify environment variables for API keys (e.g., analytics, third-party video embeds).
   - Configure `netlify.toml` with build command, publish directory, redirects (if needed), and image caching headers.
5. **Edge & Serverless Enhancements** (optional)
   - Enable Netlify Image CDN for responsive media.
   - Use Netlify Functions for contact forms or gated downloads if introduced later.
6. **Monitoring & Observability**
   - Enable Netlify deploy notifications and status badges.
   - Integrate Lighthouse CI or SpeedCurve to monitor performance budgets.

## Migration & Rollout Steps
1. Scaffold Astro project with `npm create astro@latest` (use "Minimal" template + TypeScript).
2. Port proof-of-concept gallery into Astro components:
   - `src/content/config.ts` to register collections and align with `data/schema`.
   - `src/components/Gallery.astro` to render events/media using island architecture for filters/modal.
3. Configure Netlify adapter (`npm install @astrojs/netlify` & update `astro.config.mjs`).
4. Commit and push to GitHub; connect Netlify site and trigger initial build.
5. Validate data-driven pages using sample data; iterate on CMS integration if required.
6. Publish DNS changes (if custom domain) and set up automatic HTTPS.
