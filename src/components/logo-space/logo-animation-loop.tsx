"use client";

import { useEffect, useState } from "react";

export default function LogoAnimationLoop() {
  const [isLooping, setIsLooping] = useState(true);

  useEffect(() => {
    // start animation on load
    setIsLooping(true);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center select-none">
      {/* Scene */}
      <div
        id="scene"
        className={`relative flex items-center justify-center ${isLooping ? "animate-logo" : ""}`}
      >
        {/* Logo wrapper */}
        <div className="relative flex items-center justify-center w-[var(--logo-size)] h-[var(--logo-size)]">
          {/* Helper dots */}
          <div className="shape blue absolute w-[var(--dot-size)] h-[var(--dot-size)] rounded-full bg-[var(--c-blue)]" />
          <div className="shape orange absolute w-[var(--dot-size)] h-[var(--dot-size)] rounded-full bg-[var(--c-orange)] opacity-0" />
          <div className="shape pink absolute w-[var(--dot-size)] h-[var(--dot-size)] rounded-full bg-[var(--c-pink)] opacity-0" />

          {/* SVG Logo */}
          <svg
            className="main-logo-svg absolute w-full h-full z-10 overflow-visible"
            viewBox="0 0 561 555"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              className="svg-path blue"
              d="M521.503 555H371.512L0.0364825 184.836V45.462C-1.16344 9.49464 27.5347 0.835825 42.0337 1.00234H188.524L561 375.163V520.531C557.4 544.909 533.169 553.668 521.503 555Z"
              fill="#3B82F6"
            />
            <path
              className="svg-path orange"
              d="M0.0362596 515V300L253.036 555H29.0363C4.63626 551.4 -0.46374 526.833 0.0362596 515Z"
              fill="#FFA239"
            />
            <path
              className="svg-path pink"
              d="M560.036 36V258L297.536 0.5L516.536 0C547.736 3.6 559.87 25.8333 560.036 36Z"
              fill="#F472B6"
            />
          </svg>
        </div>
      </div>

      {/* Toggle button */}
      {/* <button
                onClick={() => setIsLooping((v) => !v)}
                className="fixed bottom-8 px-5 py-2 rounded-full bg-slate-100 text-slate-500 text-sm hover:bg-slate-200 hover:text-slate-700 transition"
            >
                {isLooping ? "Stop Loop" : "Start Loop"}
            </button> */}
    </div>
  );
}
