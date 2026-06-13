import { getCollection } from "astro:content"

const escapeXml = (value: string) => {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;")
}

export async function GET({ site }) {
  const posts = await getCollection("blog", ({ data }) => !data.draft)
  const sortedPosts = posts.sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime())

  const siteUrl = (site ?? new URL("https://byttes.com")).toString().replace(/\/$/, "")

  const items = sortedPosts
    .map((post) => {
      const postSlug = post.id.replace(/\.md$/, "")
      const link = `${siteUrl}/blog/${postSlug}/`

      return `<item>
<title>${escapeXml(post.data.title)}</title>
<link>${link}</link>
<guid>${link}</guid>
<description>${escapeXml(post.data.description)}</description>
<pubDate>${post.data.pubDate.toUTCString()}</pubDate>
</item>`
    })
    .join("\n")

  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
<channel>
<title>Blog BYTTES</title>
<link>${siteUrl}</link>
<description>Publicaciones semanales sobre SEO, tecnologia y crecimiento digital</description>
<language>es-CO</language>
${items}
</channel>
</rss>`

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  })
}
