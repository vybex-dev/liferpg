"use client";

import { useEffect, useRef } from "react";

/**
 * Ambient 3D particle field rendered behind all page content.
 *
 * Purely decorative — a slow-drifting point cloud in the same
 * violet / cyan / gold palette as the rest of the UI, with gentle
 * parallax toward the pointer. It sits in a fixed canvas between
 * the body's gradient blobs (::before) and the film-grain overlay
 * (::after), so it reads as depth behind the glass cards rather
 * than competing with them.
 *
 * - Skips entirely under prefers-reduced-motion (renders one still
 *   frame instead of looping rAF).
 * - Uses a lighter particle count on narrow / coarse-pointer
 *   (touch) devices to keep things smooth on phones.
 * - Tears everything down on unmount: geometry, material, renderer,
 *   and every listener, so this is safe to mount once in the root
 *   layout for the lifetime of the app.
 */
export function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;

    let cleanup = () => {};
    let cancelled = false;

    (async () => {
      // Loaded lazily so the ~150kb three.js core never blocks the
      // initial route render — the particle field is pure ambience,
      // not something the user is waiting on.
      const THREE = await import("three");
      if (cancelled) return;

      const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: false,
        powerPreference: "low-power",
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(
        55,
        window.innerWidth / window.innerHeight,
        0.1,
        100
      );
      camera.position.z = 9;

      const PARTICLE_COUNT = isCoarsePointer ? 260 : 620;
      const positions = new Float32Array(PARTICLE_COUNT * 3);
      const colors = new Float32Array(PARTICLE_COUNT * 3);
      const sizes = new Float32Array(PARTICLE_COUNT);

      // Theme palette: violet, cyan, gold, magenta — matching the
      // XP / gold / attribute accent colors used across the app.
      const palette = [
        [0.545, 0.361, 0.965], // xp-violet #8b5cf6
        [0.133, 0.827, 0.933], // xp-cyan   #22d3ee
        [0.961, 0.725, 0.259], // gold      #f5b942
        [0.91, 0.475, 0.976], // charisma  #e879f9
      ];

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3;
        // Spread through a wide, flattened volume so particles read
        // as a field behind the content rather than a centered blob.
        positions[i3] = (Math.random() - 0.5) * 22;
        positions[i3 + 1] = (Math.random() - 0.5) * 16;
        positions[i3 + 2] = (Math.random() - 0.5) * 14;

        const [r, g, b] = palette[i % palette.length];
        colors[i3] = r;
        colors[i3 + 1] = g;
        colors[i3 + 2] = b;

        sizes[i] = Math.random() * 2.2 + 0.6;
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(positions, 3)
      );
      geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

      // Soft round sprite generated on a tiny canvas — cheaper than
      // loading a texture asset, and gives particles a glow instead
      // of hard-edged squares.
      const spriteCanvas = document.createElement("canvas");
      spriteCanvas.width = 64;
      spriteCanvas.height = 64;
      const ctx = spriteCanvas.getContext("2d")!;
      const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      gradient.addColorStop(0, "rgba(255,255,255,1)");
      gradient.addColorStop(0.4, "rgba(255,255,255,0.6)");
      gradient.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 64, 64);
      const spriteTexture = new THREE.CanvasTexture(spriteCanvas);

      const material = new THREE.PointsMaterial({
        size: 0.16,
        map: spriteTexture,
        vertexColors: true,
        transparent: true,
        opacity: 0.75,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      });

      const points = new THREE.Points(geometry, material);
      scene.add(points);

      const pointer = { x: 0, y: 0 };
      const targetPointer = { x: 0, y: 0 };

      function handlePointerMove(event: PointerEvent) {
        targetPointer.x = (event.clientX / window.innerWidth - 0.5) * 2;
        targetPointer.y = (event.clientY / window.innerHeight - 0.5) * 2;
      }

      function handleResize() {
        if (!canvas) return;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight, false);
      }

      handleResize();
      window.addEventListener("resize", handleResize);
      if (!isCoarsePointer) {
        window.addEventListener("pointermove", handlePointerMove);
      }

      let rafId = 0;
      const clock = new THREE.Clock();

      function renderFrame() {
        const elapsed = clock.getElapsedTime();

        // Lerp the parallax target so mouse movement drifts the
        // field rather than snapping the camera to the cursor.
        pointer.x += (targetPointer.x - pointer.x) * 0.02;
        pointer.y += (targetPointer.y - pointer.y) * 0.02;

        points.rotation.y = elapsed * 0.025;
        points.rotation.x = Math.sin(elapsed * 0.08) * 0.05;

        camera.position.x = pointer.x * 0.6;
        camera.position.y = -pointer.y * 0.4;
        camera.lookAt(0, 0, 0);

        renderer.render(scene, camera);
      }

      if (reduceMotion) {
        // Single still frame: the field is present for visual depth
        // but never animates, matching the site-wide reduced-motion
        // contract in globals.css.
        renderFrame();
      } else {
        const loop = () => {
          renderFrame();
          rafId = requestAnimationFrame(loop);
        };
        rafId = requestAnimationFrame(loop);
      }

      cleanup = () => {
        cancelAnimationFrame(rafId);
        window.removeEventListener("resize", handleResize);
        window.removeEventListener("pointermove", handlePointerMove);
        geometry.dispose();
        material.dispose();
        spriteTexture.dispose();
        renderer.dispose();
      };
    })();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-[1] h-full w-full opacity-80"
    />
  );
}
