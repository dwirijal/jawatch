import { utils } from 'animejs';

/**
 * Premium Animation Presets for dwizzyWEEB
 * Centralized easing, durations, and motion patterns.
 */

export const ANIMATION_PRESETS = {
  // --- ENTRANCE ANIMATIONS ---
  
  // Smooth fade in and slide up for sections
  fadeInUp: {
    opacity: [0, 1],
    translateY: [30, 0],
    duration: 1000,
    easing: 'outExpo'
  },

  // Dramatic slide in from right (used in toasts/reviews)
  slideInRight: {
    opacity: [0, 1],
    translateX: [40, 0],
    duration: 800,
    easing: 'outElastic(1, .8)'
  },

  // --- INTERACTION ANIMATIONS ---

  // Premium card hover effect
  cardHover: {
    scale: 1.05,
    translateY: -12,
    duration: 400,
    easing: 'outElastic(1, .6)'
  },

  // Standard card settle (on mouse leave)
  cardSettle: {
    scale: 1,
    translateY: 0,
    duration: 300,
    easing: 'outQuad'
  },

  // --- LIST & STAGGER ANIMATIONS ---

  // Stagger entrance for grid items
  staggerEntrance: (delay = 80) => ({
    opacity: [0, 1],
    translateY: [20, 0],
    delay: utils.stagger(delay),
    duration: 800,
    easing: 'outExpo'
  }),

  // Text reveal animation (for hero titles)
  textReveal: {
    opacity: [0, 1],
    translateX: [-50, 0],
    delay: utils.stagger(100),
    duration: 1200,
    easing: 'outExpo'
  },

  // --- FEEDBACK ANIMATIONS ---

  // Pulse effect for active elements
  pulse: {
    scale: [1, 1.05, 1],
    duration: 1000,
    easing: 'easeInOutQuad',
    loop: true
  },
} as const;

/**
 * Easing constants for consistent feel across Framer Motion and CSS
 */
export const EASING = {
  premium: [0.16, 1, 0.3, 1], // Custom cubic-bezier for 'outExpo'
  elastic: [0.175, 0.885, 0.32, 1.275],
  smooth: [0.4, 0, 0.2, 1]
};
