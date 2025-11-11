# Static Site vs Dynamic App Evaluation

## Project Context
- **Project**: 2025 Photobook – interactive photo gallery highlighting events, participants, and multimedia artifacts.
- **Core needs**:
  - Media-heavy galleries with event/participant metadata.
  - Editorial updates leading up to 2025 showcase; content authors are comfortable editing structured content.
  - Desire for strong performance, SEO, and ability to pre-render static pages.
  - Occasional interactive features (filters, lightboxes) but no personalized or real-time data.

## Evaluation Criteria
1. **Authoring Workflow & Data Sources** – ease of ingesting JSON/YAML content, CMS integrations.
2. **Performance & Rendering** – static generation, incremental builds, client hydration costs.
3. **Component Model & DX** – flexibility for React/Vue/Svelte components, TypeScript support.
4. **Learning Curve & Team Fit** – required skills, documentation, community.
5. **Hosting & CI Compatibility** – deploy targets (Netlify, Vercel, GitHub Pages), build times.
6. **Extensibility** – plugin ecosystem, image optimization, MDX support, data pipelines.

## Candidates
### Next.js (Static Export)
- **Strengths**
  - Mature React ecosystem; first-party image optimization, routing, API routes.
  - Hybrid rendering (SSG, ISR, SSR) allows future dynamic pivot.
  - Rich community, Vercel-native deployment.
- **Weaknesses**
  - Static export requires `next export`; some features (image component, middleware) degrade when fully static.
  - Build times can grow with large galleries unless incremental static regeneration is used (requires server).
  - Client bundle size higher than more lightweight static tools.
- **Fit**: Strong if team prefers React and may later need dynamic features. Slightly heavier for a mostly static gallery.

### Astro
- **Strengths**
  - Island architecture: ships zero JS by default; partial hydration for interactive components (e.g., gallery filters).
  - Flexible component support (React, Svelte, Vue, Solid) and Markdown/MDX integration for editorial content.
  - Content collections with built-in schema validation; image optimization integrations.
  - Fast builds, good for media-heavy static sites.
- **Weaknesses**
  - Younger ecosystem vs Next; fewer enterprise-level plugins.
  - Learning curve for Astro-specific conventions, though shallow for web developers.
- **Fit**: Excellent for mostly static experience with pockets of interactivity and structured content.

### Eleventy (11ty)
- **Strengths**
  - Simplicity; template-agnostic (Nunjucks, Liquid, etc.).
  - Very fast static builds, minimal runtime JS.
  - Low barrier for editors comfortable with Markdown + data files.
- **Weaknesses**
  - No built-in component islands; interactive features require manual bundling setup.
  - Less opinionated tooling; more configuration to manage asset pipeline and complex data relationships.
  - Smaller ecosystem for rich media galleries compared to React-based solutions.
- **Fit**: Great for pure static content. Requires additional tooling for interactive galleries/lightboxes.

### Dynamic Web App (e.g., Next.js SSR or custom Node/Express)
- **Strengths**
  - Real-time data, user personalization, server-side APIs.
  - Easier integration with databases or authenticated features.
- **Weaknesses**
  - More infrastructure: runtime hosting, scaling, security.
  - Higher cost/complexity; unnecessary if content is editorial and infrequently updated.
  - Performance overhead vs pre-rendered static pages.
- **Fit**: Overkill for current requirements unless future roadmap mandates real-time or authenticated experiences.

## Recommendation
- **Primary Choice**: **Astro**
  - Balances static performance with interactive capability (islands) needed for galleries.
  - Allows reusing React components if desired, easing developer adoption.
  - Content collections align with structured JSON/YAML data; schema validation ensures data quality.
  - Deploys seamlessly to Netlify or Vercel with fast builds.
- **Secondary Option**: Next.js with ISR if long-term dynamic pivot expected. Eleventy if team wants minimal tooling and manual handling of interactivity.

## Next Steps
1. Prototype gallery using Astro components fed from the JSON/YAML schema defined in this repo.
2. Evaluate CMS integration (e.g., Sanity, Contentful) or continue with Git-based data authoring.
3. Align hosting (see deployment plan) with Astro’s build pipeline.
