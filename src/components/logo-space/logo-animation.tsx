"use client";

import React from "react";
import { useEffect } from "react";
import "./logo-animation.css";

export const LogoAnimation = () => {
  const runAnimation = () => {
    const scene = document.getElementById("scene");

    if (!scene) return;

    scene.classList.remove("animate");
    void scene.offsetWidth;
    scene.classList.add("animate");
  };

  useEffect(() => {
    runAnimation();
  }, []);
  return (
    <>
      <div className="scene" id="scene">
        <div className="logo-wrapper">
          {/* Dots */}
          <div className="shape blue"></div>
          <div className="shape cyan"></div>
          <div className="shape pink"></div>

          {/* SVG Logo */}
          <svg
            className="main-logo-svg"
            viewBox="0 0 562 556"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              className="svg-path blue"
              d="M521.536 556H371.536L0.0364849 185.5V45.9999C-1.16352 9.9999 27.5365 1.33324 42.0365 1.4999H188.536L561.036 376V521.5C557.437 545.9 533.203 554.667 521.536 556Z"
              fill="#3B82F6"
            />
            <path
              className="svg-path cyan"
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

        <div className="trigger-dot" id="trigger-dot"></div>

        <div className="text-container">
          <h1 className="logo-text">timecraft</h1>
        </div>
      </div>

      {/* <button
                className="replay-btn"
                id="replayBtn"
                onClick={runAnimation}
            >
                Replay Animation
            </button> */}
    </>
  );
};
