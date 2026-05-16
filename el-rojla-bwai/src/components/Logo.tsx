"use client";

import React, { useEffect, useRef } from "react";

interface LogoProps {
  size?: number;
  className?: string;
}

const logoStyle = `
@keyframes logo-in {
  from { opacity: 0; transform: scale(0.82); }
  to   { opacity: 1; transform: scale(1); }
}
.logo-box {
  animation: logo-in 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both;
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

export function LogoIcon({ size = 36, className = "" }: LogoProps) {
  return (
    <>
      <StyleOnce />
      <div
        style={{ width: size, height: size }}
        className={`logo-box rounded-xl bg-slate-900 dark:bg-white flex items-center justify-center shrink-0 ${className}`}
      >
        <span
          style={{
            fontSize: size * 0.58,
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontWeight: 400,
            fontStyle: "italic",
            lineHeight: 1,
          }}
          className="text-white dark:text-slate-900 select-none"
        >
          L
        </span>
      </div>
    </>
  );
}

export function LogoFull({ size = 36, className = "" }: LogoProps) {
  return (
    <>
      <StyleOnce />
      <div className={`flex items-center gap-2.5 ${className}`}>
        <div
          style={{ width: size, height: size }}
          className="logo-box rounded-xl bg-slate-900 dark:bg-white flex items-center justify-center shrink-0"
        >
          <span
            style={{
              fontSize: size * 0.58,
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontWeight: 400,
              fontStyle: "italic",
              lineHeight: 1,
            }}
            className="text-white dark:text-slate-900 select-none"
          >
            L
          </span>
        </div>
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
