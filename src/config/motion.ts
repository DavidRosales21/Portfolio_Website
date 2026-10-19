/**
 * MOTION PERSONALITY — Direction A "Blueprint" (design.md): balanced, precise, never decorative.
 * Short eases, small distances; the signature movement is the diagram and the guides (scripts/blueprint.ts).
 */
export const motion = {
  smoothScroll: true,       // Lenis (always disabled for prefers-reduced-motion)
  scrollDuration: 1.0,      // Lenis inertia (seconds)
  revealDistance: 14,       // px elements travel when revealing
  revealDuration: 0.6,      // seconds
  revealEase: 'power2.out', // any GSAP ease
  revealStart: 'top 88%',   // ScrollTrigger start
  stagger: 0.06,            // seconds between children of [data-stagger]
};
