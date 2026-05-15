const services = [
  {
    title: "Building Department",
    icon: "🏗️",
    desc: "Permits, inspections, and construction information.",
  },
  {
    title: "Self-Service Portal",
    icon: "💻",
    desc: "Pay, apply, and track requests online.",
  },
  {
    title: "Info Doral",
    icon: "ℹ️",
    desc: "Report a concern or request city service.",
  },
  {
    title: "Doral Police",
    icon: "🚓",
    desc: "Public safety, crime mapping, and reporting.",
  },
  {
    title: "Park Rentals",
    icon: "🌳",
    desc: "Reserve pavilions, fields, and facilities.",
  },
  {
    title: "Trolley Service",
    icon: "🚎",
    desc: "Free Doral Trolley routes and schedules.",
  },
];

export default function TopServices() {
  return (
    <section id="services" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="text-xs uppercase tracking-widest text-doral-gold font-bold mb-1">
              Most Visited
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-doral-navy">
              Top Services
            </h2>
          </div>
          <a
            href="#"
            className="text-sm font-semibold text-doral-navy hover:text-doral-slate hidden md:inline"
          >
            See all services →
          </a>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {services.map((s) => (
            <a
              key={s.title}
              href="#"
              className="group p-4 rounded-lg border border-gray-200 hover:border-doral-navy hover:shadow-lg transition bg-white flex flex-col items-center text-center"
            >
              <div className="text-4xl mb-3">{s.icon}</div>
              <div className="font-semibold text-doral-navy group-hover:text-doral-slate text-sm">
                {s.title}
              </div>
              <div className="text-xs text-gray-500 mt-1 hidden lg:block">
                {s.desc}
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
