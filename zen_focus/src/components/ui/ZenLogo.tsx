import React from 'react'

interface ZenLogoProps {
  className?: string
  size?: number
  color?: string
}

export default function ZenLogo({ className = '', size = 24, color = 'currentColor' }: ZenLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Zen Focus Logo"
    >
      <path
        d="M 27 68 C 20 54 22 36 34 24 C 44 14 60 13 71 22 C 81 30 85 45 82 58"
        stroke={color}
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="49" cy="48" r="3.5" fill={color} />
      <path
        d="M 49 48 V 26"
        stroke={color}
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <path
        d="M 49 48 L 68 60"
        stroke={color}
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <path
        d="M 22 74 C 32 74 41 68 53 66 C 68 64 78 71 88 70 C 76 75 66 73 54 71 C 42 69 32 76 22 74 Z"
        fill={color}
      />
    </svg>
  )
}
