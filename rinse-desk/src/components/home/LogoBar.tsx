import { Reveal } from './Reveal'

const NAMES = [
  'Detail King',
  'Auto Elegance',
  'Clean Machine Co.',
  'Apex Detailing',
  'Prestige Auto Spa',
  'Shine Theory',
  'Mirror Finish',
  'ProWash Mobile',
]

export function LogoBar() {
  return (
    <div className="py-12 px-6 lg:px-12 border-y border-black/6">
      <div className="max-w-7xl mx-auto">
        <Reveal>
          <p className="text-center text-[10px] font-mono text-black/20 uppercase tracking-[0.2em] mb-8">
            Built for detailing professionals
          </p>
        </Reveal>
        <Reveal delay={80} className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {NAMES.map((n) => (
            <span key={n} className="text-xs font-semibold text-black/18 hover:text-black/35 transition-colors cursor-default">
              {n}
            </span>
          ))}
        </Reveal>
      </div>
    </div>
  )
}
