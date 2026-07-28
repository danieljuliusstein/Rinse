import { SECTIONS, scrollToSection } from "../shared/scroll";

export const FOOTER_LINKS: Record<
  string,
  { label: string; href?: string; action?: "scroll" | "mailto" }[]
> = {
  Product: [
    { label: "Features", action: "scroll", href: SECTIONS.features },
    { label: "Pricing", action: "scroll", href: SECTIONS.pricing },
    { label: "Changelog", href: "https://rinse.app/changelog" },
    { label: "Roadmap", href: "https://rinse.app/roadmap" },
    { label: "Status", href: "https://status.rinse.app" },
  ],
  Company: [
    { label: "About", href: "https://rinse.app/about" },
    { label: "Blog", href: "https://rinse.app/blog" },
    { label: "Careers", href: "https://rinse.app/careers" },
    { label: "Press", href: "mailto:press@rinse.app" },
    { label: "Contact", href: "mailto:hello@rinse.app" },
  ],
  Resources: [
    { label: "Documentation", href: "https://docs.rinse.app" },
    { label: "API Reference", href: "https://docs.rinse.app/api" },
    { label: "Community", href: "https://community.rinse.app" },
    { label: "Templates", href: "https://rinse.app/templates" },
    { label: "Integrations", href: "https://rinse.app/integrations" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "https://rinse.app/privacy" },
    { label: "Terms of Service", href: "https://rinse.app/terms" },
    { label: "Cookie Policy", href: "https://rinse.app/cookies" },
    { label: "GDPR", href: "https://rinse.app/gdpr" },
  ],
};

export function Footer() {
  const handleFooterClick = (link: {
    label: string;
    href?: string;
    action?: "scroll" | "mailto";
  }) => {
    if (link.action === "scroll" && link.href) {
      scrollToSection(link.href);
      return;
    }
    if (link.href) {
      window.open(
        link.href,
        link.href.startsWith("mailto:") ? "_self" : "_blank",
        "noopener,noreferrer",
      );
    }
  };

  return (
    <footer className="border-t border-black/6 px-6 lg:px-12 py-16">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-16">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="flex items-center mb-4 hover:opacity-80 transition-opacity"
            >
              <img src={rinseLogo} alt="Rinse" className="h-6 w-auto" />
            </button>
            <p className="text-xs text-black/30 leading-relaxed max-w-[160px]">
              The operating system for mobile detailing professionals.
            </p>
          </div>

          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <div className="text-[10px] font-mono text-black/25 uppercase tracking-widest mb-4">
                {title}
              </div>
              <div className="space-y-2.5">
                {links.map((link) => (
                  <button
                    key={link.label}
                    onClick={() => handleFooterClick(link)}
                    className="block text-xs text-black/35 hover:text-black/70 transition-colors ease-[cubic-bezier(0.16,1,0.3,1)] text-left"
                  >
                    {link.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-black/5">
          <div className="text-[11px] font-mono text-black/20">
            © 2025 Rinse Technologies, Inc. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            {[
              { label: "Twitter", href: "https://twitter.com/rinseapp" },
              {
                label: "LinkedIn",
                href: "https://linkedin.com/company/rinseapp",
              },
              { label: "GitHub", href: "https://github.com/rinseapp" },
            ].map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-mono text-black/20 hover:text-black/50 transition-colors ease-[cubic-bezier(0.16,1,0.3,1)]"
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

