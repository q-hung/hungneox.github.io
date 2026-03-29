import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';

/** Shared RSS builder for `/feed.xml` (and any alias routes). */
export async function getRssFeed(context: APIContext) {
  const blog = await getCollection('blog', ({ data }) => data.published !== false);

  const sorted = blog.sort(
    (a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime(),
  );

  const site = context.site ?? new URL('https://butchiso.com');

  const items = sorted.map((post) => {
    const parts = post.id.split('/');
    const lang = parts[0];
    const slug = parts.slice(1).join('/');
    const path = `/${lang}/blog/${slug}/`;
    let pubDate = post.data.date ? new Date(post.data.date) : new Date();
    if (Number.isNaN(pubDate.getTime())) {
      pubDate = new Date();
    }

    return {
      title: post.data.title || 'Untitled',
      pubDate,
      link: new URL(path, site).href,
      ...(post.data.description != null && post.data.description !== ''
        ? { description: post.data.description }
        : {}),
    };
  });

  return rss({
    title: 'Q-Hung Blog',
    description: 'Software Engineer | Coffee lover',
    site,
    items,
    customData: `<language>en-us</language>`,
  });
}
