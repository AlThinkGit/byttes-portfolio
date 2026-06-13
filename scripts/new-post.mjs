import fs from "node:fs"
import path from "node:path"

const inputTitle = process.argv.slice(2).join(" ").trim()

if (!inputTitle) {
  console.error("Uso: pnpm new:post \"Titulo del articulo\"")
  process.exit(1)
}

const slug = inputTitle
  .toLowerCase()
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-z0-9\s-]/g, "")
  .trim()
  .replace(/\s+/g, "-")

if (!slug) {
  console.error("No fue posible generar un slug valido con el titulo indicado.")
  process.exit(1)
}

const now = new Date()
const yyyy = now.getUTCFullYear()
const mm = String(now.getUTCMonth() + 1).padStart(2, "0")
const dd = String(now.getUTCDate()).padStart(2, "0")
const today = `${yyyy}-${mm}-${dd}`

const outputDir = path.resolve("src/content/blog")
const outputFile = path.join(outputDir, `${slug}.md`)

if (fs.existsSync(outputFile)) {
  console.error(`Ya existe un articulo con ese slug: ${outputFile}`)
  process.exit(1)
}

fs.mkdirSync(outputDir, { recursive: true })

const template = `---
title: "${inputTitle}"
description: "Resumen del articulo en una sola linea para SEO."
pubDate: "${today}"
author: "Equipo BYTTES"
tags:
  - seo
  - negocio
draft: true
---

Escribe aqui el contenido del articulo.
`

fs.writeFileSync(outputFile, template, "utf8")
console.log(`Articulo creado: ${outputFile}`)
