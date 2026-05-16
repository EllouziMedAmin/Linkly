import React from "react";

interface LogoProps {
  size?: number;
  className?: string;
}

export function LogoIcon({ size = 36, className = "" }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 110"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect x="10" y="5" width="32" height="75" fill="#2F6FBF" />
      <polygon points="10,80 10,105 75,105 42,80" fill="white" />
    </svg>
  );
}

export function LogoFull({ size = 36, className = "" }: LogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        style={{ width: size, height: size }}
        className="rounded-lg bg-slate-900 dark:bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden"
      >
        <svg
          width={size * 0.75}
          height={size * 0.75}
          viewBox="0 0 100 110"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="10" y="5" width="32" height="75" fill="#2F6FBF" />
          <polygon points="10,80 10,105 75,105 42,80" fill="white" />
        </svg>
      </div>
      <span
        style={{ fontSize: size * 0.5 }}
        className="font-bold tracking-tight text-slate-800 dark:text-white leading-none"
      >
        El-Rojla-Bwai
      </span>
    </div>
  );
}
