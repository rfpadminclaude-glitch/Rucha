import Image from "next/image";
import Link from "next/link";

const utilityLinks = [
  { label: "Newsletter", href: "#" },
  { label: "Quick Pay", href: "#" },
  { label: "Calendar", href: "#" },
  { label: "Contact", href: "#" },
  { label: "Translate", href: "#" },
];

const primaryNav = [
  { label: "Government", href: "#" },
  { label: "Departments", href: "#" },
  { label: "Services", href: "#" },
  { label: "Residents", href: "#" },
  { label: "Business", href: "#" },
  { label: "Visit Doral", href: "#" },
  { label: "How Do I...", href: "#" },
];

export default function Header() {
  return (
    <header className="w-full">
      {/* Utility bar */}
      <div className="bg-doral-slate text-white text-xs">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="opacity-80">City of Doral, Florida</span>
          </div>
          <div className="flex items-center gap-4">
            {utilityLinks.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="hover:text-doral-gold transition"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="bg-doral-navy text-white">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3" aria-label="City of Doral home">
            <Image
              src="/doral/logo.png"
              alt="City of Doral"
              width={180}
              height={64}
              className="h-14 w-auto"
              priority
            />
          </Link>

          <div className="hidden md:flex items-center gap-3">
            <div className="relative">
              <input
                type="search"
                placeholder="Search the site…"
                className="bg-white/10 border border-white/20 rounded px-3 py-1.5 text-sm placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-doral-gold w-64"
              />
            </div>
            <div className="flex gap-1 text-xs">
              <button className="px-2 py-1 rounded bg-doral-gold text-doral-navy font-semibold">
                EN
              </button>
              <button className="px-2 py-1 rounded bg-white/10 hover:bg-white/20">
                ES
              </button>
            </div>
          </div>
        </div>

        {/* Primary nav */}
        <nav className="bg-doral-navy/95 border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 flex items-center overflow-x-auto">
            {primaryNav.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="px-4 py-3 text-sm font-semibold uppercase tracking-wide hover:bg-doral-gold hover:text-doral-navy transition whitespace-nowrap"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
}
