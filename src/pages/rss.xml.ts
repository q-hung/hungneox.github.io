import type { APIContext } from 'astro';
import { getRssFeed } from '../lib/rss-feed';

export const prerender = true;

export async function GET(context: APIContext) {
  return getRssFeed(context);
}
