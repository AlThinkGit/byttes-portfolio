#!/usr/bin/env node

import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { CloudFrontClient, CreateInvalidationCommand } from '@aws-sdk/client-cloudfront';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mime from 'mime-types';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');

// Configuración desde variables de entorno
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const S3_BUCKET = process.env.S3_BUCKET;
const CLOUDFRONT_DISTRIBUTION_ID = process.env.CLOUDFRONT_DISTRIBUTION_ID;

if (!S3_BUCKET) {
  console.error('❌ Error: Variable de entorno S3_BUCKET no definida');
  process.exit(1);
}

if (!fs.existsSync(distDir)) {
  console.error(`❌ Error: Directorio de build no encontrado: ${distDir}`);
  console.error('Ejecuta primero: pnpm build');
  process.exit(1);
}

// Inicializar clientes de AWS
const s3Client = new S3Client({ region: AWS_REGION });
const cloudFrontClient = CLOUDFRONT_DISTRIBUTION_ID ? new CloudFrontClient({ region: AWS_REGION }) : null;

// Mapeo de tipos de archivo para cache headers
const cacheControl = {
  '.html': 'public, max-age=3600', // 1 hora
  '.xml': 'public, max-age=3600',
  '.json': 'public, max-age=3600',
  '.css': 'public, max-age=31536000, immutable', // 1 año
  '.js': 'public, max-age=31536000, immutable',
  '.woff': 'public, max-age=31536000, immutable',
  '.woff2': 'public, max-age=31536000, immutable',
  '.ttf': 'public, max-age=31536000, immutable',
  '.eot': 'public, max-age=31536000, immutable',
  '.svg': 'public, max-age=31536000, immutable',
  '.png': 'public, max-age=31536000, immutable',
  '.jpg': 'public, max-age=31536000, immutable',
  '.jpeg': 'public, max-age=31536000, immutable',
  '.gif': 'public, max-age=31536000, immutable',
  '.webp': 'public, max-age=31536000, immutable',
  '.ico': 'public, max-age=31536000, immutable'
};

async function uploadFile(s3Path, filePath) {
  const fileContent = fs.readFileSync(filePath);
  const ext = path.extname(filePath);
  const contentType = mime.lookup(filePath) || 'application/octet-stream';
  const cacheControlValue = cacheControl[ext] || 'public, max-age=3600';

  try {
    await s3Client.send(new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: s3Path,
      Body: fileContent,
      ContentType: contentType,
      CacheControl: cacheControlValue,
      Metadata: {
        'uploaded': new Date().toISOString()
      }
    }));
    console.log(`✅ ${s3Path}`);
  } catch (error) {
    console.error(`❌ Error al subir ${s3Path}:`, error.message);
    throw error;
  }
}

async function getExistingFiles() {
  const files = new Set();
  let continuationToken;

  try {
    do {
      const response = await s3Client.send(new ListObjectsV2Command({
        Bucket: S3_BUCKET,
        ContinuationToken: continuationToken
      }));

      if (response.Contents) {
        response.Contents.forEach(obj => {
          files.add(obj.Key);
        });
      }

      continuationToken = response.NextContinuationToken;
    } while (continuationToken);
  } catch (error) {
    console.warn('⚠️  No se pudieron listar archivos existentes:', error.message);
  }

  return files;
}

async function deleteOldFiles(existingFiles, newFiles) {
  const filesToDelete = Array.from(existingFiles).filter(file => !newFiles.has(file));
  
  if (filesToDelete.length === 0) return;

  console.log(`\n🗑️  Eliminando ${filesToDelete.length} archivos antiguos...`);

  for (const file of filesToDelete) {
    try {
      await s3Client.send(new DeleteObjectCommand({
        Bucket: S3_BUCKET,
        Key: file
      }));
      console.log(`✅ Eliminado: ${file}`);
    } catch (error) {
      console.error(`❌ Error al eliminar ${file}:`, error.message);
    }
  }
}

async function invalidateCloudFront(paths) {
  if (!cloudFrontClient || !CLOUDFRONT_DISTRIBUTION_ID) return;

  console.log(`\n🔄 Invalidando CloudFront...`);

  try {
    await cloudFrontClient.send(new CreateInvalidationCommand({
      DistributionId: CLOUDFRONT_DISTRIBUTION_ID,
      InvalidationBatch: {
        Paths: {
          Quantity: paths.length,
          Items: paths
        },
        CallerReference: Date.now().toString()
      }
    }));
    console.log('✅ CloudFront invalidado');
  } catch (error) {
    console.error('❌ Error al invalidar CloudFront:', error.message);
  }
}

async function deployToS3() {
  console.log(`🚀 Iniciando deploy a S3 (${S3_BUCKET})...\n`);

  const files = new Map();
  const newFiles = new Set();

  // Recolectar todos los archivos del dist
  const walkDir = (dir, basePrefix = '') => {
    const items = fs.readdirSync(dir);
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const s3Path = path.join(basePrefix, item).replaceAll('\\', '/');

      if (fs.statSync(fullPath).isDirectory()) {
        walkDir(fullPath, s3Path);
      } else {
        files.set(s3Path, fullPath);
        newFiles.add(s3Path);
      }
    });
  };

  walkDir(distDir);

  console.log(`📁 Encontrados ${files.size} archivos para subir...\n`);

  // Subir archivos
  for (const [s3Path, filePath] of files.entries()) {
    await uploadFile(s3Path, filePath);
  }

  // Eliminar archivos antiguos
  const existingFiles = await getExistingFiles();
  await deleteOldFiles(existingFiles, newFiles);

  // Invalidar CloudFront
  if (cloudFrontClient) {
    const invalidationPaths = Array.from(newFiles).map(path => `/${path}`);
    await invalidateCloudFront(invalidationPaths);
  }

  console.log(`\n✨ ¡Deploy completado exitosamente!`);
  console.log(`📍 URL: https://${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/`);
  if (CLOUDFRONT_DISTRIBUTION_ID) {
    console.log(`🌐 CloudFront Distribution: ${CLOUDFRONT_DISTRIBUTION_ID}`);
  }
}

// Ejecutar deploy
try {
  await deployToS3();
} catch (error) {
  console.error('\n❌ Error fatal:', error);
  process.exit(1);
}
