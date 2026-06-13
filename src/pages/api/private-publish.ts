import type { APIRoute } from "astro"
import { promises as fs } from "node:fs"
import path from "node:path"

export const prerender = false

const BLOG_DIR = path.resolve(process.cwd(), "src/content/blog")

const toSlug = (value: string) => {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
}

const escapeYamlValue = (value: string) => {
  return value.replaceAll("\\", String.raw`\\`).replaceAll('"', String.raw`\"`)
}

const asText = (value: unknown) => {
  if (typeof value === "string") return value
  if (typeof value === "number") return String(value)
  if (typeof value === "boolean") return value ? "true" : "false"
  return ""
}

const normalizeTags = (value: unknown) => {
  if (Array.isArray(value)) {
    return value
      .map((tag) => String(tag).trim().toLowerCase())
      .filter(Boolean)
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean)
  }

  return []
}

const buildMarkdown = (data: {
  title: string
  description: string
  author: string
  tags: string[]
  content: string
  pubDate: string
}) => {
  const tagsBlock = data.tags.map((tag) => `  - ${tag}`).join("\n")

  return `---
title: "${escapeYamlValue(data.title)}"
description: "${escapeYamlValue(data.description)}"
pubDate: "${data.pubDate}"
author: "${escapeYamlValue(data.author)}"
tags:
${tagsBlock || "  - blog"}
draft: false
---

${data.content.trim()}\n`
}

export const POST: APIRoute = async ({ request }) => {
  const expectedPassword = import.meta.env.PRIVATE_PUBLISH_PASSWORD

  if (!expectedPassword) {
    return new Response(
      JSON.stringify({ error: "Configura PRIVATE_PUBLISH_PASSWORD en tu entorno." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    )
  }

  let body: Record<string, unknown>

  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return new Response(JSON.stringify({ error: "Body JSON invalido." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  const password = asText(body.password).trim()
  const title = asText(body.title).trim()
  const description = asText(body.description).trim()
  const author = asText(body.author).trim() || "Equipo BYTTES"
  const content = asText(body.content).trim()
  const tags = normalizeTags(body.tags)

  if (!title || !description || !content) {
    return new Response(
      JSON.stringify({ error: "Completa titulo, descripcion y contenido." }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    )
  }

  if (password !== expectedPassword) {
    return new Response(JSON.stringify({ error: "Contrasena invalida." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }

  const slug = toSlug(title)

  if (!slug) {
    return new Response(JSON.stringify({ error: "No se pudo generar un slug valido." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  const outputFile = path.join(BLOG_DIR, `${slug}.md`)

  try {
    await fs.access(outputFile)
    return new Response(JSON.stringify({ error: "Ya existe un articulo con ese slug." }), {
      status: 409,
      headers: { "Content-Type": "application/json" },
    })
  } catch {
    // Archivo no existe, se puede crear.
  }

  const pubDate = new Date().toISOString().slice(0, 10)

  await fs.mkdir(BLOG_DIR, { recursive: true })
  await fs.writeFile(
    outputFile,
    buildMarkdown({ title, description, author, tags, content, pubDate }),
    "utf8"
  )

  return new Response(
    JSON.stringify({
      ok: true,
      slug,
      url: `/blog/${slug}/`,
      file: `src/content/blog/${slug}.md`,
    }),
    {
      status: 201,
      headers: { "Content-Type": "application/json" },
    }
  )
}
