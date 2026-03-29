/**
 * Fallback when `PUBLIC_DISQUS_SHORTNAME` is missing at build time (common on CI if
 * repository variables are not set). The shortname is visible in the page source anyway.
 * Prefer setting `PUBLIC_DISQUS_SHORTNAME` in GitHub Actions Variables or `.env` locally.
 */
export const DISQUS_SHORTNAME_FALLBACK = "butchiso89";
