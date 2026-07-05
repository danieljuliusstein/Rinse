'use client'

import Image from 'next/image'
import type { PhoneAngle } from './onboarding-data'

const COLORS = {
  bezel: '#08090d',
  screenBg: '#f4f4f5',
  accent: '#22c55e',
}

const PW = 168
const PH = 344
const PD = 14

type PhoneFrameProps = {
  src: string
  alt: string
  glow?: boolean
  angle?: PhoneAngle
}

export function PhoneFrame({ src, alt, glow = false, angle = { x: 0, y: 0, z: 0 } }: PhoneFrameProps) {
  const { x = 0, y = 0, z = 0 } = angle

  return (
    <div className="ob-phone-stage">
      <div
        className="ob-phone-tilt"
        style={{ transform: `rotateX(${x}deg) rotateY(${y}deg) rotateZ(${z}deg)` }}
      >
        <div className="ob-phone-slab ob-phone-slab--back" />
        <div className="ob-phone-slab ob-phone-slab--mid" />
        <div className="ob-phone-slab ob-phone-slab--front">
          <span className="ob-phone-notch" aria-hidden />
          <div className="ob-phone-screen">
            {glow ? <span className="ob-phone-sweep" aria-hidden /> : null}
            <Image
              src={src}
              alt={alt}
              width={390}
              height={844}
              className="ob-phone-shot"
              priority
              sizes={`${PW}px`}
            />
          </div>
        </div>
      </div>
      <span
        className="ob-phone-shadow"
        aria-hidden
        style={{ transform: `rotateZ(${z}deg) translateX(${y * 0.6}px)` }}
      />

      <style>{`
        .ob-phone-stage {
          position: relative;
          perspective: 1500px;
          width: ${PW}px;
          margin: 0 auto;
        }
        .ob-phone-tilt {
          position: relative;
          width: ${PW}px;
          height: ${PH}px;
          transform-style: preserve-3d;
        }
        .ob-phone-slab {
          position: absolute;
          top: 0;
          left: 0;
          width: ${PW}px;
          height: ${PH}px;
          border-radius: 30px;
          backface-visibility: hidden;
        }
        .ob-phone-slab--back {
          background: #050609;
          transform: translateZ(-${PD}px);
        }
        .ob-phone-slab--mid {
          background: #0c0d12;
          transform: translateZ(-${PD / 2}px);
        }
        .ob-phone-slab--front {
          background: ${COLORS.bezel};
          padding: 7px;
          box-sizing: border-box;
          transform: translateZ(0);
          box-shadow:
            0 24px 40px -12px rgba(0, 0, 0, 0.55),
            inset 0 0 0 1.5px rgba(255, 255, 255, 0.06);
        }
        .ob-phone-shadow {
          position: absolute;
          left: 50%;
          bottom: -14px;
          width: 78%;
          height: 22px;
          margin-left: -39%;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.45);
          filter: blur(14px);
          transform-origin: center;
        }
        .ob-phone-notch {
          position: absolute;
          top: 7px;
          left: 50%;
          transform: translateX(-50%);
          width: 52px;
          height: 14px;
          border-radius: 0 0 9px 9px;
          background: ${COLORS.bezel};
          z-index: 2;
        }
        .ob-phone-screen {
          position: relative;
          width: 100%;
          height: 100%;
          border-radius: 23px;
          overflow: hidden;
          background: ${COLORS.screenBg};
        }
        .ob-phone-shot {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: top center;
        }
        .ob-phone-sweep {
          position: absolute;
          top: 0;
          left: -60%;
          width: 40%;
          height: 100%;
          z-index: 1;
          background: linear-gradient(115deg, transparent, rgba(255, 255, 255, 0.35), transparent);
          animation: ob-phone-sweep 3.2s ease-in-out infinite;
          pointer-events: none;
        }
        @keyframes ob-phone-sweep {
          0% { left: -60%; }
          55% { left: 120%; }
          100% { left: 120%; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ob-phone-sweep {
            animation: none;
            display: none;
          }
        }
      `}</style>
    </div>
  )
}
