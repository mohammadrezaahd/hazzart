'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getPublicPortfolio, type PublicPortfolioResponse } from '@/components/api/public';

export function ContactExperience() {
  const [data, setData] = useState<PublicPortfolioResponse | null>(null);

  useEffect(() => {
    void getPublicPortfolio().then(setData).catch(() => setData(null));
  }, []);

  if (!data) {
    return <main className="contact-experience" id="main-content"><section className="contact-content"><h1 className="contact-title">Contact</h1><p>Loading…</p></section></main>;
  }

  const paragraphs = data.contact.split(/\n\s*\n|\n/).map((text) => text.trim()).filter(Boolean);

  return (
    <main className="contact-experience" id="main-content">
      <section className="contact-content" aria-labelledby="contact-title">
        <h1 id="contact-title" className="contact-title">Contact</h1>
        <div className="contact-body">
          {paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
        </div>
      </section>

      <footer className="contact-socials">
        <span className="contact-socials-label">Me, Elsewhere:</span>
        <div className="contact-socials-list">
          {data.socials.map((social) => (
            <Link key={social.id} href={social.url} target="_blank" rel="noreferrer" aria-label={social.name} className="contact-social-link">
              <span className="contact-social-svg" aria-hidden="true" dangerouslySetInnerHTML={{ __html: social.iconSvg }} />
            </Link>
          ))}
        </div>
      </footer>
    </main>
  );
}
