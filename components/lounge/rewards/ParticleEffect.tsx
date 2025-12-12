import { useEffect, useRef } from "react";
import styled from "styled-components";

interface ParticleEffectProps {
  color: string;
  count: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  decay: number;
  color: string;
}

export function ParticleEffect({ color, count }: ParticleEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Parse color to RGB for variations
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? {
            r: parseInt(result[1] ?? "0", 16),
            g: parseInt(result[2] ?? "0", 16),
            b: parseInt(result[3] ?? "0", 16),
          }
        : { r: 255, g: 255, b: 255 };
    };

    const baseColor = hexToRgb(color);

    // Create particles
    const particles: Particle[] = [];
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 3 + Math.random() * 8;
      const size = 3 + Math.random() * 6;

      // Color variation
      const colorVariation = 0.8 + Math.random() * 0.4;
      const r = Math.min(255, Math.floor(baseColor.r * colorVariation));
      const g = Math.min(255, Math.floor(baseColor.g * colorVariation));
      const b = Math.min(255, Math.floor(baseColor.b * colorVariation));

      particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size,
        alpha: 1,
        decay: 0.015 + Math.random() * 0.01,
        color: `rgb(${r}, ${g}, ${b})`,
      });
    }

    // Add some extra sparkle particles
    for (let i = 0; i < count / 2; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 4;

      particles.push({
        x: centerX + (Math.random() - 0.5) * 100,
        y: centerY + (Math.random() - 0.5) * 100,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 1 + Math.random() * 3,
        alpha: 1,
        decay: 0.02 + Math.random() * 0.015,
        color: "#ffffff",
      });
    }

    // Animation loop
    let animationId: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let activeParticles = 0;

      particles.forEach((particle) => {
        if (particle.alpha <= 0) return;
        activeParticles++;

        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Apply gravity
        particle.vy += 0.1;

        // Apply air resistance
        particle.vx *= 0.99;
        particle.vy *= 0.99;

        // Fade out
        particle.alpha -= particle.decay;

        // Draw particle
        ctx.save();
        ctx.globalAlpha = particle.alpha;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();

        // Add glow effect for larger particles
        if (particle.size > 4) {
          ctx.globalAlpha = particle.alpha * 0.3;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });

      if (activeParticles > 0) {
        animationId = requestAnimationFrame(animate);
      }
    };

    animate();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
    };
  }, [color, count]);

  return <Canvas ref={canvasRef} />;
}

const Canvas = styled.canvas`
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 10;
`;
