import { FadeUpWhenVisible } from "../shared/motion";

export function LogoBar() {
  const names = [
    "Detail King",
    "Auto Elegance",
    "Clean Machine Co.",
    "Apex Detailing",
    "Prestige Auto Spa",
    "Shine Theory",
    "Mirror Finish",
    "ProWash Mobile",
  ];
  return (
    <div className="py-12 px-6 lg:px-12 border-y border-black/6">
      <div className="max-w-7xl mx-auto">
        <p className="text-center text-[10px] font-mono text-black/20 uppercase tracking-[0.2em] mb-8">
          Built for detailing professionals
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {names.map((n) => (
            <span
              key={n}
              className="text-xs font-semibold text-black/18 hover:text-black/35 transition-colors ease-[cubic-bezier(0.16,1,0.3,1)] cursor-default"
            >
              {n}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

