export default function Footer() {
  return (
    <footer className="bg-doral-navy text-white border-t-4 border-doral-gold">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <div className="font-bold text-lg mb-3">Contact Us</div>
          <div className="text-sm text-white/80 space-y-1">
            <div>City of Doral</div>
            <div>8401 NW 53rd Terrace</div>
            <div>Doral, FL 33166</div>
            <div className="pt-2">Phone: 305-593-6725</div>
            <div>Email: info@cityofdoral.com</div>
          </div>
        </div>

        <div>
          <div className="font-bold text-lg mb-3">Quick Links</div>
          <ul className="text-sm text-white/80 space-y-1">
            <li>
              <a href="#" className="hover:text-doral-gold">
                Agendas &amp; Minutes
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-doral-gold">
                Bids &amp; Procurement
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-doral-gold">
                Code of Ordinances
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-doral-gold">
                Public Records
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-doral-gold">
                Accessibility
              </a>
            </li>
          </ul>
        </div>

        <div>
          <div className="font-bold text-lg mb-3">Get Involved</div>
          <ul className="text-sm text-white/80 space-y-1">
            <li>
              <a href="#" className="hover:text-doral-gold">
                Boards &amp; Committees
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-doral-gold">
                Volunteer
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-doral-gold">
                Citizens Government Academy
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-doral-gold">
                Employment
              </a>
            </li>
          </ul>
        </div>

        <div>
          <div className="font-bold text-lg mb-3">Share &amp; Connect</div>
          <div className="flex gap-3 mb-4">
            <a
              href="#"
              aria-label="Facebook"
              className="h-9 w-9 rounded-full bg-white/10 hover:bg-doral-gold hover:text-doral-navy flex items-center justify-center transition"
            >
              f
            </a>
            <a
              href="#"
              aria-label="X / Twitter"
              className="h-9 w-9 rounded-full bg-white/10 hover:bg-doral-gold hover:text-doral-navy flex items-center justify-center transition"
            >
              X
            </a>
            <a
              href="#"
              aria-label="Instagram"
              className="h-9 w-9 rounded-full bg-white/10 hover:bg-doral-gold hover:text-doral-navy flex items-center justify-center transition"
            >
              ig
            </a>
            <a
              href="#"
              aria-label="YouTube"
              className="h-9 w-9 rounded-full bg-white/10 hover:bg-doral-gold hover:text-doral-navy flex items-center justify-center transition"
            >
              ▶
            </a>
          </div>
          <div className="text-xs text-white/60">
            Subscribe to the newsletter and stay up to date with city news.
          </div>
        </div>
      </div>

      <div className="bg-doral-navy border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 text-xs text-white/60 flex flex-wrap items-center justify-between gap-2">
          <div>
            &copy; {new Date().getFullYear()} City of Doral. All rights reserved.
          </div>
          <div className="flex gap-4">
            <a href="#" className="hover:text-doral-gold">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-doral-gold">
              Terms of Use
            </a>
            <a href="#" className="hover:text-doral-gold">
              Sitemap
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
