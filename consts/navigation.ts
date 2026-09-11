import type { FooterItem, NavigationItem } from '@/interfaces/Portfolio';

export const navigationItems: NavigationItem[] = [
  { id: 'table', label: 'Table', href: '/', icon: '/icons/table.svg' },
  { id: 'paintings', label: 'Paintings', href: '/paintings' },
  { id: 'projects', label: 'Projects', href: '/projects' },
  { id: 'artist-cv', label: 'Artist CV', href: '/artist-cv' },
  { id: 'portfolio', label: 'Portfolio', href: '/portfolio' },
  { id: 'contact', label: 'Contact', href: '/contact' },
];
export const footerItems: FooterItem[] = [
  { id: 'random', label: 'Random' },
  { id: 'recent', label: 'Recent' },
  { id: 'yearly', label: 'Yearly' },
  { id: 'medium', label: 'Medium' },
];
