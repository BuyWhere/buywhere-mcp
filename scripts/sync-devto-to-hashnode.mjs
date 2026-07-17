import { access, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const DEFAULT_DEVTO_USERNAME = "buywhere";
const DEFAULT_HASHNODE_DOMAIN = "buywhere.hashnode.dev";
const DEFAULT_PUBLISHED_AFTER = "2026-05-29T00:00:00Z";
const MAX_NEW_POSTS_PER_RUN = parsePositiveInt(process.env.MAX_NEW_POSTS_PER_RUN, 10);
const PER_PAGE = 100;

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function env(name, fallback) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    return fallback;
  }

  return value.trim();
}

function sanitizeFrontmatterValue(value) {
  return String(value ?? "")
    .replace(/\r/g, " ")
    .replace(/\n+/g, " ")
    .replace(/"/g, '\\"')
    .trim();
}

function stripLeadingFrontmatter(markdown) {
  if (!markdown.startsWith("---")) {
    return markdown;
  }

  const lines = markdown.split("\n");
  let closingIndex = -1;

  for (let index = 1; index < lines.length; index += 1) {
    if (lines[index].trim() === "---") {
      closingIndex = index;
      break;
    }
  }

  if (closingIndex === -1) {
    return markdown;
  }

  return lines.slice(closingIndex + 1).join("\n").replace(/^\s+/, "");
}

function slugifyFallback(input) {
  return String(input ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function buildOutputPath(article) {
  const slug = slugifyFallback(article.slug || article.title || `article-${article.id}`);
  return path.join(repoRoot, `hashnode-post-${article.id}-${slug}.md`);
}

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return false;
    }

    throw error;
  }
}

async function fetchJson(url, headers = {}) {
  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      "user-agent": "buywhere-devto-hashnode-sync/1.0",
      ...headers,
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed for ${url}: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function fetchPublishedArticles() {
  const devtoApiKey = env("DEVTO_API_KEY", "");

  if (devtoApiKey) {
    const articles = await fetchJson("https://dev.to/api/articles/me/all?per_page=1000", {
      "api-key": devtoApiKey,
    });

    return articles.filter((article) => article.published);
  }

  const username = env("DEVTO_USERNAME", DEFAULT_DEVTO_USERNAME);
  const collected = [];

  for (let page = 1; page <= 10; page += 1) {
    const url =
      `https://dev.to/api/articles?username=${encodeURIComponent(username)}` +
      `&page=${page}&per_page=${PER_PAGE}`;
    const pageResults = await fetchJson(url);

    if (!Array.isArray(pageResults) || pageResults.length === 0) {
      break;
    }

    collected.push(...pageResults);

    if (pageResults.length < PER_PAGE) {
      break;
    }
  }

  return collected;
}

function buildFrontmatter(article, publicationDomain) {
  const title = sanitizeFrontmatterValue(article.title);
  const slug = sanitizeFrontmatterValue(article.slug || slugifyFallback(article.title));
  const tags = Array.isArray(article.tag_list)
    ? article.tag_list
        .map((tag) => slugifyFallback(tag))
        .filter(Boolean)
        .slice(0, 5)
        .join(", ")
    : "";
  const description = sanitizeFrontmatterValue(article.description);
  const canonicalUrl = sanitizeFrontmatterValue(article.url);
  const normalizedTags = tags || "programming";

  const lines = [
    "---",
    `title: "${title}"`,
    `slug: "${slug}"`,
    `tags: "${normalizedTags}"`,
    `domain: "${sanitizeFrontmatterValue(publicationDomain)}"`,
    `canonical: "${canonicalUrl}"`,
    "enableToc: true",
  ];

  if (description) {
    lines.push(`subtitle: "${description}"`);
    lines.push(`seoTitle: "${title}"`);
    lines.push(`seoDescription: "${description}"`);
  }

  lines.push("---", "");

  return lines.join("\n");
}

async function readExistingContents(outputPath) {
  try {
    return await readFile(outputPath, "utf8");
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

async function main() {
  const publicationDomain = env("HASHNODE_PUBLICATION_DOMAIN", DEFAULT_HASHNODE_DOMAIN);
  const publishedAfter = new Date(env("DEVTO_SYNC_PUBLISHED_AFTER", DEFAULT_PUBLISHED_AFTER));

  if (Number.isNaN(publishedAfter.getTime())) {
    throw new Error("DEVTO_SYNC_PUBLISHED_AFTER must be a valid ISO-8601 datetime.");
  }

  const publishedArticles = await fetchPublishedArticles();
  const candidates = publishedArticles
    .filter((article) => article.published)
    .filter((article) => article.published_timestamp || article.published_at)
    .map((article) => ({
      ...article,
      publishedAt: new Date(article.published_timestamp || article.published_at),
    }))
    .filter((article) => !Number.isNaN(article.publishedAt.getTime()))
    .filter((article) => article.publishedAt >= publishedAfter)
    .sort((left, right) => left.publishedAt.getTime() - right.publishedAt.getTime());

  let newFilesCreated = 0;
  let filesUpdated = 0;

  for (const article of candidates) {
    const outputPath = buildOutputPath(article);
    const alreadyExists = await fileExists(outputPath);

    if (!alreadyExists && newFilesCreated >= MAX_NEW_POSTS_PER_RUN) {
      continue;
    }

    const frontmatter = buildFrontmatter(article, publicationDomain);
    const body = stripLeadingFrontmatter(article.body_markdown || "").trim();
    const nextContents = `${frontmatter}${body}\n`;
    const previousContents = await readExistingContents(outputPath);

    if (previousContents === nextContents) {
      continue;
    }

    await writeFile(outputPath, nextContents);

    if (alreadyExists) {
      filesUpdated += 1;
    } else {
      newFilesCreated += 1;
    }
  }

  console.log(
    JSON.stringify(
      {
        scannedPublishedArticles: publishedArticles.length,
        eligibleAfterCutoff: candidates.length,
        newFilesCreated,
        filesUpdated,
        publicationDomain,
        publishedAfter: publishedAfter.toISOString(),
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
