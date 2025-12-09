'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

export function InteractiveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const dotsRef = useRef<{ x: number; y: number; vx: number; vy: number }[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize dots
    const numDots = 150;
    const dots: { x: number; y: number; vx: number; vy: number }[] = [];

    for (let i = 0; i < numDots; i++) {
      dots.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
      });
    }
    dotsRef.current = dots;

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);

    const animate = () => {
      ctx.fillStyle = 'rgba(2, 6, 23, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const dots = dotsRef.current;

      dots.forEach((dot, i) => {
        // Update position
        dot.x += dot.vx;
        dot.y += dot.vy;

        // Bounce off edges
        if (dot.x < 0 || dot.x > canvas.width) dot.vx *= -1;
        if (dot.y < 0 || dot.y > canvas.height) dot.vy *= -1;

        // Calculate distance from mouse
        const dx = mousePos.x - dot.x;
        const dy = mousePos.y - dot.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = 150;

        // Draw dot
        const brightness = Math.max(0, 1 - distance / maxDistance);
        const size = 2 + brightness * 3;

        ctx.beginPath();
        ctx.arc(dot.x, dot.y, size, 0, Math.PI * 2);

        // Cyan color with glow effect
        const alpha = 0.3 + brightness * 0.7;
        ctx.fillStyle = `rgba(6, 182, 212, ${alpha})`;
        ctx.shadowBlur = brightness * 15;
        ctx.shadowColor = `rgba(6, 182, 212, ${brightness})`;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw connections to nearby dots
        dots.forEach((otherDot, j) => {
          if (i >= j) return;

          const dx2 = dot.x - otherDot.x;
          const dy2 = dot.y - otherDot.y;
          const distance2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

          if (distance2 < 100) {
            const opacity = (1 - distance2 / 100) * 0.3;

            // Check if either dot is near mouse
            const mouseDist1 = Math.sqrt(
              Math.pow(mousePos.x - dot.x, 2) + Math.pow(mousePos.y - dot.y, 2)
            );
            const mouseDist2 = Math.sqrt(
              Math.pow(mousePos.x - otherDot.x, 2) + Math.pow(mousePos.y - otherDot.y, 2)
            );

            const nearMouse = Math.min(mouseDist1, mouseDist2) < maxDistance;
            const lineOpacity = nearMouse ? opacity * 2 : opacity;

            ctx.beginPath();
            ctx.moveTo(dot.x, dot.y);
            ctx.lineTo(otherDot.x, otherDot.y);
            ctx.strokeStyle = `rgba(6, 182, 212, ${lineOpacity})`;
            ctx.lineWidth = nearMouse ? 1.5 : 0.5;
            ctx.stroke();
          }
        });
      });

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [mousePos]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ background: 'transparent' }}
    />
  );
}
