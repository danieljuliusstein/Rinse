'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ArrowLeft } from '@phosphor-icons/react'
import { SetupHeroBand, SetupHeroCurve } from '@/components/setup'
import { markSetupIntroSeen } from '@/lib/setup-intro'
import { SETUP_CAROUSEL_POSTERS } from '@/lib/setup-hero-assets'
import { trackIntroSlideViewed } from '@/lib/onboarding-analytics'
import { springStandard } from '@/lib/motion'

const SLIDES = [
  {
    title: 'Book from your phone',
    lead: 'Share your link — clients pick a service, date, and time',
    placeholder: 'setup-intro__hero-placeholder--1' as const,
  },
  {
    title: 'Get paid faster',
    lead: 'Send invoices and collect payment on the go',
    placeholder: 'setup-intro__hero-placeholder--2' as const,
  },
  {
    title: 'Track every job',
    lead: 'Jobs, clients, and revenue in one place',
    placeholder: 'setup-intro__hero-placeholder--3' as const,
  },
] as const

interface SetupIntroCarouselProps {
  demo?: boolean
  onDemoFinish?: () => void
  onDemoSkip?: () => void
  onDemoSignIn?: () => void
}

export default function SetupIntroCarousel({
  demo = false,
  onDemoFinish,
  onDemoSkip,
  onDemoSignIn,
}: SetupIntroCarouselProps) {
  const router = useRouter()
  const reduceMotion = useReducedMotion()
  const [index, setIndex] = useState(0)
  const [posterFailed, setPosterFailed] = useState<Record<number, boolean>>({})
  const directionRef = useRef(1)

  const slide = SLIDES[index]
  const posterSrc = SETUP_CAROUSEL_POSTERS[index]
  const showPoster = posterSrc && !posterFailed[index]

  useEffect(() => {
    if (demo) return
    trackIntroSlideViewed(index)
  }, [demo, index])

  const finishIntro = useCallback(
    (destination: '/auth?mode=signup' | '/welcome') => {
      if (demo) {
        if (destination === '/auth?mode=signup') onDemoFinish?.()
        else onDemoSkip?.()
        return
      }
      markSetupIntroSeen()
      router.replace(destination)
    },
    [demo, onDemoFinish, onDemoSkip, router],
  )

  const goNext = useCallback(() => {
    if (index >= SLIDES.length - 1) {
      finishIntro('/auth?mode=signup')
      return
    }
    directionRef.current = 1
    setIndex((i) => i + 1)
  }, [index, finishIntro])

  const goBack = useCallback(() => {
    if (index <= 0) return
    directionRef.current = -1
    setIndex((i) => i - 1)
  }, [index])

  const slideTransition = reduceMotion
    ? { duration: 0.2, ease: 'easeOut' as const }
    : springStandard

  return (
    <div className="setup-intro setup-flow client-light-root">
      <div className="setup-intro__hero">
        <AnimatePresence mode="wait">
          {showPoster ? (
            <motion.div
              key={`poster-${index}`}
              className="setup-intro__hero-media"
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
              transition={slideTransition}
            >
              <SetupHeroBand
                src={posterSrc}
                variant="tall"
                priority={index === 0}
                onImageError={() => setPosterFailed((prev) => ({ ...prev, [index]: true }))}
              />
            </motion.div>
          ) : (
            <motion.div
              key={`placeholder-${index}`}
              className={`setup-intro__hero-placeholder ${slide.placeholder}`}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={slideTransition}
              aria-hidden
            />
          )}
        </AnimatePresence>
        {index > 0 ? (
          <button type="button" className="setup-intro__back" onClick={goBack} aria-label="Back">
            <ArrowLeft size={22} weight="bold" />
          </button>
        ) : null}
      </div>

      <SetupHeroCurve tone="dark" />

      <div className="setup-intro__panel">
        <motion.div
          className="setup-intro__copy"
          drag={reduceMotion ? false : 'x'}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.15}
          onDragEnd={(_, info) => {
            if (info.offset.x < -60) goNext()
            else if (info.offset.x > 60) goBack()
          }}
        >
          <AnimatePresence mode="wait" custom={directionRef.current}>
            <motion.div
              key={index}
              custom={directionRef.current}
              className="setup-intro__slide"
              initial={
                reduceMotion
                  ? { opacity: 0 }
                  : { x: directionRef.current > 0 ? 60 : -60, opacity: 0 }
              }
              animate={reduceMotion ? { opacity: 1 } : { x: 0, opacity: 1 }}
              exit={
                reduceMotion
                  ? { opacity: 0 }
                  : { x: directionRef.current > 0 ? -60 : 60, opacity: 0 }
              }
              transition={slideTransition}
            >
              <h1 className="setup-intro__title">{slide.title}</h1>
              <p className="setup-intro__lead">{slide.lead}</p>
            </motion.div>
          </AnimatePresence>

          <div className="setup-intro__dots" role="tablist" aria-label="Intro slides">
            {SLIDES.map((_, i) => (
              <span
                key={i}
                role="tab"
                aria-selected={i === index}
                className={i === index ? 'setup-intro__dot setup-intro__dot--on' : 'setup-intro__dot'}
              />
            ))}
          </div>
        </motion.div>

        <footer className="setup-intro__footer">
          <button type="button" className="setup-btn-primary setup-intro__cta" onClick={goNext}>
            {index >= SLIDES.length - 1 ? 'Get started' : 'Continue'}
          </button>
          <p className="setup-intro__escape">
            <button type="button" className="setup-intro__skip" onClick={() => finishIntro('/welcome')}>
              Skip
            </button>
            <span aria-hidden="true"> · </span>
            <Link
              href={demo ? '#' : '/auth'}
              onClick={
                demo
                  ? (e) => {
                      e.preventDefault()
                      onDemoSignIn?.()
                    }
                  : undefined
              }
            >
              Already have an account?
            </Link>
          </p>
        </footer>
      </div>
    </div>
  )
}
