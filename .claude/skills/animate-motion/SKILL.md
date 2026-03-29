---
name: animate-motion
description: Add purposeful Framer Motion animations to Contracker components — page transitions, dashboard stagger reveals, traffic-light transitions, notification slide-ins.
user_invocable: true
---

# /animate — Framer Motion Animation Guide

You are an animation specialist for the Contracker project. When the user runs `/animate [target]`, add or improve Framer Motion animations on the specified component or page.

## Animation Philosophy

Animations in Contracker serve THREE purposes only:
1. **Orient** — Help users understand where they are (page transitions)
2. **Reveal** — Draw attention to important data (dashboard stagger, notification slide-in)
3. **Feedback** — Confirm an action happened (toast, button press)

If an animation doesn't serve one of these, don't add it.

## Animation Recipes

### Page Transition (already in app/(app)/layout.tsx)
```tsx
const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
}

<motion.div
  key={pathname}
  variants={pageVariants}
  initial="initial"
  animate="animate"
  exit="exit"
  transition={{ duration: 0.25, ease: 'easeOut' }}
>
  {children}
</motion.div>
```

### Dashboard Card Stagger
```tsx
const containerVariants = {
  animate: {
    transition: { staggerChildren: 0.05 },
  },
}

const itemVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
}

<motion.div variants={containerVariants} initial="initial" animate="animate">
  {cards.map((card) => (
    <motion.div key={card.id} variants={itemVariants}>
      <Card>...</Card>
    </motion.div>
  ))}
</motion.div>
```

### Traffic-Light Color Transition
```tsx
<motion.span
  className="h-2 w-2 rounded-full"
  animate={{ backgroundColor: STATUS_COLORS[riskColour] }}
  transition={{ duration: 0.3, ease: 'easeInOut' }}
/>
```

### Notification Slide-In
```tsx
const notificationVariants = {
  initial: { opacity: 0, x: 24, height: 0 },
  animate: { opacity: 1, x: 0, height: 'auto', transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { opacity: 0, x: -12, height: 0, transition: { duration: 0.15, ease: 'easeIn' } },
}

<AnimatePresence mode="popLayout">
  {notifications.map((n) => (
    <motion.div key={n.id} variants={notificationVariants} initial="initial" animate="animate" exit="exit" layout>
      ...
    </motion.div>
  ))}
</AnimatePresence>
```

### Count-Up Number (Dashboard Metrics)
```tsx
import { useMotionValue, useTransform, animate } from 'framer-motion'
import { useEffect } from 'react'

function AnimatedCounter({ value }: { value: number }) {
  const count = useMotionValue(0)
  const rounded = useTransform(count, (v) => Math.round(v))

  useEffect(() => {
    const controls = animate(count, value, { duration: 0.8, ease: 'easeOut' })
    return controls.stop
  }, [value, count])

  return <motion.span>{rounded}</motion.span>
}
```

## Reduced Motion Gate (MANDATORY)

Every animated component MUST respect `prefers-reduced-motion`:

```tsx
import { useReducedMotion } from 'framer-motion'

function AnimatedCard({ children }: { children: React.ReactNode }) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.25 }}
    >
      {children}
    </motion.div>
  )
}
```

## Timing Rules

| Element | Duration | Easing | Notes |
|---------|----------|--------|-------|
| Page transition | 250ms | easeOut | y: 8px shift |
| Card stagger | 50ms gap | easeOut | Per item delay |
| Badge color | 300ms | easeInOut | Background color only |
| Notification enter | 200ms | easeOut | x: 24px slide |
| Notification exit | 150ms | easeIn | Faster than enter |
| Count-up | 800ms | easeOut | Numbers only |
| Tooltip | 100ms | easeOut | Opacity only |

## Anti-Patterns (NEVER DO)

- No bounce or elastic easing — this is a procurement tool, not a game
- No scale transforms on data elements — disorienting for data-dense UI
- No infinite loops or pulsing indicators — static badges only
- No animation duration > 500ms — feels sluggish
- No animation on scroll — performance killer on data tables
- No x-axis page transitions — only y-axis (vertical flow)
- No animating layout properties (width, height) on large elements — use opacity + transform only

## Process

1. **Read** the target component
2. **Identify** which animation recipe applies
3. **Add** the animation with reduced-motion gate
4. **Verify** with `npm run type-check`
5. **Report** what was animated and why
