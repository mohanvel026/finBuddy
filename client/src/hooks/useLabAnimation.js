import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useAnimatedValue — Spring-physics number interpolation hook
 *
 * Returns a smoothed value that follows `target` with spring easing.
 * This makes all SVG paths and chart positions animate smoothly rather
 * than snapping instantly when sliders move.
 *
 * @param {number} target  - The target value to animate toward
 * @param {object} options
 *   @param {number} stiffness  - Spring stiffness (default: 120)
 *   @param {number} damping    - Spring damping (default: 18)
 *   @param {number} mass       - Virtual mass (default: 1)
 *   @param {number} precision  - Stop threshold (default: 0.01)
 */
export const useAnimatedValue = (target, {
  stiffness = 120,
  damping = 18,
  mass = 1,
  precision = 0.01
} = {}) => {
  const [value, setValue] = useState(target);
  const stateRef = useRef({ position: target, velocity: 0 });
  const rafRef = useRef(null);
  const targetRef = useRef(target);

  useEffect(() => {
    targetRef.current = target;
  }, [target]);

  useEffect(() => {
    const animate = () => {
      const state = stateRef.current;
      const t = targetRef.current;

      const force = -stiffness * (state.position - t);
      const damperForce = -damping * state.velocity;
      const acceleration = (force + damperForce) / mass;

      state.velocity += acceleration * (1 / 60);
      state.position += state.velocity * (1 / 60);

      const settled =
        Math.abs(state.position - t) < precision &&
        Math.abs(state.velocity) < precision;

      if (settled) {
        state.position = t;
        state.velocity = 0;
        setValue(t);
        rafRef.current = null;
        return;
      }

      setValue(state.position);
      rafRef.current = requestAnimationFrame(animate);
    };

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, stiffness, damping, mass, precision]);

  return value;
};

/**
 * useLessonEntrance — Returns a stable CSS class for lesson-change animations
 *
 * Applies `lab-visual-enter` whenever the lessonId changes. The class
 * auto-removes after the animation completes so it can fire again.
 *
 * @param {string} lessonId - Current lesson identifier
 * @returns {string}          CSS class string to spread onto the wrapper div
 */
export const useLessonEntrance = (lessonId) => {
  const [animClass, setAnimClass] = useState('lab-visual-enter');
  const prevId = useRef(null);

  useEffect(() => {
    if (prevId.current !== null && prevId.current !== lessonId) {
      setAnimClass('');
      const t = requestAnimationFrame(() => {
        setAnimClass('lab-visual-enter');
      });
      return () => cancelAnimationFrame(t);
    }
    prevId.current = lessonId;
  }, [lessonId]);

  return animClass;
};

/**
 * useGoalFlash — Fires a brief CSS glow class when goal is first achieved
 *
 * @param {boolean} isGoalSatisfied
 * @returns {boolean} isFlashing
 */
export const useGoalFlash = (isGoalSatisfied) => {
  const [isFlashing, setIsFlashing] = useState(false);
  const prevSatisfied = useRef(false);

  useEffect(() => {
    if (isGoalSatisfied && !prevSatisfied.current) {
      setIsFlashing(true);
      const timer = setTimeout(() => setIsFlashing(false), 1200);
      prevSatisfied.current = true;
      return () => clearTimeout(timer);
    }
    if (!isGoalSatisfied) {
      prevSatisfied.current = false;
    }
  }, [isGoalSatisfied]);

  return isFlashing;
};

/**
 * useParticles — Generates ambient floating particle positions
 * Returns a stable array of {x, y, size, duration, delay} objects
 * for rendering ambient SVG/DOM particles behind a visualizer.
 *
 * @param {number} count     - Number of particles
 * @param {object} bounds    - { width, height } of the container
 */
export const useParticles = (count = 6, bounds = { width: 220, height: 120 }) => {
  const particles = useRef([]);

  if (particles.current.length !== count) {
    particles.current = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: 20 + Math.random() * (bounds.width - 40),
      y: 20 + Math.random() * (bounds.height - 40),
      size: 1 + Math.random() * 1.5,
      duration: 2.5 + Math.random() * 3,
      delay: Math.random() * 3,
      opacity: 0.08 + Math.random() * 0.18,
    }));
  }

  return particles.current;
};
