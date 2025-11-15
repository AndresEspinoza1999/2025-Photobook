# 2025 Photobook – Architecture Notes

This repository captures early planning artifacts for the 2025 Photobook web experience.

## Contents
- `docs/static-site-evaluation.md` – comparison of static-site generators (Next.js, Astro, Eleventy) versus a dynamic web app, culminating in a recommendation.
- `docs/deployment-plan.md` – proposed hosting pipeline centered on Netlify with fallback options.
- `data/schema.json` & `data/schema.yaml` – JSON Schema definitions governing events, media, and participants.
- `data/sample-data.json` – sample data set that conforms to the schema for rapid prototyping.
- `poc/` – lightweight HTML/CSS/JS proof-of-concept that renders the sample data in a gallery layout.

## Getting Started with the Proof of Concept
1. From the repository root, start a static file server (e.g., `npx serve poc` or `python -m http.server --directory poc`).
2. Visit `http://localhost:3000` (or the port reported by your server).
3. Interact with the filters and modal to verify data is sourced from `data/sample-data.json`.

## Next Steps
- Scaffold an Astro project and migrate the proof-of-concept into Astro islands/components.
- Wire schema validation into CI using a tool such as `ajv`.
- Expand the schema as real event/media requirements surface.
