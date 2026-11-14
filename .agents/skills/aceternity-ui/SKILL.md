---
name: aceternity-ui
description: Find and integrate Aceternity UI components into this Next.js frontend when the user requests Aceternity UI or a fitting interactive section. Do not use for routine interface changes.
---

# Aceternity UI

Choose a component for a concrete interface need, then read its current component page and installation instructions. Prefer free registry components unless the user has supplied access to a Pro component.

The app is in `frontend/` and currently has no Tailwind setup. Aceternity's current registry workflow expects React 19 and Tailwind CSS v4. Check the chosen component's requirements before changing the app's styling setup. For registry installation, initialize shadcn in `frontend/` if needed, add `"@aceternity": "https://ui.aceternity.com/registry/{name}.json"` to `frontend/components.json`, then install only the selected item with `npx shadcn@latest add @aceternity/<component>` from `frontend/`.

Inspect installed source and dependencies, especially Motion imports. Keep paid access tokens out of source control. Match the existing Git Exposed styling and verify responsive layout, keyboard access, reduced motion, build, and typecheck.

Official source: https://ui.aceternity.com/installation
