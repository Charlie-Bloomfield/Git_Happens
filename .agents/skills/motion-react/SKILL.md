---
name: motion-react
description: Add purposeful animation with Motion for React in this Next.js frontend when interaction or visual feedback benefits from motion. Do not add animation to unrelated UI work.
---

# Motion for React

Use the current Motion for React docs for the chosen animation API. Install `motion` in `frontend/` when an actual animation is needed. In a client component, import from `motion/react`; for supported server component usage, consult the docs for `motion/react-client`. Keep animation code in the smallest practical component rather than making an entire page client-only for one effect.

Make the motion communicate state or reinforce hierarchy. Avoid distracting loops and layout shifts. Respect the user's reduced-motion setting with `MotionConfig reducedMotion="user"` or `useReducedMotion`, and ensure content remains usable without animation. Verify behavior in the browser, then run `npm run build` and `npm run typecheck` from `frontend/`.

Official sources: https://motion.dev/docs/react-installation and https://motion.dev/docs/react-motion-config
