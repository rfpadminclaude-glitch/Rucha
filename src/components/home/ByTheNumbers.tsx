const stats = [
  { value: "80,000+", label: "Residents" },
  { value: "15 sq mi", label: "Land Area" },
  { value: "10+", label: "Parks" },
  { value: "1 of 25", label: "Safest Cities in FL" },
];

export default function ByTheNumbers() {
  return (
    <section
      className="py-16 text-white"
      style={{
        background:
          "linear-gradient(135deg, #052942 0%, #0a3a5c 100%)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-10">
          <div className="text-xs uppercase tracking-widest text-doral-gold font-bold mb-1">
            Our Community
          </div>
          <h2 className="text-3xl md:text-4xl font-bold">
            Doral By The Numbers
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-doral-gold mb-2">
                {s.value}
              </div>
              <div className="uppercase tracking-wider text-sm text-white/80">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
