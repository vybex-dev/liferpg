"use client";

import { useEffect, useRef } from "react";

const INTERACTIVE_SELECTOR =
  'a, button, [role="button"], input, textarea, select, summary, label, [tabindex]:not([tabindex="-1"])';

/**
 * Neon dot-and-ring cursor replacement.
 *
 * A small solid dot tracks the pointer 1:1; a larger, blurred glow
 * ring trails behind it with spring-like easing, widening and
 * shifting color whenever the pointer is over anything interactive.
 * This is purely cosmetic chrome layered on top of the OS cursor
 * position — it never intercepts events (pointer-events: none) and
 * never changes what's clickable.
 *
 * The dot/ring elements are always rendered (just invisible via
 * opacity until the first mousemove) so their refs are guaranteed
 * to exist by the time the effect runs. Gating the elements
 * themselves behind a "should we even do this?" state — rather
 * than gating just the *behavior* inside the effect — was the
 * previous bug: on mount the state was still false, the elements
 * hadn't rendered yet, refs were null, the effect returned early
 * before attaching anything, and the native cursor had already
 * been hidden via CSS. Net result: no cursor, custom or native.
 *
 * Only activates when:
 *  - the device has a fine pointer (mouse/trackpad) — touch devices
 *    keep their native behavior entirely, since there's no hover
 *    concept to visualize and a synthetic cursor would just be a
 *    stray dot stuck at the last tap location.
 *  - JS actually runs — `cursor: none` is applied via a class this
 *    component adds itself, so a no-JS visitor keeps the normal
 *    system cursor rather than losing it outright.
 *
 * Reduced motion: the ring still follows (position is information,
 * not decoration) but the easing snaps directly to the target
 * instead of trailing.
 */
export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const isFinePointer = window.matchMedia("(pointer: fine)").matches;
    if (!isFinePointer) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    document.body.classList.add("has-custom-cursor");

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;
    let hovering = false;
    let visible = false;

    function showCursor() {
      if (visible) return;
      visible = true;
      dot!.style.opacity = "1";
      ring!.style.opacity = "1";
    }

    function handleMouseMove(event: MouseEvent) {
      mouseX = event.clientX;
      mouseY = event.clientY;
      showCursor();
      dot!.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;

      const target = event.target as Element | null;
      const isInteractive = !!target?.closest(INTERACTIVE_SELECTOR);
      if (isInteractive !== hovering) {
        hovering = isInteractive;
        ring!.dataset.hover = String(hovering);
      }
    }

    function handleMouseLeave() {
      visible = false;
      dot!.style.opacity = "0";
      ring!.style.opacity = "0";
    }

    function handleMouseDown() {
      ring!.dataset.press = "true";
    }
    function handleMouseUp() {
      ring!.dataset.press = "false";
    }

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);

    let rafId = 0;
    function tick() {
      // Ease the glow ring toward the raw pointer position so it
      // reads as a trailing light rather than a rigidly-attached
      // outline. Reduced motion skips the lag entirely.
      const ease = reduceMotion ? 1 : 0.18;
      ringX += (mouseX - ringX) * ease;
      ringY += (mouseY - ringY) * ease;
      const pressScale = ring!.dataset.press === "true" ? 0.85 : 1;
      ring!.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%) scale(${pressScale})`;
      rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);

    return () => {
      document.body.classList.remove("has-custom-cursor");
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  return (
    <>
      <div
        ref={ringRef}
        aria-hidden="true"
        className="custom-cursor-ring pointer-events-none fixed left-0 top-0 z-[9998] h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0 transition-[opacity,width,height,background-color,border-color] duration-200 ease-out"
      />
      <div
        ref={dotRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[9999] h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-xp-cyan opacity-0 shadow-[0_0_8px_2px_rgba(34,211,238,0.8)] transition-opacity duration-150 ease-out"
      />
    </>
  );
}
