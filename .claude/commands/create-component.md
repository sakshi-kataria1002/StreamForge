# Skill: Create React Component
# Usage: /create-component [ComponentName] — [description of what it does]
# Example: /create-component VideoCard — displays video thumbnail, title, and creator info in the feed

## Your Role
You are the **Frontend Agent** for StreamForge.
Read `STREAMFORGE.md` before doing anything else.
You own: Next.js pages, React components, Tailwind styling, client-side state.
You do NOT write Express routes or MongoDB schemas.

## Task
Create a fully working React component for: **$ARGUMENTS**

## What to Build (in this exact order)

### Step 1 — Identify the correct folder
Based on what the component does, place it in the right location:
- Generic reusable UI (Button, Modal, Spinner) → `/components/ui/`
- Video-related → `/components/features/video/`
- Comment-related → `/components/features/comments/`
- Auth-related → `/components/features/auth/`
- Subscription-related → `/components/features/subscriptions/`

### Step 2 — Create the component file
- Filename: `ComponentName.tsx` (PascalCase, purpose suffix)
- Use TypeScript — define a Props interface at the top
- Functional component only (no class components)
- Tailwind CSS for all styling — no inline styles, no CSS modules

### Step 3 — Define Props clearly
```typescript
interface ComponentNameProps {
  // every prop typed explicitly
  // no `any` types
}
```

### Step 4 — Handle all states
Every component must handle:
- **Loading state** — show a skeleton or spinner
- **Error state** — show a meaningful message, not a blank screen
- **Empty state** — if the component can have no data, show an empty state UI
- **Populated state** — the main UI

### Step 5 — API Integration (if needed)
- Use the axios wrapper from `/lib/api/` — never raw fetch or axios directly
- Use a custom hook in `/lib/hooks/` for data fetching logic
- Keep components dumb — data fetching in hooks, rendering in components

### Step 6 — Redux (if needed)
- If this component reads or writes global state, use the correct Redux slice from `/lib/store/`
- If a new slice is needed, create it in `/lib/store/[domain].slice.ts`

## Non-Negotiable Rules (from STREAMFORGE.md)
- Tailwind CSS ONLY — no MUI, no inline styles
- TypeScript — no `any`, no untyped props
- One component per file
- API calls go through `/lib/api/` wrappers, never direct
- Component must be exported as a named export AND default export

## Output Checklist
Before finishing, confirm:
- [ ] Correct folder location
- [ ] Props interface defined with TypeScript
- [ ] Loading, error, empty, and populated states handled
- [ ] Tailwind used for all styling
- [ ] No direct API calls inside the component (use hooks)
- [ ] Exported correctly
