# 🚀 S3 Deployment - Guía Rápida (Español)

## ¿Qué se ha preparado?

Tu proyecto Astro está **100% listo** para S3. Aquí está todo configurado:

### ✅ Archivos Creados

1. **`scripts/deploy-s3.mjs`** - Script automático de deploy
2. **`scripts/check-s3-ready.mjs`** - Verificador de configuración
3. **`.env.example`** - Template de variables de entorno
4. **`DEPLOY-S3.md`** - Guía completa (en inglés)
5. **`aws/bucket-policy.json`** - Política de permisos S3
6. **`aws/cloudfront-config.json`** - Configuración CloudFront

### ✅ Configuración Astro

- Output: `static` ✅
- Optimizaciones Vite: Habilitadas ✅
- Sitemap: Configurado ✅

### ✅ Scripts npm

```bash
pnpm run check-s3      # Verifica que todo esté listo
pnpm run build         # Construye el proyecto
pnpm run deploy        # Build + Deploy a S3
pnpm run deploy:s3     # Solo deploy (sin rebuild)
```

## 🎯 Pasos para Activar

### Paso 1: Instalar Dependencias AWS

```bash
pnpm install
```

Esto instala:
- `@aws-sdk/client-s3` - Cliente de S3
- `@aws-sdk/client-cloudfront` - Cliente CloudFront (opcional)
- `mime-types` - Detección automática de tipos MIME

### Paso 2: Crear Bucket en AWS

**Opción A: Vía AWS Console** (recomendado)
1. Ve a [AWS S3 Console](https://s3.console.aws.amazon.com/s3/)
2. Click en "Crear bucket"
3. Nombre: `byttes-portfolio-prod`
4. Región: `us-east-1`
5. Crea el bucket

**Opción B: Vía AWS CLI**
```bash
aws s3api create-bucket \
  --bucket byttes-portfolio-prod \
  --region us-east-1
```

### Paso 3: Habilitar Static Website Hosting

En AWS Console del bucket:
1. Tab "Properties"
2. "Static website hosting" → Edit
3. Enable ✓
4. Index document: `index.html`
5. Error document: `index.html`
6. Save

### Paso 4: Configurar Permisos Públicos

En AWS Console del bucket:
1. Tab "Permissions"
2. "Bucket policy" → Edit
3. Abre `/aws/bucket-policy.json`
4. Cambia `BUCKET_NAME` por el nombre real
5. Pega y guarda

### Paso 5: Configurar Variables de Entorno

```bash
cp .env.example .env
nano .env
```

Rellena:
```env
AWS_REGION=us-east-1
S3_BUCKET=byttes-portfolio-prod
# CLOUDFRONT_DISTRIBUTION_ID=E1234ABCD (opcional)
```

### Paso 6: Configurar Credenciales AWS

**Opción A: AWS CLI** (más fácil)
```bash
aws configure
# Ingresa: Access Key, Secret Key, Region, Output format
```

**Opción B: Variables de entorno**
```bash
export AWS_ACCESS_KEY_ID="tu_access_key"
export AWS_SECRET_ACCESS_KEY="tu_secret_key"
```

### Paso 7: Verificar Configuración

```bash
pnpm run check-s3
```

Debe mostrar todos los checks en ✅

### Paso 8: Primer Deploy

```bash
pnpm run deploy
```

Este comando:
1. ✅ Construye el proyecto (`pnpm build`)
2. ✅ Sube ~50 archivos a S3
3. ✅ Elimina archivos antiguos
4. ✅ Invalida CloudFront (si está configurado)

### Paso 9: Ver tu sitio

```
https://byttes-portfolio-prod.s3.us-east-1.amazonaws.com/
```

¡Listo! 🎉

## 📋 Deploy Posterior (Cambios Futuros)

Para actualizar el sitio después de cambios:

```bash
# Opción 1: Completo
pnpm run deploy

# Opción 2: Si ya está construido
pnpm run deploy:s3
```

## 🔐 Seguridad - Importante

### No commits credenciales

```bash
# .env está en .gitignore (protegido)
# Pero si lo agregaste, elimina del git:
git rm --cached .env
git commit -m "Remove .env"
```

### User IAM Mínimo (recomendado)

En lugar de usar credenciales root, crea un usuario IAM:

1. AWS IAM → Users → Create user
2. Nombre: `byttes-deployer`
3. Adjunta política con permisos solo para S3 y CloudFront
4. Usa las credenciales de ese usuario en `.env`

Ver política mínima en `DEPLOY-S3.md`

## 📊 Estructura de Archivos Subidos

El script sube automáticamente con cache headers inteligentes:

```
HTML/XML/JSON  → Cache: 1 hora (pueden cambiar frecuentemente)
CSS/JS         → Cache: 1 año + immutable (no cambian si el hash no cambia)
Imágenes       → Cache: 1 año + immutable
Fonts          → Cache: 1 año + immutable
```

Esto minimiza transferencias y maximiza velocidad.

## 🌐 Conectar Dominio (byttes.com)

### Opción 1: Route 53 (AWS)

1. Route 53 → Hosted Zones → Create
2. Nombre: `byttes.com`
3. Agregar NS records de tu registrador
4. Crear registro ALIAS:
   - Type: A
   - Target: S3 endpoint
   - Evaluate target health: Yes

### Opción 2: Registrador Externo

1. DNS settings del registrador
2. Crear CNAME: `www.byttes.com` → `byttes-portfolio-prod.s3-website-us-east-1.amazonaws.com`
3. Para dominio root, seguir guía específica del registrador

## 💰 Costos

- **Storage**: ~$0.02/GB/mes
- **Requests**: Básicamente gratis para blogs
- **Total estimado**: $1-2/mes

Con CloudFront: +$0.085/GB (pero llega a más usuarios rápido)

## 🆘 Problemas Comunes

| Error | Solución |
|-------|----------|
| `NoCredentialsError` | Ejecuta `aws configure` |
| `NoSuchBucket` | Verifica nombre en `.env` |
| `AccessDenied` | Revisa permisos IAM |
| Cambios no se ven | Vacía cache navegador (Ctrl+Shift+Delete) |
| 403 Forbidden | Verifica bucket policy |

## 📚 Más Información

- **Guía completa**: [DEPLOY-S3.md](./DEPLOY-S3.md)
- **AWS S3 Docs**: https://docs.aws.amazon.com/s3/
- **CloudFront**: https://docs.aws.amazon.com/cloudfront/

## ✨ Lo Próximo

1. ✅ Instalar deps: `pnpm install`
2. ✅ Crear bucket S3
3. ✅ Configurar variables: `.env`
4. ✅ Deploy: `pnpm run deploy`
5. ✅ Visitar tu sitio en S3

¡A deployar! 🚀
