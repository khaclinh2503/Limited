"use client";

import { useEffect, useRef } from "react";

const PETALS = ["🌸", "🌺", "🌹", "✿", "❀"];
const PETAL_COUNT = 12;

interface PetalConfig {
  emoji: string;
  left: number;
  duration: number;
  delay: number;
  size: number;
}

export function PetalLayer() {
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;

    const configs: PetalConfig[] = Array.from({ length: PETAL_COUNT }, () => ({
      emoji: PETALS[Math.floor(Math.random() * PETALS.length)],
      left: Math.random() * 100,
      duration: 8 + Math.random() * 10,
      delay: Math.random() * 12,
      size: 14 + Math.random() * 12,
    }));

    configs.forEach((cfg) => {
      const el = document.createElement("span");
      el.className = "petal";
      el.textContent = cfg.emoji;
      el.style.left = `${cfg.left}%`;
      el.style.fontSize = `${cfg.size}px`;
      el.style.animationDuration = `${cfg.duration}s`;
      el.style.animationDelay = `${cfg.delay}s`;
      layer.appendChild(el);
    });

    return () => {
      layer.innerHTML = "";
    };
  }, []);

  return <div ref={layerRef} className="petal-layer" aria-hidden="true" />;
}
