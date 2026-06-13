# 📋 Guía de Deployment a AWS S3

## ¿Qué es S3?

Amazon S3 (Simple Storage Service) es un servicio de almacenamiento de objetos ideal para:
- ✅ Sitios estáticos (HTML, CSS, JS, imágenes)
- ✅ Hosting de bajo costo y alta disponibilidad
- ✅ Integración con CloudFront (CDN global)
- ✅ Escalabilidad automática

## 📝 Requisitos Previos

1. **Cuenta AWS** - [Crear cuenta](https://aws.amazon.com)
2. **AWS CLI** - [Instalar AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
3. **Credenciales AWS** configuradas localmente o variables de entorno
4. **Node.js 20+** y pnpm instalados

## 🚀 Pasos de Configuración

### 1. Crear Bucket en S3

```bash
# Opción A: Via AWS Console (recomendado para principiantes)
# 1. Ir a https://s3.console.aws.amazon.com/s3/
# 2. Click en "Create bucket"
# 3. Nombre del bucket: byttes-portfolio-prod (o tu nombre preferido)
# 4. Región: us-east-1 (o tu región preferida)
# 5. Desmarca "Block public access" si necesitas acceso público
# 6. Click en "Create bucket"

# Opción B: Via AWS CLI
aws s3api create-bucket \
  --bucket byttes-portfolio-prod \
  --region us-east-1
```

### 2. Habilitar Static Website Hosting

```bash
# Via AWS Console:
# 1. Entra al bucket
# 2. Pestaña "Properties"
# 3. Scroll hasta "Static website hosting"
# 4. Click en "Edit"
# 5. Selecciona "Enable"
# 6. Index document: index.html
# 7. Error document: index.html (para SPA routing)
# 8. Click en "Save changes"

# Via AWS CLI:
aws s3 website s3://byttes-portfolio-prod/ \
  --index-document index.html \
  --error-document index.html
```

### 3. Configurar Política de Bucket (Acceso Público)

Via AWS Console:
1. Bucket → "Permissions"
2. "Bucket policy" → Edit
3. Pega esta política:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::byttes-portfolio-prod/*"
    }
  ]
}
```

### 4. (Opcional) Configurar CloudFront

CloudFront es una CDN que distribuye tu contenido globalmente:

```bash
# Via AWS Console:
# 1. CloudFront → "Create distribution"
# 2. Origin domain: byttes-portfolio-prod.s3.us-east-1.amazonaws.com
# 3. Origin access: Origin access control settings
# 4. Viewer protocol policy: Redirect HTTP to HTTPS
# 5. Create distribution

# Guarda el Distribution ID para el archivo .env
```

### 5. Configurar Variables de Entorno Locales

```bash
# Copia el archivo de ejemplo
cp .env.example .env

# Edita .env con tus valores
nano .env
```

Contenido de `.env`:
```env
AWS_REGION=us-east-1
S3_BUCKET=byttes-portfolio-prod
CLOUDFRONT_DISTRIBUTION_ID=E1234ABCD  # Opcional, si usas CloudFront
```

### 6. Instalar Dependencias

```bash
pnpm install
```

### 7. Verificar Configuración

```bash
pnpm run check-s3
```

Este comando verificará:
- ✅ Output estático en astro.config.mjs
- ✅ Directorio dist existe
- ✅ Variables de entorno configuradas
- ✅ Scripts disponibles

## 🎯 Comando de Deploy

### Deploy Completo (Build + Upload)

```bash
pnpm run deploy
```

Este comando:
1. ✅ Construye el proyecto (`pnpm build`)
2. ✅ Sube archivos a S3
3. ✅ Elimina archivos antiguos
4. ✅ Invalida CloudFront (si está configurado)

### Solo Upload (sin rebuild)

```bash
pnpm run deploy:s3
```

Útil si ya construiste localmente.

## 📊 Estructura de Upload

El script sube automáticamente con optimizaciones de cache:

```
.html, .xml, .json  → Cache: 1 hora
.css, .js           → Cache: 1 año (immutable)
.woff, .ttf, etc    → Cache: 1 año (immutable)
.png, .jpg, etc     → Cache: 1 año (immutable)
```

## 🔐 Seguridad

### Credenciales AWS

**Opción 1: AWS CLI (Recomendado)**
```bash
aws configure
# Ingresa tus credenciales interactivamente
```

**Opción 2: Variables de Entorno**
```bash
export AWS_ACCESS_KEY_ID=tu_access_key
export AWS_SECRET_ACCESS_KEY=tu_secret_key
export AWS_REGION=us-east-1
```

**Opción 3: Archivo .env**
```env
AWS_ACCESS_KEY_ID=tu_access_key
AWS_SECRET_ACCESS_KEY=tu_secret_key
```

⚠️ **NUNCA commits credenciales a Git**

### Política IAM Mínima

Para máxima seguridad, crea un usuario IAM con solo permisos de S3:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::byttes-portfolio-prod",
        "arn:aws:s3:::byttes-portfolio-prod/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": "cloudfront:CreateInvalidation",
      "Resource": "arn:aws:cloudfront::ACCOUNT_ID:distribution/E1234ABCD"
    }
  ]
}
```

## 🌐 Conectar Dominio Personalizado

### Con Route 53 (AWS)

1. Ir a Route 53 → Hosted zones
2. Crear hosted zone para `byttes.com`
3. Agregar registro ALIAS:
   - Name: `@` o `byttes.com`
   - Type: `A`
   - Alias target: S3 website endpoint

### Con Proveedor Externo (Namecheap, GoDaddy, etc.)

1. Ir a DNS settings del proveedor
2. Agregar CNAME o ALIAS:
   - Name: `www`
   - Value: `byttes-portfolio-prod.s3-website-us-east-1.amazonaws.com`
3. Para apex domain (`byttes.com`), usar configuración específica del proveedor

## 📊 Monitoreo y Análisis

### Ver URL de tu sitio

```bash
# Después del deploy, tu sitio está en:
https://byttes-portfolio-prod.s3.us-east-1.amazonaws.com/

# O si usas CloudFront:
https://d1234abcd.cloudfront.net/
```

### Monitoreo en AWS Console

1. CloudWatch → Metrics → S3
2. CloudFront → Monitoring
3. S3 → Bucket metrics

## 💰 Costos Estimados

- **S3 Storage**: ~$0.023/GB/mes
- **S3 Requests**: ~$0.0007/1000 requests
- **CloudFront**: ~$0.085/GB (first 10TB/mes)
- **Domain Route 53**: $0.50/hosted zone/mes

Para un sitio pequeño: **$1-5/mes**

## 🔄 CI/CD Automático (GitHub Actions)

Para automatizar deploys con cada push:

1. Crea `.github/workflows/deploy-s3.yml`:

```yaml
name: Deploy to S3

on:
  push:
    branches: [ main, dev ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - run: pnpm install
      - run: pnpm build
      
      - name: Deploy to S3
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          AWS_REGION: us-east-1
          S3_BUCKET: byttes-portfolio-prod
          CLOUDFRONT_DISTRIBUTION_ID: ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }}
        run: pnpm run deploy:s3
```

2. Agregar secrets en GitHub:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `CLOUDFRONT_DISTRIBUTION_ID` (opcional)

## 🛠️ Troubleshooting

### Error: "NoCredentialsError"
```bash
# Ejecuta:
aws configure

# O asegúrate de que .env tiene credenciales
```

### Error: "NoSuchBucket"
```bash
# Verifica el nombre del bucket:
aws s3 ls

# Actualiza en .env si es diferente
```

### Error: "AccessDenied"
```bash
# Verifica permisos IAM del usuario:
aws s3api get-bucket-acl --bucket byttes-portfolio-prod
```

### Cambios no se ven en el navegador
```bash
# Vacía cache del navegador (Ctrl+Shift+Delete)
# O usa CloudFront invalidation:
pnpm run deploy
```

## ✅ Checklist Final

- [ ] Bucket S3 creado
- [ ] Static website hosting habilitado
- [ ] Política de bucket configurada
- [ ] Credenciales AWS configuradas
- [ ] `.env` con variables correctas
- [ ] `pnpm install` ejecutado
- [ ] `pnpm run check-s3` pasó exitosamente
- [ ] Primer deploy: `pnpm run deploy`
- [ ] Sitio accesible en URL de S3
- [ ] (Opcional) CloudFront configurado
- [ ] (Opcional) Dominio personalizado conectado
- [ ] (Opcional) CI/CD en GitHub Actions

## 📚 Recursos

- [AWS S3 Docs](https://docs.aws.amazon.com/s3/)
- [AWS S3 Static Website Hosting](https://docs.aws.amazon.com/AmazonS3/latest/userguide/HostingWebsiteOnS3Setup.html)
- [CloudFront Docs](https://docs.aws.amazon.com/cloudfront/)
- [AWS CLI Reference](https://docs.aws.amazon.com/cli/latest/reference/s3/)

---

¿Preguntas? Revisa los logs del deploy o contacta al equipo de DevOps.
