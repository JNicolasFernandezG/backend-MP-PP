# 🚀 Guía de Deployment a Producción

## Resumen Rápido

**Buena noticia:** El código ya está preparado para producción. 

**Lo único que necesitas cambiar es:**
1. ✅ Variables de entorno (`.env`)
2. ✅ Configuración de BD diferente
3. ⚠️ Algunas variables adicionales (HTTPS, etc.)

**El código se adapta automáticamente según `NODE_ENV`.**

---

## 🔄 Cambios Automáticos por NODE_ENV

El código detecta automáticamente si es `development` o `production` y ajusta:

| Aspecto | Development | Production |
|--------|-------------|-----------|
| **TypeORM synchronize** | ✅ true (auto-crea tablas) | ❌ false (seguridad) |
| **SQL logging** | ✅ Mostrado | ❌ Desactivado |
| **Webhook validation** | ⚠️ Opcional | ✅ Obligatoria |
| **CORS** | Abierto | Restrictivo |

**Código relevante:**

```typescript
// src/app.module.ts
synchronize: configService.get<string>('NODE_ENV') !== 'production',
logging: configService.get<string>('NODE_ENV') === 'development',

// src/payments/payments.controller.ts
if (this.configService.get<string>('NODE_ENV') === 'production') {
  // En producción, rechazar webhook sin firma válida
  throw new BadRequestException('Firma de seguridad inválida');
}
```

---

## 📋 Variables de Entorno Requeridas

### Development (Actual)
```env
# Backend
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# Base de datos (local)
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=tu_password_local
DB_NAME=cursos_db

# Mercado Pago
MP_ACCESS_TOKEN=APP_USR-xxxxx
MP_WEBHOOK_SECRET=tu_webhook_secret

# URLs
WEBHOOK_URL=http://localhost:3000/payments/webhook
BASE_URL=http://localhost:3000

# JWT
JWT_SECRET=tu_secret_corto_para_dev
JWT_EXPIRES_IN=24h
```

### Production (Cambios)
```env
# Backend
PORT=3000
NODE_ENV=production  # ⚠️ CAMBIO
CORS_ORIGIN=https://tu-dominio.com  # ⚠️ CAMBIO

# Base de datos (servidor remoto)
DB_HOST=db.tu-dominio.com  # ⚠️ CAMBIO
DB_PORT=5432
DB_USERNAME=prod_user  # ⚠️ CAMBIO
DB_PASSWORD=secure_production_password_muy_largo_y_complejo  # ⚠️ CAMBIO
DB_NAME=cursos_prod  # ⚠️ CAMBIO

# Mercado Pago
MP_ACCESS_TOKEN=APP_USR-xxxxxxxxx  # ⚠️ CAMBIO (credenciales prod de MP)
MP_WEBHOOK_SECRET=production_webhook_secret_de_mercadopago  # ⚠️ CAMBIO

# URLs
WEBHOOK_URL=https://tu-dominio.com/payments/webhook  # ⚠️ CAMBIO (HTTPS)
BASE_URL=https://tu-dominio.com  # ⚠️ CAMBIO (HTTPS)

# JWT
JWT_SECRET=super_secret_key_muy_largo_aleatorio_para_produccion_min_32_chars  # ⚠️ CAMBIO
JWT_EXPIRES_IN=24h
```

---

## ⚙️ Cambios Necesarios en el Código (Opcionales)

### 1. Agregar HTTPS (Recomendado)

**Archivo:** `src/main.ts`

```typescript
import { NestFactory } from '@nestjs/core';
import * as fs from 'fs';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  // En producción, usar HTTPS
  const isProduction = process.env.NODE_ENV === 'production';
  let app;
  
  if (isProduction) {
    const httpsOptions = {
      key: fs.readFileSync(process.env.SSL_KEY_PATH),
      cert: fs.readFileSync(process.env.SSL_CERT_PATH),
    };
    app = await NestFactory.create(AppModule, { httpsOptions });
  } else {
    app = await NestFactory.create(AppModule);
  }

  // CORS más restrictivo en producción
  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`✅ Aplicación corriendo en puerto ${port} (${isProduction ? 'HTTPS' : 'HTTP'})`);
}

bootstrap();
```

**Agregar a `.env`:**
```env
SSL_KEY_PATH=/etc/ssl/private/tu-dominio.key
SSL_CERT_PATH=/etc/ssl/certs/tu-dominio.crt
```

### 2. Rate Limiting (Muy Recomendado)

```bash
npm install @nestjs/throttler
```

**Archivo:** `src/app.module.ts`

```typescript
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000,     // 1 minuto
      limit: 100,     // máximo 100 requests por minuto
    }]),
    // ... resto de imports
  ],
})
export class AppModule {}
```

Aplicar en endpoints públicos:

```typescript
import { UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@UseGuards(ThrottlerGuard)
@Post('webhook')
async handleWebhook() { }
```

### 3. Logging Mejorado (Recomendado)

Cambiar de Logger básico a Winston o Pino para logging a archivos.

```bash
npm install winston nest-winston
```

---

## 🔐 Seguridad - Checklist Producción

- [ ] `NODE_ENV=production` configurado
- [ ] JWT_SECRET tiene **mínimo 32 caracteres** y es aleatorio
- [ ] Credenciales de BD son diferentes de development
- [ ] CORS_ORIGIN es específico de tu dominio (no `*`)
- [ ] MP_WEBHOOK_SECRET está configurado (de MercadoPago dashboard)
- [ ] BASE_URL y WEBHOOK_URL usan HTTPS
- [ ] SSL/HTTPS configurado en servidor
- [ ] Database backups programados
- [ ] Rate limiting activado
- [ ] Logs enviados a archivo/servicio externo
- [ ] Monitoreo de errores (Sentry, etc.)

---

## 📊 Flujo de Deployment

```
1. Compilar
   npm run build

2. Crear .env con variables de producción
   cp .env.example .env.production
   # Editar con valores reales

3. Instalar dependencias
   npm install --production

4. Ejecutar migraciones (si existen)
   npm run migration:run

5. Iniciar aplicación
   NODE_ENV=production npm start
   # O usar PM2: pm2 start dist/main.js --name "api-mp-pp"
```

---

## 🚀 Deployment en Plataformas Comunes

### Heroku
```bash
# Agregar buildpacks
heroku buildpacks:add heroku/nodejs

# Configurar variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=xxxxx
heroku config:set DB_HOST=xxxxx
# ... resto de variables

# Deploy
git push heroku main
```

### AWS EC2 + RDS
```bash
# Instalar Node
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2 para mantener app corriendo
sudo npm install -g pm2
pm2 start dist/main.js --name "api-mp-pp"
pm2 startup
pm2 save

# Nginx como reverse proxy (HTTPS)
sudo apt-get install nginx
# Configurar archivo /etc/nginx/sites-available/default
```

### Docker
```dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY dist ./dist

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "dist/main.js"]
```

```bash
# Build y run
docker build -t api-mp-pp .
docker run -e NODE_ENV=production \
           -e DB_HOST=db.server.com \
           -e DB_PASSWORD=xxxxx \
           -p 3000:3000 \
           api-mp-pp
```

---

## ✅ Verificación Post-Deployment

```bash
# Verificar que la app inició
curl -X GET https://tu-dominio.com/

# Verificar que JWT funciona
curl -X POST https://tu-dominio.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123"}'

# Verificar que webhook de MercadoPago puede alcanzar
# (desde dashboard de MP hacer prueba de webhook)

# Verificar CORS
curl -X OPTIONS https://tu-dominio.com/products \
  -H "Origin: https://tu-frontend.com" \
  -v
```

---

## 📝 Resumen Final

| Componente | ¿Cambio de Código? | ¿Cambio de Env? |
|-----------|---|---|
| Logging SQL | ❌ No (automático) | ❌ No |
| Webhook validation | ❌ No (automático) | ✅ MP_WEBHOOK_SECRET |
| TypeORM sync | ❌ No (automático) | ✅ NODE_ENV |
| CORS | ✅ Sí (agregar HTTPS) | ✅ CORS_ORIGIN |
| JWT | ❌ No (automático) | ✅ JWT_SECRET |
| BD | ❌ No (automático) | ✅ DB_* variables |
| Rate limiting | ✅ Sí (instalar @nestjs/throttler) | ❌ No |
| HTTPS | ✅ Sí (agregar certificados) | ✅ SSL_* paths |

**Conclusión:** Principalmente cambios en `.env`, con opcionalmente mejoras de código para seguridad y performance.
