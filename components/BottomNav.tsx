"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "타임라인" },
  { href: "/meds", label: "복용약" },
  { href: "/add", label: "+", isAction: true },
  { href: "/quiz", label: "가족문답" },
  { href: "/settings", label: "설정" },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="sticky bottom-0 inset-x-0 bg-white/90 backdrop-blur border-t">
      <div className="mx-auto max-w-md grid grid-cols-5">
        {tabs.map((t) => {
          const active = pathname === t.href || pathname.startsWith(`${t.href}/`);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`py-3 text-center text-xs ${
                t.isAction
                  ? "text-white !text-2xl"
                  : active
                  ? "text-token-accent font-semibold"
                  : "text-token-text-secondary"
              }`}
            >
              {t.isAction ? (
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-token-accent shadow-md">
                  {t.label}
                </span>
              ) : (
                t.label
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
