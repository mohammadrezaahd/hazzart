'use client';

import Image from 'next/image';
import Link from 'next/link';

const socials = [
  { id: 'instagram', label: 'Instagram', icon: '/icons/instagram-logo-thin-svgrepo-com.svg' },
  { id: 'behance', label: 'Behance', icon: '/icons/behance-svgrepo-com.svg' },
  { id: 'linkedin', label: 'LinkedIn', icon: '/icons/linkedin-logo-thin-svgrepo-com.svg' },
  { id: 'tiktok', label: 'TikTok', icon: '/icons/tiktok-logo-thin-svgrepo-com.svg' },
  { id: 'artstation', label: 'ArtStation', icon: '/icons/artstation.svg' },
];

export function ContactExperience() {
  return (
    <main className="contact-experience" id="main-content">
      <section className="contact-content" aria-labelledby="contact-title">
        <h1 id="contact-title" className="contact-title">Contact</h1>

        <div className="contact-body">
          <p>
            If you are a gallery, curator, or creative looking to collaborate on an exhibition or a project,
            {' '}I’d be happy to hear from you. you can reach me at:
          </p>
          <p>
            <a className="contact-email" href="mailto:GhazalShafiei@Gmail.com">
              GhazalShafiei@Gmail.com
            </a>
          </p>
          <p>Please Allow a few time for me to get back to you.</p>
        </div>
      </section>

      <Image
        className="contact-artstation-mark"
        src="/icons/artstation.svg"
        alt=""
        width={2500}
        height={2500}
        aria-hidden="true"
      />

      <footer className="contact-socials">
        <span className="contact-socials-label">Me, Elsewhere:</span>
        <div className="contact-socials-list">
          {socials.map((social) => (
            <Link
              key={social.id}
              href="#"
              aria-label={social.label}
              className="contact-social-link"
              onClick={(event) => event.preventDefault()}
            >
              <Image src={social.icon} alt="" width={35} height={35} />
            </Link>
          ))}
        </div>
      </footer>
    </main>
  );
}
