"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/faqs", label: "FAQs" },
  { href: "/admin/announcements", label: "Announcements" },
  { href: "/admin/service-requests", label: "Service requests" },
  { href: "/admin/conversations", label: "Conversations" },
  { href: "/admin/sources", label: "Sources" },
];

export default function AdminNav() {
  const path = usePathname() ?? "";
  return (
    <nav className="flex-1 p-2 space-y-1">
      {NAV.map((item) => {
        const active = item.exact ? path === item.href : path.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`block px-3 py-2 rounded text-sm ${
              active
                ? "bg-doral-gold text-doral-navy font-semibold"
                : "text-white/85 hover:bg-white/10"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
