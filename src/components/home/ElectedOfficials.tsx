import Image from "next/image";

const officials = [
  {
    name: "Cristi Fraga",
    title: "Mayor",
    img: "/doral/officials/mayor-cristi-fraga.jpg",
  },
  {
    name: "Maureen Porras",
    title: "Vice Mayor",
    img: "/doral/officials/maureen-porras.jpg",
  },
  {
    name: "Digna Cabral",
    title: "Councilwoman",
    img: "/doral/officials/digna-cabral.jpg",
  },
  {
    name: "Rafael Pineyro",
    title: "Councilman",
    img: "/doral/officials/rafael-pineyro.jpg",
  },
  {
    name: "Nicole Reinoso",
    title: "Councilwoman",
    img: "/doral/officials/nicole-reinoso.jpg",
  },
];

export default function ElectedOfficials() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-10">
          <div className="text-xs uppercase tracking-widest text-doral-gold font-bold mb-1">
            Your Voice
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-doral-navy">
            Elected Officials
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {officials.map((o) => (
            <a
              key={o.name}
              href="#"
              className="flex flex-col items-center text-center group"
            >
              <div className="relative h-28 w-28 rounded-full overflow-hidden mb-3 border-4 border-doral-gold shadow-md group-hover:scale-105 transition">
                <Image
                  src={o.img}
                  alt={`${o.title} ${o.name}`}
                  fill
                  sizes="112px"
                  className="object-cover"
                />
              </div>
              <div className="font-semibold text-doral-navy text-sm">
                {o.name}
              </div>
              <div className="text-xs text-gray-500">{o.title}</div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
