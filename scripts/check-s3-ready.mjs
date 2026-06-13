#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

console.log('🔍 Analizando proyecto para S3...\n');

// Verificar estructura
const checks = [
  {
    name: 'Configuración Astro',
    check: () => {
      const config = fs.readFileSync(path.join(projectRoot, 'astro.config.mjs'), 'utf8');
      const hasStatic = config.includes("output: 'static'");
      return hasStatic ? '✅' : '❌ Cambiar a output: static';
    }
  },
  {
    name: 'Directorio dist existe',
    check: () => {
      return fs.existsSync(path.join(projectRoot, 'dist')) ? '✅' : '❌ Ejecuta: pnpm build';
    }
  },
  {
    name: 'Variables de entorno (.env)',
    check: () => {
      return fs.existsSync(path.join(projectRoot, '.env')) ? '✅' : '⚠️  Crea .env con variables AWS';
    }
  },
  {
    name: 'package.json con scripts',
    check: () => {
      const pkg = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
      return pkg.scripts.build ? '✅' : '❌ Script build faltante';
    }
  }
];

let allGood = true;
checks.forEach(({ name, check }) => {
  const result = check();
  console.log(`${result} ${name}`);
  if (result.includes('❌')) allGood = false;
});

console.log('\n📋 Checklist de deployment:\n');

const checklist = [
  '1. Crear bucket en S3 (nombre: tu-dominio-nombre)',
  '2. Habilitar "Static website hosting" en el bucket',
  '3. Configurar política de bucket para acceso público',
  '4. (Opcional) Crear distribución CloudFront',
  '5. Instalar AWS SDK: pnpm add -D @aws-sdk/client-s3 @aws-sdk/client-cloudfront mime-types',
  '6. Configurar credenciales AWS (AWS CLI o variables de entorno)',
  '7. Crear archivo .env con variables AWS',
  '8. Ejecutar: pnpm build',
  '9. Ejecutar: pnpm run deploy'
];

checklist.forEach(item => console.log(`   ${item}`));

if (!allGood) {
  console.log('\n⚠️  Hay problemas que necesitan ser resueltos');
  process.exit(1);
}

console.log('\n✅ Proyecto listo para S3!');
