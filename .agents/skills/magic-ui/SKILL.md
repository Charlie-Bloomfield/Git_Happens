---
name: magic-ui
description: Choose and integrate Magic UI visual components in this Next.js frontend when the user requests Magic UI or a fitting visual effect. Do not use for routine layout or form work.
---

# Magic UI

Use Magic UI for a specific visual component that improves the requested interface. Review the component's current documentation and source before installing it; do not add a component solely because it is available.

This repository's app lives in `frontend/` and currently uses plain CSS, without Tailwind or shadcn configuration. Magic UI uses the shadcn registry workflow. If the chosen component needs Tailwind or shadcn, set up those prerequisites in `frontend/` while preserving the existing styling. Install only the selected component with `npx shadcn@latest add @magicui/<component>` from `frontend/`, then inspect the generated code and dependencies.

Adapt colors, typography, and sizing to the Git Exposed design. Check mobile layout, keyboard behavior, and reduced-motion behavior for animated effects. Run `npm run build` and `npm run typecheck` after integration.

Official source: https://magicui.design/docs/installation
