import { notFound } from 'next/navigation';
import Link from 'next/link';
import { navigationItems } from '@/consts/navigation';
export const dynamicParams = false;
export function generateStaticParams() { return navigationItems.filter(item => item.href !== '/' && item.href !== '/paintings').map(item => ({ section: item.href.slice(1) })); }
export async function generateMetadata({ params }: { params: Promise<{ section: string }> }) { const { section } = await params; return { title: navigationItems.find(item => item.href === `/${section}`)?.label ?? 'Page not found' }; }
export default async function SectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const item = navigationItems.find(item => item.href === `/${section}`);
  if (!item) notFound();
  return <main id="main-content" className="section-placeholder"><h1>{item.label}</h1><p>Coming soon.</p><Link href="/">Back to the table</Link></main>;
}
