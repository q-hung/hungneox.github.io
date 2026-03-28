import { getCollection, type CollectionEntry } from "astro:content";

export const HOME_PAGE_SIZE = 10;

export function sortedPostsForLang(
  allPosts: CollectionEntry<"blog">[],
  lang: "vi" | "en",
): CollectionEntry<"blog">[] {
  const posts = allPosts.filter(({ id }) => id.startsWith(`${lang}/`));
  posts.sort(
    (a, b) =>
      new Date(b.data.date).getTime() - new Date(a.data.date).getTime(),
  );
  return posts;
}

/** Matches Astro `paginate()` page shape used by the home template */
export type HomePageProps = {
  data: CollectionEntry<"blog">[];
  currentPage: number;
  lastPage: number;
  url: { prev?: string; next?: string };
};

/**
 * Default locale (English): page 1 at `/` (and `/en/` mirror). Page 2+ under `/en/N/`.
 * Vietnamese uses `/vi/`, `/vi/2/`, …
 */
export function makeHomePagination(
  posts: CollectionEntry<"blog">[],
  lang: "vi" | "en",
  currentPage: number,
): HomePageProps {
  const pageSize = HOME_PAGE_SIZE;
  const lastPage = Math.max(1, Math.ceil(posts.length / pageSize));
  const data = posts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const base = `/${lang}/`;
  let prev: string | undefined;
  let next: string | undefined;

  if (lang === "en") {
    if (currentPage > 1) {
      prev = currentPage === 2 ? "/" : `/en/${currentPage - 1}/`;
    }
    if (currentPage < lastPage) {
      next = `/en/${currentPage + 1}/`;
    }
  } else {
    if (currentPage > 1) {
      prev = currentPage === 2 ? base : `${base}${currentPage - 1}/`;
    }
    if (currentPage < lastPage) {
      next = `${base}${currentPage + 1}/`;
    }
  }

  return { data, currentPage, lastPage, url: { prev, next } };
}

export async function getEnHomePageOne(): Promise<HomePageProps> {
  const allPosts = await getCollection(
    "blog",
    ({ data }) => data.published !== false,
  );
  const enPosts = sortedPostsForLang(allPosts, "en");
  return makeHomePagination(enPosts, "en", 1);
}

export async function getViHomePageOne(): Promise<HomePageProps> {
  const allPosts = await getCollection(
    "blog",
    ({ data }) => data.published !== false,
  );
  const viPosts = sortedPostsForLang(allPosts, "vi");
  return makeHomePagination(viPosts, "vi", 1);
}
