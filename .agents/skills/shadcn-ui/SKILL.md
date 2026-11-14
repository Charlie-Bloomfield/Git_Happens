---
name: shadcn-ui
description: Set up or add shadcn/ui components to this existing Next.js frontend when the user requests shadcn/ui or a component fits the requested UI work. Do not initialize it for unrelated changes.
---

# shadcn/ui

Work from `frontend/`, where the Next.js package and `@/*` alias live. This app currently uses plain CSS and has no Tailwind or `components.json`; follow the current **Existing Project** installation guidance before running `npx shadcn@latest init`. Inspect the proposed changes so setup does not replace the existing page styling or unrelated configuration.

Choose components for actual interface needs. Use the current component docs and `npx shadcn@latest add <component>`; inspect generated source and dependencies before adapting it. Components become project-owned code, so keep the design coherent with Git Happens and retain accessibility and keyboard behavior. For Magic UI or Aceternity registries, follow their dedicated skills after shadcn is configured.

Run `npm run build` and `npm run typecheck` from `frontend/` after adding components.

Official sources: https://ui.shadcn.com/docs/installation/next and https://ui.shadcn.com/docs/cli
