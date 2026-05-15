import Image from "next/image";

export default function Hero() {
  return (
    <section className="relative text-white overflow-hidden">
      <Image
        src="/doral/hero.jpg"
        alt=""
        fill
        priority
        className="object-cover"
        sizes="100vw"
      />
      {/* Dark gradient overlay for legibility */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(120deg, rgba(5,41,66,0.85) 0%, rgba(5,41,66,0.55) 55%, rgba(5,41,66,0.25) 100%)",
        }}
      />
      <div className="relative max-w-7xl mx-auto px-4 py-24 md:py-36">
        <div className="max-w-3xl">
          <div className="inline-block bg-doral-gold text-doral-navy text-xs font-bold uppercase tracking-widest px-3 py-1 rounded mb-4">
            Welcome
          </div>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-4 drop-shadow">
            South Florida&rsquo;s Premier Destination
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mb-8 drop-shadow">
            For Living, Working, Learning, and Thriving. Discover a vibrant,
            safe community in the heart of Florida.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="#services"
              className="px-6 py-3 rounded font-semibold bg-doral-gold text-doral-navy hover:opacity-90 transition"
            >
              City Services
            </a>
            <a
              href="#events"
              className="px-6 py-3 rounded font-semibold bg-white/10 border border-white/30 backdrop-blur hover:bg-white/20 transition"
            >
              Upcoming Events
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
