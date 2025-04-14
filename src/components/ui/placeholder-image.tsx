"use client";

import React from "react";

interface PlaceholderImageProps {
  text?: string;
  width?: number | string;
  height?: number | string;
  bgColor?: string;
  textColor?: string;
}

export const PlaceholderImage: React.FC<PlaceholderImageProps> = ({
  text = "岩場圖片",
  width = "100%",
  height = "100%",
  bgColor = "#CBD5E1", // tailwind gray-300
  textColor = "#1E293B", // tailwind gray-800
}) => {
  return (
    <div
      style={{
        width,
        height,
        backgroundColor: bgColor,
        color: textColor,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "1rem",
        fontWeight: 500,
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundImage:
            "linear-gradient(45deg, rgba(0,0,0,0.05) 25%, transparent 25%, transparent 50%, rgba(0,0,0,0.05) 50%, rgba(0,0,0,0.05) 75%, transparent 75%, transparent)",
          backgroundSize: "50px 50px",
        }}
      />
      <div style={{ zIndex: 1 }}>{text}</div>
    </div>
  );
};

export default PlaceholderImage;