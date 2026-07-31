import type { Variants, Transition } from 'motion/react';

/**
 * Shared motion vocabulary for the app.
 *
 * Import these instead of hand-rolling cubic-beziers or spring configs so every
 * animation eases and paces the same way — that consistency is what reads as
 * "smooth" rather than a pile of one-off effects.
 */

// Easing curves as cubic-bezier control points.
export const ease = {
  // Decisive settle — the default for entrances and layout moves.
  out: [0.22, 1, 0.36, 1] as [number, number, number, number],
  // Symmetric in-out for reversible state changes.
  inOut: [0.65, 0, 0.35, 1] as [number, number, number, number],
  // Slight overshoot for tactile, playful moments (toggles, pop-ins).
  overshoot: [0.34, 1.4, 0.64, 1] as [number, number, number, number],
};

// Durations in seconds. Keep motion quick — the base is a third of a second.
export const duration = {
  fast: 0.18,
  base: 0.32,
  slow: 0.5,
};

// A soft spring for hover lifts and press feedback: physical, never linear.
export const softSpring: Transition = {
  type: 'spring',
  stiffness: 320,
  damping: 26,
  mass: 0.7,
};

// Fade + rise. Works on its own or as a child of `staggerContainer`.
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.base, ease: ease.out },
  },
};

// Wrap a list whose children use `fadeUp` to make them arrive in sequence.
export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.05, delayChildren: 0.04 },
  },
};

// Entrance for a routed view swapping into place.
export const pageIn: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.base, ease: ease.out },
  },
};
