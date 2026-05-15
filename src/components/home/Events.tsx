const events = [
  { date: "Jan 1", title: "New Year's Day", tag: "Closure" },
  { date: "Jan 8", title: "Doral Cast and Connect", tag: "Community" },
  {
    date: "Jan 12",
    title: "Emergency Hardship Grant: In-Person Assistance",
    tag: "Assistance",
  },
  { date: "Jan 15", title: "Full Moon Yoga", tag: "Recreation" },
  {
    date: "Jan 18",
    title: "Military Affairs Committee Meeting",
    tag: "Meeting",
  },
  { date: "Jan 22", title: "Trip: Everglades Holiday Park", tag: "Trip" },
];

export default function Events() {
  return (
    <section id="events" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="text-xs uppercase tracking-widest text-doral-gold font-bold mb-1">
              What&rsquo;s Happening
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-doral-navy">
              Events &amp; Meetings
            </h2>
          </div>
          <a
            href="#"
            className="text-sm font-semibold text-doral-navy hover:text-doral-slate hidden md:inline"
          >
            Full calendar →
          </a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((e) => (
            <a
              key={e.title}
              href="#"
              className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition group"
            >
              <div className="flex">
                <div className="bg-doral-navy text-white p-4 w-24 flex-shrink-0 text-center flex flex-col justify-center">
                  <div className="text-xs uppercase tracking-wider text-doral-gold">
                    {e.date.split(" ")[0]}
                  </div>
                  <div className="text-2xl font-bold">{e.date.split(" ")[1]}</div>
                </div>
                <div className="p-4 flex-1">
                  <div className="text-xs uppercase tracking-wider text-doral-gold font-semibold mb-1">
                    {e.tag}
                  </div>
                  <div className="font-semibold text-doral-navy group-hover:text-doral-slate text-sm">
                    {e.title}
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
