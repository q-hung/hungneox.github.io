/** Categories used only for locale / tooling — hide from topic listings */
export const META_CATEGORIES = new Set(["vi", "en", "jekyll"]);

export function categorySlug(cat: string): string {
  return cat
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export function normalizeCategories(
  raw: string | string[] | undefined,
): string[] {
  if (!raw) return [];
  const list = Array.isArray(raw) ? raw : [raw];
  return list.map(String);
}

export function postMatchesCategorySlug(
  categories: string | string[] | undefined,
  slug: string,
): boolean {
  return normalizeCategories(categories).some(
    (c) => !META_CATEGORIES.has(c.toLowerCase()) && categorySlug(c) === slug,
  );
}
