const stories = [
  {
    title: "Doral Dropped as Future Waste-to-Energy Site!",
    excerpt:
      "After community advocacy, the County has removed Doral from consideration.",
    tag: "Featured",
  },
  {
    title: "A Smarter, Safer School Zone Starts Now!",
    excerpt:
      "New automated enforcement technology launches across Doral school zones.",
    tag: "Safety",
  },
  {
    title: "Emergency Hardship Grant for Families (EHG4F)",
    excerpt:
      "Applications now open for qualifying Doral families facing financial hardship.",
    tag: "Assistance",
  },
  {
    title: "Thank you to all who supported! New Galleries!",
    excerpt: "New community galleries open to the public starting this month.",
    tag: "Culture",
  },
  {
    title: "Call for Performers for Holiday Events!",
    excerpt:
      "Local musicians and performers invited to apply for the 2026 season.",
    tag: "Arts",
  },
  {
    title: "Become a Sponsor! Click to find out more!",
    excerpt:
      "Partner with the City of Doral for upcoming community programming.",
    tag: "Partnership",
  },
];

export default function News() {
  return (
    <section className="py-16 bg-doral-navy text-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="text-xs uppercase tracking-widest text-doral-gold font-bold mb-1">
              Stay Informed
            </div>
            <h2 className="text-3xl md:text-4xl font-bold">News</h2>
          </div>
          <a
            href="#"
            className="text-sm font-semibold text-doral-gold hover:opacity-80 hidden md:inline"
          >
            All news →
          </a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {stories.map((s) => (
            <a
              key={s.title}
              href="#"
              className="bg-white/5 border border-white/10 rounded-lg p-5 hover:bg-white/10 transition group"
            >
              <div className="text-xs uppercase tracking-wider text-doral-gold font-semibold mb-2">
                {s.tag}
              </div>
              <div className="font-bold text-lg mb-2 group-hover:text-doral-gold transition">
                {s.title}
              </div>
              <div className="text-sm text-white/70">{s.excerpt}</div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
