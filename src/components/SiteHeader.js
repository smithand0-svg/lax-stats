'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { BASE_PATH } from '@/lib/basePath';

// TM-29: site-wide header in SJJ Blue on every page: the logo and
// wordmark (both link home) plus the four-group menu. Groups open as
// dropdowns on wider screens and collapse into one Menu panel on phones.
// Groups and link names live in src/lib/siteNav.js (the homepage reads
// them too).
import { SITE_GROUPS } from '@/lib/siteNav';

export default function SiteHeader() {
  const [open, setOpen] = useState(null); // group label, 'mobile', or null
  const ref = useRef(null);

  // Close any open menu on an outside click or Escape.
  useEffect(() => {
    const onClick = (e) => ref.current && !ref.current.contains(e.target) && setOpen(null);
    const onKey = (e) => e.key === 'Escape' && setOpen(null);
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const linkClass =
    'block px-4 py-2 text-sm text-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sjj-gold';

  return (
    <header ref={ref} className="bg-sjj-blue text-white relative z-30">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sjj-gold">
          <img
            src={`${BASE_PATH}/sjj-logo.png`}
            srcSet={`${BASE_PATH}/sjj-logo.png 1x, ${BASE_PATH}/sjj-logo@2x.png 2x`}
            alt=""
            width={45}
            height={40}
            className="h-10 w-auto"
          />
          <span className="font-varsity text-lg tracking-wide leading-none">SJJ Lacrosse</span>
        </Link>

        <nav aria-label="Main" className="hidden md:flex items-center gap-1">
          {SITE_GROUPS.map((g) => (
            <div key={g.label} className="relative">
              <button
                type="button"
                aria-expanded={open === g.label}
                onClick={() => setOpen(open === g.label ? null : g.label)}
                className={`px-3 py-2 text-sm font-semibold border-b-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sjj-gold ${
                  open === g.label ? 'border-sjj-gold' : 'border-transparent hover:border-white/40'
                }`}
              >
                {g.label}
              </button>
              {open === g.label && (
                <div className="absolute right-0 mt-1 min-w-56 bg-sjj-blue border-t-2 border-sjj-gold shadow-lg py-1">
                  {g.links.map((l) => (
                    <Link key={l.href} href={l.href} className={linkClass} onClick={() => setOpen(null)}>
                      {l.text}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <button
          type="button"
          className="md:hidden px-3 py-2 text-sm font-semibold border border-white/40 rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-sjj-gold"
          aria-expanded={open === 'mobile'}
          onClick={() => setOpen(open === 'mobile' ? null : 'mobile')}
        >
          {open === 'mobile' ? 'Close' : 'Menu'}
        </button>
      </div>

      {open === 'mobile' && (
        <nav aria-label="Main" className="md:hidden border-t border-white/15 pb-3">
          {SITE_GROUPS.map((g) => (
            <div key={g.label} className="px-4 pt-3">
              <p className="text-xs font-semibold text-white/60 px-4 pb-1">{g.label}</p>
              {g.links.map((l) => (
                <Link key={l.href} href={l.href} className={linkClass} onClick={() => setOpen(null)}>
                  {l.text}
                </Link>
              ))}
            </div>
          ))}
        </nav>
      )}
    </header>
  );
}
