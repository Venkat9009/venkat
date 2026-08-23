"use client";

import { useEffect, useRef } from "react";
import "./PixelCard.css";

class Pixel {
  width: number;
  height: number;
  ctx: CanvasRenderingContext2D;
  originX: number;
  originY: number;
  color: string;
  speed: number;
  size: number;
  sizeStep: number;
  minSize: number;
  maxSizeInteger: number;
  maxSize: number;
  delay: number;
  counter: number;
  counterStep: number;
  isIdle: boolean;
  isReverse: boolean;
  isShimmer: boolean;
  progress: number;
  scatterX: number;
  scatterY: number;

  constructor(
    canvas: HTMLCanvasElement,
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: string,
    speed: number,
    delay: number
  ) {
    this.width = canvas.width;
    this.height = canvas.height;
    this.ctx = context;
    this.originX = x;
    this.originY = y;
    this.color = color;
    this.speed = this.getRandomValue(0.1, 0.9) * speed;
    this.size = 0;
    this.sizeStep = Math.random() * 0.8 + 0.3;
    this.minSize = 0.5;
    this.maxSizeInteger = 5;
    this.maxSize = this.getRandomValue(this.minSize, this.maxSizeInteger);
    this.delay = delay;
    this.counter = 0;
    this.counterStep = Math.random() * 8 + (this.width + this.height) * 0.02;
    this.isIdle = false;
    this.isReverse = false;
    this.isShimmer = false;
    this.progress = 0;
    const cx = this.width / 2;
    const cy = this.height / 2;
    const dx = this.originX - cx;
    const dy = this.originY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const scatter = 20 + this.getRandomValue(0, 40);
    this.scatterX = this.originX + (dx / dist) * scatter;
    this.scatterY = this.originY + (dy / dist) * scatter;
  }

  getRandomValue(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  draw() {
    const centerOffset = this.maxSizeInteger * 0.5 - this.size * 0.5;
    const px = this.originX + (this.scatterX - this.originX) * this.progress;
    const py = this.originY + (this.scatterY - this.originY) * this.progress;
    this.ctx.fillStyle = this.color;
    this.ctx.fillRect(
      px + centerOffset,
      py + centerOffset,
      this.size,
      this.size
    );
  }

  appear() {
    this.isIdle = false;
    if (this.counter <= this.delay) {
      this.counter += this.counterStep;
      return;
    }
    this.progress = Math.min(1, this.progress + 0.025);
    this.size = this.progress * this.maxSize;
    if (this.progress >= 1) {
      this.isShimmer = true;
    }
    if (this.isShimmer) {
      this.shimmer();
    }
    this.draw();
  }

  disappear() {
    this.isShimmer = false;
    this.counter = 0;
    this.progress = Math.max(0, this.progress - 0.025);
    this.size = this.progress * this.maxSize;
    if (this.progress <= 0) {
      this.isIdle = true;
      return;
    }
    this.draw();
  }

  shimmer() {
    if (this.size >= this.maxSize) {
      this.isReverse = true;
    } else if (this.size <= this.minSize) {
      this.isReverse = false;
    }
    if (this.isReverse) {
      this.size -= this.speed;
    } else {
      this.size += this.speed;
    }
  }
}

function getEffectiveSpeed(value: number, reducedMotion: boolean): number {
  const min = 0;
  const max = 100;
  const throttle = 0.003;

  if (value <= min || reducedMotion) {
    return min;
  } else if (value >= max) {
    return max * throttle;
  } else {
    return value * throttle;
  }
}

interface VariantCfg {
  activeColor: string | null;
  gap: number;
  speed: number;
  colors: string;
  noFocus: boolean;
  darkColors?: string;
}

const VARIANTS: Record<string, VariantCfg> = {
  default: {
    activeColor: null,
    gap: 5,
    speed: 35,
    colors: "#f8fafc,#f1f5f9,#cbd5e1",
    darkColors: "#2c2c2e,#3a3a3c,#48484a",
    noFocus: false,
  },
  blue: {
    activeColor: "#e0f2fe",
    gap: 10,
    speed: 25,
    colors: "#e0f2fe,#7dd3fc,#0ea5e9",
    darkColors: "#1a3a5c,#0d5e9e,#007aff",
    noFocus: false,
  },
  yellow: {
    activeColor: "#fef08a",
    gap: 3,
    speed: 20,
    colors: "#fef08a,#fde047,#eab308",
    darkColors: "#3a3200,#5c4f00,#8a7500",
    noFocus: false,
  },
  pink: {
    activeColor: "#fecdd3",
    gap: 6,
    speed: 80,
    colors: "#fecdd3,#fda4af,#e11d48",
    darkColors: "#4a1a24,#7d2a3a,#c41a3a",
    noFocus: true,
  },
};

function resolveVariant(variant: string): VariantCfg {
  const cfg = VARIANTS[variant] || VARIANTS.default;
  const isDark = typeof document !== "undefined" && document.body.classList.contains("dark");
  if (isDark && cfg.darkColors) {
    return { ...cfg, colors: cfg.darkColors };
  }
  return cfg;
}

interface PixelCardProps {
  variant?: keyof typeof VARIANTS;
  gap?: number;
  speed?: number;
  colors?: string;
  noFocus?: boolean;
  invert?: boolean;
  reveal?: boolean;
  className?: string;
  pixelText?: string;
  children: React.ReactNode;
}

export default function PixelCard({
  variant = "default",
  gap,
  speed,
  colors,
  noFocus,
  invert = false,
  reveal = false,
  className = "",
  pixelText,
  children,
}: PixelCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pixelsRef = useRef<Pixel[]>([]);
  const animationRef = useRef<number>(0);
  const timePreviousRef = useRef(0);
  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const variantCfg = resolveVariant(variant);
  const finalGap = gap ?? variantCfg.gap;
  const finalSpeed = speed ?? variantCfg.speed;
  const finalColors = colors ?? variantCfg.colors;
  const finalNoFocus = noFocus ?? variantCfg.noFocus;

  const sampleImageColors = (width: number, height: number) => {
    try {
      const contentEl = containerRef.current?.querySelector(".pixel-card-content");

      const gap = parseInt(String(finalGap), 10);
      const cols = Math.ceil(width / gap);
      const rows = Math.ceil(height / gap);
      if (cols <= 0 || rows <= 0) return null;

      const offscreen = document.createElement("canvas");
      offscreen.width = cols;
      offscreen.height = rows;
      const octx = offscreen.getContext("2d");
      if (!octx) return null;

      octx.imageSmoothingEnabled = false;

      const img = contentEl?.querySelector("img");
      const hasImage = img && img.complete && img.naturalWidth > 0;

      if (hasImage) {
        octx.drawImage(img, 0, 0, cols, rows);
      } else {
        octx.fillStyle = "#000";
        octx.fillRect(0, 0, cols, rows);
      }

      if (pixelText) {
        const words = pixelText.split(/\s+/).filter(Boolean);
        const displayText = words.length > 3
          ? words.slice(0, 3).join(" ")
          : pixelText;
        const maxWidth = cols * 0.9;
        let fontSize = Math.min(rows * 0.14, maxWidth / displayText.length * 1.4);
        fontSize = Math.max(fontSize, 6);
        octx.fillStyle = "#fff";
        octx.font = `bold ${fontSize}px sans-serif`;
        octx.textAlign = "center";
        octx.textBaseline = "middle";
        octx.shadowColor = "rgba(0,0,0,0.5)";
        octx.shadowBlur = 1;
        octx.fillText(displayText.toUpperCase(), cols / 2, rows / 2);
      }

      const imageData = octx.getImageData(0, 0, cols, rows);

      const colorMap: Record<string, string> = {};
      for (let x = 0; x < width; x += gap) {
        for (let y = 0; y < height; y += gap) {
          const col = Math.round(x / gap);
          const row = Math.round(y / gap);
          const idx = (row * cols + col) * 4;
          if (idx + 3 < imageData.data.length && imageData.data[idx + 3] > 128) {
            colorMap[`${x},${y}`] =
              `rgb(${imageData.data[idx]},${imageData.data[idx + 1]},${imageData.data[idx + 2]})`;
          }
        }
      }
      return Object.keys(colorMap).length > 0 ? colorMap : null;
    } catch {
      return null;
    }
  };

  const initPixels = () => {
    if (!containerRef.current || !canvasRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const width = Math.floor(rect.width);
    const height = Math.floor(rect.height);
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    canvasRef.current.width = width;
    canvasRef.current.height = height;
    canvasRef.current.style.width = `${width}px`;
    canvasRef.current.style.height = `${height}px`;

    const sampled = sampleImageColors(width, height);
    const colorsArray = finalColors.split(",");
    const pxs: Pixel[] = [];
    for (let x = 0; x < width; x += parseInt(String(finalGap), 10)) {
      for (let y = 0; y < height; y += parseInt(String(finalGap), 10)) {
        let color: string;
        const sampledColor = sampled?.[`${x},${y}`];
        if (sampledColor) {
          color = sampledColor;
        } else {
          color = colorsArray[Math.floor(Math.random() * colorsArray.length)];
        }

        const dx = x - width / 2;
        const dy = y - height / 2;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const delay = reducedMotion ? 0 : distance;

        const p = new Pixel(
          canvasRef.current,
          ctx,
          x,
          y,
          color,
          getEffectiveSpeed(finalSpeed, reducedMotion),
          delay
        );
        if (reveal) {
          p.progress = 1;
          p.size = p.maxSize;
        }
        pxs.push(p);
      }
    }
    ctx.clearRect(0, 0, width, height);
    for (const pixel of pxs) {
      pixel.draw();
    }
    pixelsRef.current = pxs;
  };

  const doAnimate = (fnName: "appear" | "disappear") => {
    animationRef.current = requestAnimationFrame(() => doAnimate(fnName));
    // eslint-disable-next-line react-hooks/purity
    const timeNow = performance.now();
    const timePassed = timeNow - timePreviousRef.current;
    const timeInterval = 1000 / 60;

    if (timePassed < timeInterval) return;
    timePreviousRef.current = timeNow - (timePassed % timeInterval);

    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !canvasRef.current) return;

    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    let allIdle = true;
    for (let i = 0; i < pixelsRef.current.length; i++) {
      const pixel = pixelsRef.current[i];
      pixel[fnName]();
      if (!pixel.isIdle) {
        allIdle = false;
      }
    }

    if (allIdle) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  const handleAnimation = (name: "appear" | "disappear") => {
    cancelAnimationFrame(animationRef.current);
    animationRef.current = requestAnimationFrame(() => doAnimate(name));
  };

  const onMouseEnter = () => handleAnimation(reveal ? "disappear" : "appear");
  const onMouseLeave = () => handleAnimation(reveal ? "appear" : "disappear");
  const onFocus = (e: React.FocusEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    handleAnimation("appear");
  };
  const onBlur = (e: React.FocusEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    handleAnimation("disappear");
  };

  useEffect(() => {
    initPixels();
    const observer = new ResizeObserver(() => {
      initPixels();
    });
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => {
      observer.disconnect();
      cancelAnimationFrame(animationRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalGap, finalSpeed, finalColors, finalNoFocus]);

  return (
    <div
      ref={containerRef}
      className={`pixel-card ${invert ? "pixel-card-invert" : ""} ${reveal ? "pixel-card-reveal" : ""} ${className}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onFocus={finalNoFocus ? undefined : onFocus}
      onBlur={finalNoFocus ? undefined : onBlur}
      tabIndex={finalNoFocus ? -1 : 0}
    >
      <canvas className="pixel-canvas" ref={canvasRef} />
      <div className="pixel-card-content">{children}</div>
      {reveal && pixelText && (
        <div className="pixel-card-heading">
          <span className="pixel-card-title">{pixelText}</span>
        </div>
      )}
    </div>
  );
}
