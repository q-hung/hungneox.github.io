import { getCollection, type CollectionEntry } from "astro:content";
import {
  normalizeCategories,
  META_CATEGORIES,
  categorySlug,
} from "./categories";

// ── Legacy pagination (kept for /en/2/, /vi/2/ backward-compat) ──

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

export type HomePageProps = {
  data: CollectionEntry<"blog">[];
  currentPage: number;
  lastPage: number;
  url: { prev?: string; next?: string };
};

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

// ── New: categorized home page ──

/** The 4 sections on the homepage, keyed by internal id. */
export const HOMEPAGE_SECTIONS = [
  {
    id: "information-retrieval",
    label: { en: "Information Retrieval", vi: "Truy xuất thông tin" },
    matchCategories: ["information-retrieval"],
    viewAllSlug: "information-retrieval",
    icon: "search",
  },
  {
    id: "systems",
    label: { en: "Systems & Scalability", vi: "Hệ thống & Mở rộng" },
    matchCategories: ["systems"],
    viewAllSlug: "systems",
    icon: "dns",
  },
  {
    id: "programming",
    label: { en: "Advanced Programming", vi: "Lập trình nâng cao" },
    matchCategories: ["programming", "web-backend", "security", "data-science"],
    viewAllSlug: "programming",
    icon: "code",
  },
  {
    id: "lab",
    label: { en: "The Lab (TIL)", vi: "Phòng thí nghiệm (TIL)" },
    matchCategories: ["til", "lab"],
    viewAllSlug: "til",
    icon: "science",
  },
] as const;

export type SectionId = (typeof HOMEPAGE_SECTIONS)[number]["id"];

export interface CategorySection {
  id: string;
  label: string;
  icon: string;
  viewAllHref: string;
  latest: CollectionEntry<"blog"> | null;
  older: CollectionEntry<"blog">[];
  totalCount: number;
}

export interface CategorizedHomePageProps {
  featured: CollectionEntry<"blog"> | null;
  sections: CategorySection[];
}

function postBelongsToSection(
  post: CollectionEntry<"blog">,
  matchCategories: readonly string[],
): boolean {
  const cats = normalizeCategories(post.data.categories);
  return cats.some(
    (c) =>
      !META_CATEGORIES.has(c.toLowerCase()) &&
      matchCategories.includes(categorySlug(c)),
  );
}

/** Estimate reading time in minutes */
export function estimateReadingTime(body: string | undefined): number {
  if (!body) return 1;
  const words = body.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

export async function getCategorizedHomePage(
  lang: "vi" | "en",
): Promise<CategorizedHomePageProps> {
  const allPosts = await getCollection(
    "blog",
    ({ data }) => data.published !== false,
  );
  const sorted = sortedPostsForLang(allPosts, lang);

  // Featured = most recent post overall
  const featured = sorted.length > 0 ? sorted[0] : null;

  // Build sections
  const sections: CategorySection[] = HOMEPAGE_SECTIONS.map((sec) => {
    const matching = sorted.filter((p) =>
      postBelongsToSection(p, sec.matchCategories),
    );

    // Exclude the featured post from section listings to avoid duplication
    const filtered = featured
      ? matching.filter((p) => p.id !== featured.id)
      : matching;

    return {
      id: sec.id,
      label: sec.label[lang],
      icon: sec.icon,
      viewAllHref: `/${lang}/category/${sec.viewAllSlug}/`,
      latest: filtered.length > 0 ? filtered[0] : null,
      older: filtered.slice(1, 5),
      totalCount: matching.length,
    };
  });

  return { featured, sections };
}

// ── Keep old helpers for backward compat (paginated pages) ──

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
