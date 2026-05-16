"use client";

import React, { useEffect, useRef } from "react";

interface LogoProps {
  size?: number;
  className?: string;
}

const logoStyle = `
@keyframes linkly-pop {
  0%   { opacity: 0; transform: scale(0.84); }
  100% { opacity: 1; transform: scale(1); }
}
.linkly-mark {
  animation: linkly-pop 0.42s cubic-bezier(0.34, 1.48, 0.64, 1) both;
}
`;

function StyleOnce() {
  const injected = useRef(false);
  useEffect(() => {
    if (injected.current) return;
    injected.current = true;
    const el = document.createElement("style");
    el.textContent = logoStyle;
    document.head.appendChild(el);
  }, []);
  return null;
}

function LMark({ size }: { size: number }) {
  const notch = size * 0.28;
  const pad = size * 0.18;
  const stemW = size * 0.16;
  const armH = size * 0.16;
  const dotSize = size * 0.09;
  const stemX = pad;
  const stemY = pad + notch * 0.3;
  const stemH = size - pad - stemY;
  const armY = size - pad - armH;
  const armW = size - pad - stemX;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="linkly-mark shrink-0"
      style={{ display: "block" }}
    >
      <rect width={size} height={size} fill="#0F172A" />
      <polygon points={`${size - notch},0 ${size},0 ${size},${notch}`} fill="#F8FAFC" />
      <rect x={stemX} y={stemY} width={stemW} height={stemH} fill="white" />
      <rect x={stemX} y={armY} width={armW} height={armH} fill="white" />
      <rect x={stemX + armW - dotSize} y={armY} width={dotSize} height={dotSize} fill="#3B82F6" />
    </svg>
  );
}

export function LogoIcon({ size = 36, className = "" }: LogoProps) {
  return (
    <>
      <StyleOnce />
      <div className={className}>
        <LMark size={size} />
      </div>
    </>
  );
}

export function LogoFull({ size = 36, className = "" }: LogoProps) {
  return (
    <>
      <StyleOnce />
      <div className={`flex items-center gap-2.5 ${className}`}>
        <LMark size={size} />
        <span
          style={{ fontSize: size * 0.5 }}
          className="font-semibold tracking-tight text-slate-800 dark:text-white leading-none"
        >
          Linkly
        </span>
      </div>
    </>
  );
}
