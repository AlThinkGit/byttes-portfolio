#!/bin/bash
# Quick Reference - Comandos para S3 Deployment

# ============================================
# PREPARACIÓN INICIAL (Una sola vez)
# ============================================

# 1. Instalar dependencias
pnpm install

# 2. Copiar archivo de configuración
cp .env.example .env

# 3. Editar variables de entorno
nano .env
# Rellena: AWS_REGION, S3_BUCKET

# 4. Configurar credenciales AWS
aws configure
# Ingresa: Access Key, Secret Key, Region, Output format

# 5. Verificar que todo esté listo
pnpm run check-s3

# ============================================
# DEPLOYING (Después de cambios)
# ============================================

# OPCIÓN 1: Completo (Build + Deploy)
pnpm run deploy

# OPCIÓN 2: Solo deploy (si ya está construido)
pnpm run deploy:s3

# OPCIÓN 3: Construcción local sin deploy
pnpm build

# ============================================
# COMMANDS ÚTILES AWS CLI
# ============================================

# Listar buckets
aws s3 ls

# Listar contenido del bucket
aws s3 ls s3://byttes-portfolio-prod/ --recursive

# Ver tamaño del bucket
aws s3 ls s3://byttes-portfolio-prod/ --recursive --summarize

# Eliminar archivo del bucket
aws s3 rm s3://byttes-portfolio-prod/archivo.html

# Vaciar bucket (¡CUIDADO!)
aws s3 rm s3://byttes-portfolio-prod/ --recursive

# Invalidar CloudFront
aws cloudfront create-invalidation \
  --distribution-id E1234ABCD \
  --paths "/*"

# ============================================
# DEBUGGING
# ============================================

# Ver credenciales configuradas
aws sts get-caller-identity

# Ver región configurada
aws configure get region

# Ver bucket versioning
aws s3api get-bucket-versioning --bucket byttes-portfolio-prod

# Ver bucket policy
aws s3api get-bucket-policy --bucket byttes-portfolio-prod

# Ver static website hosting
aws s3api get-bucket-website --bucket byttes-portfolio-prod

# ============================================
# AWS CONSOLE QUICK LINKS
# ============================================

# https://s3.console.aws.amazon.com/s3/              - S3 Buckets
# https://console.aws.amazon.com/cloudfront/        - CloudFront
# https://console.aws.amazon.com/route53/            - Route 53 (DNS)
# https://console.aws.amazon.com/iam/                - IAM Users
# https://console.aws.amazon.com/cloudwatch/         - CloudWatch Metrics

# ============================================
# VARIABLES DE ENTORNO (.env)
# ============================================

# AWS_REGION                   - Región AWS (default: us-east-1)
# S3_BUCKET                    - Nombre del bucket S3
# CLOUDFRONT_DISTRIBUTION_ID   - ID de distribución CloudFront (opcional)
# AWS_ACCESS_KEY_ID            - Tu access key (si no usas aws configure)
# AWS_SECRET_ACCESS_KEY        - Tu secret key (si no usas aws configure)

# ============================================
# npm Scripts
# ============================================

# pnpm run check-s3      - Verifica configuración
# pnpm run build         - Construye proyecto
# pnpm run dev           - Servidor de desarrollo
# pnpm run preview       - Preview de build
# pnpm run deploy        - Build + Deploy a S3
# pnpm run deploy:s3     - Solo deploy
# pnpm run new:post      - Crear nuevo post

# ============================================
# ARCHIVOS IMPORTANTES
# ============================================

# README-S3.md               - Este resumen
# S3-SETUP.md                - Guía rápida (español)
# DEPLOY-S3.md               - Guía completa
# .env.example               - Template de variables
# scripts/deploy-s3.mjs      - Script principal
# scripts/check-s3-ready.mjs - Verificador
# aws/bucket-policy.json     - Permisos S3
# aws/cloudfront-config.json - Configuración CDN

# ============================================
# TROUBLESHOOTING
# ============================================

# ERROR: NoCredentialsError
# SOLUCIÓN: aws configure

# ERROR: NoSuchBucket
# SOLUCIÓN: Verifica nombre en .env y que exista en S3

# ERROR: AccessDenied
# SOLUCIÓN: Verifica IAM permissions

# ERROR: "Changes not visible"
# SOLUCIÓN: Vacía cache navegador (Ctrl+Shift+Delete)

# ERROR: 403 Forbidden
# SOLUCIÓN: Verifica bucket policy en aws/bucket-policy.json

# ============================================
# REFERENCIAS
# ============================================

# AWS S3 Docs
# https://docs.aws.amazon.com/s3/

# AWS CloudFront Docs
# https://docs.aws.amazon.com/cloudfront/

# AWS SDK JavaScript
# https://docs.aws.amazon.com/sdk-for-javascript/

# AWS CLI Reference
# https://docs.aws.amazon.com/cli/latest/reference/s3/
