const items = [
  { label: "Pay my Business Tax Receipt", href: "#" },
  { label: "Apply for a building permit", href: "#" },
  { label: "Report a pothole or issue", href: "#" },
  { label: "Reserve a park or pavilion", href: "#" },
  { label: "Register for a city program", href: "#" },
  { label: "Find an event or meeting", href: "#" },
  { label: "Contact my Council Member", href: "#" },
  { label: "Access agendas & minutes", href: "#" },
];

export default function IWantTo() {
  return (
    <section className="py-16 bg-doral-cream">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <div className="text-xs uppercase tracking-widest text-doral-slate font-bold mb-1">
            Quick Actions
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-doral-navy">
            I Want To...
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {items.map((it) => (
            <a
              key={it.label}
              href={it.href}
              className="bg-white border-l-4 border-doral-gold p-4 rounded shadow-sm hover:shadow-md hover:border-doral-navy transition flex items-center justify-between"
            >
              <span className="text-sm font-medium text-doral-navy">
                {it.label}
              </span>
              <span className="text-doral-gold text-lg">→</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
