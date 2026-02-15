import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://getbooth.io';
  const lastModified = new Date();

  // Marketing pages with high priority
  const marketingPages = [
    { url: '', priority: 1.0 },
    { url: '/about', priority: 0.8 },
    { url: '/contact', priority: 0.8 },
    { url: '/security', priority: 0.7 },
    { url: '/features', priority: 0.9 },
    { url: '/features/ai', priority: 0.8 },
    { url: '/features/booth-mode', priority: 0.8 },
    { url: '/features/templates', priority: 0.8 },
    { url: '/features/notifications', priority: 0.8 },
    { url: '/features/calendar', priority: 0.8 },
    { url: '/features/budget', priority: 0.8 },
    { url: '/features/team', priority: 0.8 },
    { url: '/features/logistics', priority: 0.8 },
  ];

  // Legal pages with lower priority
  const legalPages = [
    { url: '/privacy', priority: 0.3 },
    { url: '/terms', priority: 0.3 },
    { url: '/ccpa', priority: 0.3 },
  ];

  // Auth pages (lower priority, but still indexable)
  const authPages = [
    { url: '/auth/login', priority: 0.5 },
    { url: '/auth/signup', priority: 0.6 },
  ];

  const allPages = [...marketingPages, ...legalPages, ...authPages];

  return allPages.map((page) => ({
    url: `${baseUrl}${page.url}`,
    lastModified,
    changeFrequency: page.priority >= 0.8 ? 'weekly' : 'monthly',
    priority: page.priority,
  }));
}
