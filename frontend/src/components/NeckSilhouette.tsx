import { FC } from "react";

interface NeckSilhouetteProps {
  className?: string;
  strokeColor?: string;
}

export const NeckSilhouette: FC<NeckSilhouetteProps> = ({
  className = "",
  strokeColor = "hsl(43, 30%, 70%)",
}) => {
  return (
    <svg
      viewBox="0 0 300 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Minimalist female neck and shoulders silhouette */}
      {/* Left shoulder */}
      <path
        d="M 0 400
           Q 20 380, 40 340
           Q 60 300, 80 280
           Q 100 260, 110 250"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />

      {/* Left side of neck */}
      <path
        d="M 110 250
           Q 115 220, 118 190
           Q 120 160, 125 130"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />

      {/* Chin/jaw area (subtle curve, no face) */}
      <path
        d="M 125 130
           Q 130 100, 150 85
           Q 170 75, 175 70"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />

      {/* Right side chin */}
      <path
        d="M 125 70
           Q 130 75, 150 85
           Q 170 100, 175 130"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />

      {/* Right side of neck */}
      <path
        d="M 175 130
           Q 180 160, 182 190
           Q 185 220, 190 250"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />

      {/* Right shoulder */}
      <path
        d="M 190 250
           Q 200 260, 220 280
           Q 240 300, 260 340
           Q 280 380, 300 400"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />

      {/* Collarbone hints */}
      <path
        d="M 70 320 Q 110 300, 150 295 Q 190 300, 230 320"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.6"
      />

      {/* Décolleté V-line hint */}
      <path
        d="M 130 295 Q 150 340, 150 360 Q 150 340, 170 295"
        stroke={strokeColor}
        strokeWidth="1"
        strokeLinecap="round"
        fill="none"
        opacity="0.4"
      />
    </svg>
  );
};
