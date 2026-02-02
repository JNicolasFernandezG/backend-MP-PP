# 📚 DOCUMENTACIÓN DE CONTROLADORES API

## 🔐 AUTH CONTROLLER

**Ruta:** `/auth`

### 📍 POST `/auth/login`
**Descripción:** Autentica un usuario y devuelve un token JWT

**📤 Frontend envía (Body):**
```json
{
  "email": "usuario@example.com",
  "password": "Abc123456"
}
```

**Validaciones:**
- ✅ Email válido (formato correcto)
- ✅ Password mínimo 6 caracteres

**📥 Backend devuelve (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "email": "usuario@example.com",
    "role": "user",
    "isPremium": false,
    "subscriptionId": null
  }
}
```

**Ejemplo si el usuario TIENE suscripción activa:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "email": "usuario@example.com",
    "role": "user",
    "isPremium": true,
    "subscriptionId": "12345678-1234-1234-1234-123456789012"
  }
}
```

**💡 Nota importante:**
- El token JWT ahora incluye `isPremium` y `subscriptionId` en el payload
- El frontend puede decodificar el token para acceder a `isPremium` y `subscriptionId` en cualquier momento
- `subscriptionId` es el ID de la suscripción en Mercado Pago (necesario para cancelar)

**Payload del JWT (decodificado):**
```json
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "email": "usuario@example.com",
  "role": "user",
  "isPremium": true,
  "subscriptionId": "12345678-1234-1234-1234-123456789012",
  "iat": 1699564800,
  "exp": 1699651200
}
```

**❌ Errores posibles:**
- `401 Unauthorized` - Credenciales incorrectas
- `400 Bad Request` - Email o password inválido

---

### 📍 POST `/auth/forgot-password`
**Descripción:** Solicita recuperación de contraseña (envía email con link de reset)

**📤 Frontend envía (Body):**
```json
{
  "email": "usuario@example.com"
}
```

**Validaciones:**
- ✅ Email debe ser válido (formato correcto)

**📥 Backend devuelve (200 OK):**
```json
{
  "success": true
}
```

**⚠️ Nota de seguridad CRÍTICA (Account Enumeration Prevention):**
- El endpoint **SIEMPRE retorna `{ success: true }`**, incluso si el email no existe en la BD
- Esto es INTENCIONAL por razones de seguridad (no revelar si un email está registrado)
- Si el email NO existe en BD: No se envía email, pero la respuesta es la misma
- Si el email SÍ existe en BD: Se genera token y se envía email

**¿Por qué se comporta así?**
Si el endpoint retornara errores diferentes (`404` si no existe, `200` si existe), un atacante podría hacer fuerza bruta para descubrir emails registrados. Esta protección se llama "Account Enumeration Prevention" (práctica de seguridad estándar).

**¿Cómo valida el frontend si se envió el email?**
- El usuario no recibe confirmación de si el email es válido
- El usuario debe revisar su bandeja de entrada (práctica correcta)
- Si el email es válido, lo verá en ~5 minutos
- Si no lo ve, puede intentar de nuevo (el sistema no confirma ni niega)

**¿Qué sucede si el email existe?**
1. Backend genera un token seguro de 32 bytes (hex)
2. Guarda token en tabla `password_reset_token` con expiración de 1 hora
3. Envía email con link: `https://tudominio.com/reset-password?token=abc123...`
4. Token solo puede usarse 1 vez
5. Si expira (1 hora), usuario debe solicitar otro

**📧 Email que recibe el usuario (si existe):**
- Subject: `Recuperar contraseña - Nombre App`
- Body: Link con token + instrucciones para resetear contraseña

**❌ Errores posibles:**
- `400 Bad Request` - Email inválido (validación de formato)
- `500 Internal Server Error` - Fallo al enviar email (revisar SMTP_HOST en .env)

---

### 📍 POST `/auth/reset-password`
**Descripción:** Resetea la contraseña usando token enviado por email

**📤 Frontend envía (Body):**
```json
{
  "token": "abc123def456ghi789jkl012mno345pqr",
  "newPassword": "NuevaPassword123"
}
```

**Validaciones - El token:**
- ✅ Token debe ser válido (existir en BD)
- ✅ Token no debe estar usado
- ✅ Token no debe estar expirado (máximo 1 hora)

**Validaciones - La nueva contraseña:**
- ✅ Mínimo 8 caracteres
- ✅ Debe contener al menos una mayúscula (A-Z)
- ✅ Debe contener al menos una minúscula (a-z)
- ✅ Debe contener al menos un número (0-9)

**Ejemplo de passwords VÁLIDOS:**
- ✅ `MyNewPass123`
- ✅ `SecurePass999`
- ✅ `AltaSeguridad2024`

**Ejemplo de passwords INVÁLIDOS:**
- ❌ `password123` - Sin mayúscula
- ❌ `PASSWORD123` - Sin minúscula
- ❌ `MyPassword` - Sin número
- ❌ `Pass1` - Muy corto (menos de 8 caracteres)

**📥 Backend devuelve (200 OK):**
```json
{
  "success": true
}
```

**¿Qué sucede?**
1. Backend valida que el token sea válido y no esté usado
2. Backend valida que la contraseña cumpla los requisitos (8+ chars, mayúscula, minúscula, número)
3. Si la validación falla, retorna error `400 Bad Request`
4. Hashea la contraseña con bcrypt (10 rondas en dev, 12 en prod)
5. Actualiza la contraseña del usuario en BD
6. Marca el token como "usado" (no puede reutilizarse)
7. Usuario puede iniciar sesión con nueva contraseña inmediatamente

**❌ Errores posibles:**
- `400 Bad Request` - Token inválido o expirado
- `400 Bad Request` - Token ya fue usado
- `400 Bad Request` - Password no cumple requisitos (muy corta, sin mayúscula, sin minúscula, sin número)
- `404 Not Found` - Token no existe
- `500 Internal Server Error` - Error al actualizar contraseña

**💡 Recomendaciones para el Frontend:**
1. Cuando usuario hace click en link del email, extrae el `token` de la URL
2. Muestra formulario con campos: `token` (hidden), `newPassword`, `confirmPassword`
3. Valida que las passwords coincidan
4. Valida password en tiempo real (8+ caracteres, al menos 1 mayúscula, 1 minúscula, 1 número)
5. Envía POST a `/auth/reset-password` con token y newPassword
6. Si es exitoso (200), redirige a login
7. Si es error (400), muestra mensaje al usuario

---

## 👥 USERS CONTROLLER

**Ruta:** `/users`

### 📍 POST `/users/register`
**Descripción:** Registra un nuevo usuario

**📤 Frontend envía (Body):**
```json
{
  "email": "nuevo@example.com",
  "password": "MiPassword123"
}
```

**Validaciones:**
- ✅ Email único (no existe en BD)
- ✅ Email válido (formato correcto)
- ✅ Password mínimo 8 caracteres
- ✅ Password debe tener mayúscula, minúscula y número

**📥 Backend devuelve (201 Created):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "nuevo@example.com",
  "role": "user",
  "subscriptionId": null,
  "isPremium": false,
  "subscriptionStartDate": null,
  "subscriptionEndDate": null
}
```

**Campos devueltos:**
- `id` - UUID del usuario
- `email` - Email registrado
- `role` - Rol del usuario (default: "user")
- `subscriptionId` - ID de suscripción en Mercado Pago (null si no está suscrito)
- `isPremium` - Si tiene suscripción activa (false para usuarios nuevos)
- `subscriptionStartDate` - Fecha cuando se suscribió (null si no está suscrito)
- `subscriptionEndDate` - Fecha cuando canceló (null si aún activo o nunca fue premium)

**❌ Errores posibles:**
- `400 Bad Request` - Email ya registrado
- `400 Bad Request` - Password no cumple requisitos
- `400 Bad Request` - Email inválido

---

## 🛍️ PRODUCTS CONTROLLER

**Ruta:** `/products`

### 📍 GET `/products`
**Descripción:** Obtiene lista de productos con paginación

**📤 Frontend envía (Query Parameters):**
```
GET /products?page=1&limit=10
```

**Parámetros opcionales:**
- `page` (número) - Página a obtener (default: 1)
- `limit` (número) - Productos por página (default: 10)

**📥 Backend devuelve (200 OK):**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Curso de Node.js",
      "description": "Aprende Node.js desde cero",
      "price": "99.99",
      "isSubscription": false
    },
    {
      "id": 2,
      "name": "Suscripción Premium",
      "description": "Acceso a todos los cursos",
      "price": "29.99",
      "isSubscription": true
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 10,
  "pages": 3
}
```

---

### 📍 GET `/products/:id`
**Descripción:** Obtiene un producto específico

**📤 Frontend envía:**
```
GET /products/1
```

**📥 Backend devuelve (200 OK):**
```json
{
  "id": 1,
  "name": "Curso de Node.js",
  "description": "Aprende Node.js desde cero",
  "price": "99.99",
  "isSubscription": false
}
```

**❌ Errores posibles:**
- `404 Not Found` - Producto no existe

---

### 📍 POST `/products` (REQUIERE AUTENTICACIÓN + ROL ADMIN)
**Descripción:** Crea un nuevo producto (solo administradores)

**📤 Frontend envía (Headers + Body):**
```
Headers:
Authorization: Bearer {access_token}  // Token de usuario con rol 'admin'

Body:
{
  "name": "Curso React",
  "description": "Aprende React avanzado",
  "price": 149.99,
  "isSubscription": false
}
```

**Validaciones:**
- ✅ Token JWT válido requerido
- ✅ Usuario debe tener rol `admin` (no `user`)
- ✅ name requerido (string)
- ✅ price requerido (número)
- ✅ description opcional
- ✅ isSubscription opcional (boolean, default: false)

**📥 Backend devuelve (201 Created):**
```json
{
  "id": 5,
  "name": "Curso React",
  "description": "Aprende React avanzado",
  "price": "149.99",
  "isSubscription": false
}
```

**❌ Errores posibles:**
- `401 Unauthorized` - Token faltante o inválido
- `403 Forbidden` - Usuario no tiene rol admin
- `400 Bad Request` - Datos incompletos o inválidos

---

### 📍 PATCH `/products/:id` (REQUIERE AUTENTICACIÓN + ROL ADMIN)
**Descripción:** Actualiza un producto (solo administradores, campos opcionales)

**📤 Frontend envía (Headers + Body):**
```
Headers:
Authorization: Bearer {access_token}  // Token de usuario con rol 'admin'

Body (todos los campos opcionales):
{
  "name": "Curso React Actualizado",
  "price": 199.99
}
```

**📥 Backend devuelve (200 OK):**
```json
{
  "id": 5,
  "name": "Curso React Actualizado",
  "description": "Aprende React avanzado",
  "price": "199.99",
  "isSubscription": false
}
```

**❌ Errores posibles:**
- `401 Unauthorized` - Token faltante o inválido
- `403 Forbidden` - Usuario no tiene rol admin
- `404 Not Found` - Producto no existe

---

### 📍 DELETE `/products/:id` (REQUIERE AUTENTICACIÓN + ROL ADMIN)
**Descripción:** Elimina un producto (solo administradores)

**📤 Frontend envía:**
```
Headers:
Authorization: Bearer {access_token}  // Token de usuario con rol 'admin'

DELETE /products/5
```

**📥 Backend devuelve (200 OK):**
```json
{
  "message": "Producto con ID 5 eliminado correctamente"
}
```

**❌ Errores posibles:**
- `401 Unauthorized` - Token faltante o inválido
- `404 Not Found` - Producto no existe

---

## 💳 PAYMENTS CONTROLLER

**Ruta:** `/payments`

### 📍 POST `/payments/create-preference` (REQUIERE AUTENTICACIÓN)
**Descripción:** Crea una preferencia de pago (pago único) en MercadoPago

**📤 Frontend envía:**
```
Headers:
Authorization: Bearer {access_token}

Body:
{
  "items": [
    {
      "id": "1",
      "quantity": 2
    },
    {
      "id": "3",
      "quantity": 1
    }
  ]
}
```

**Validaciones:**
- ✅ Token JWT requerido
- ✅ items array requerido
- ✅ id y quantity requeridos en cada item
- ✅ Los productos deben existir en BD

**📥 Backend devuelve (201 Created):**
```json
{
  "init_point": "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=123456789",
  "orderId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Flujo:**
1. Frontend obtiene `init_point`
2. Redirige al usuario a ese link
3. Usuario paga en MercadoPago
4. MercadoPago redirige a `BASE_URL/payments/success`
5. Backend recibe webhook en `/payments/webhook`

**❌ Errores posibles:**
- `401 Unauthorized` - Token inválido
- `400 Bad Request` - Producto no existe
- `500 Internal Server Error` - Error en MercadoPago (token inválido, API caída)

---

### 📍 POST `/payments/create-subscription` (REQUIERE AUTENTICACIÓN)
**Descripción:** Crea una suscripción mensual en MercadoPago

**📤 Frontend envía:**
```
Headers:
Authorization: Bearer {access_token}

Body:
{
  "productId": 2
}
```

**Validaciones:**
- ✅ Token JWT requerido (email extraído automáticamente del token)
- ✅ productId requerido (número)
- ✅ Producto debe existir
- ✅ Producto debe tener `isSubscription: true`

**📥 Backend devuelve (201 Created):**
```json
{
  "init_point": "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=987654321"
}
```

**Flujo:**
1. Usuario autenticado se suscribe a un plan mensual
2. El email se obtiene automáticamente del JWT token
3. MercadoPago cobra automáticamente cada mes
4. Backend recibe webhooks de renovación
5. Usuario acceso se activa/desactiva según estado

**❌ Errores posibles:**
- `401 Unauthorized` - Token inválido
- `400 Bad Request` - Producto no existe o no es suscripción
- `500 Internal Server Error` - Error en MercadoPago

---

### 📍 GET `/payments/subscription-status` (REQUIERE AUTENTICACIÓN)
**Descripción:** Obtiene el estado actual de la suscripción del usuario autenticado

**📤 Frontend envía:**
```
Headers:
Authorization: Bearer {access_token}

GET /payments/subscription-status
```

**📥 Backend devuelve (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "usuario@example.com",
  "isPremium": true,
  "subscriptionId": "12345678-1234-1234-1234-123456789012",
  "subscriptionStartDate": "2026-02-02T10:30:45.123Z",
  "subscriptionEndDate": null,
  "hasActiveSubscription": true
}
```

**Ejemplo si NO tiene suscripción:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "usuario@example.com",
  "isPremium": false,
  "subscriptionId": null,
  "subscriptionStartDate": null,
  "subscriptionEndDate": null,
  "hasActiveSubscription": false
}
```

**Uso recomendado:**
- Consultar después de login si quieres información detallada
- Mostrar fecha de próxima renovación
- Verificar si el usuario puede acceder a contenido premium
- Mostrar botón "Cancelar suscripción" solo si `hasActiveSubscription` es true

**❌ Errores posibles:**
- `401 Unauthorized` - Token inválido
- `404 Not Found` - Usuario no encontrado

---

### 📍 POST `/payments/webhook`
**Descripción:** Recibe notificaciones de MercadoPago (sin autenticación)

**📤 MercadoPago envía (automático):**
```
Query (para pagos):
type=payment&data.id=123456789

O Body (para suscripciones):
{
  "type": "subscription_preapproval",
  "data": {
    "id": "987654321"
  }
}
```

**📥 Backend devuelve (200 OK):**
```json
{
  "received": true
}
```

**Headers requeridos (MercadoPago envía automáticamente):**
```
X-Signature: SHA256=valor_firmado
X-Request-ID: identificador_de_request
```

**Funcionalidad:**
- ✅ Verifica pagos únicos
- ✅ Verifica suscripciones
- ✅ Valida firma X-Signature (en production)
- ✅ Logs de todos los eventos
- ✅ Actualiza estado de órdenes en BD

**Comportamiento por entorno:**

| NODE_ENV | Sin X-Signature | Con X-Signature inválida |
|----------|---|---|
| `development` | ✅ Permite | ✅ Permite (solo aviso en log) |
| `production` | ❌ Rechaza (400) | ❌ Rechaza (400) |

**Logs generados:**
```
✅ Pago aprobado: 123456789
Monto: 299.99
Usuario: us***@example.com  (enmascarado por GDPR)
```

**Implementación de seguridad:**
```
1. Extrae X-Signature y X-Request-ID del header
2. Construye: validationString = "id={requestId};{body}"
3. Calcula HMAC-SHA256 con MP_WEBHOOK_SECRET
4. Compara con timingSafeEqual (previene timing attacks)
5. En production rechaza si firma es inválida
```

---

### 📍 POST `/payments/cancel-subscription` (REQUIERE AUTENTICACIÓN)
**Descripción:** Cancela una suscripción activa del usuario en MercadoPago

**📤 Frontend envía:**
```
Headers:
Authorization: Bearer {access_token}

Body:
{}
```

**Validaciones:**
- ✅ Token JWT requerido
- ✅ Usuario debe tener una suscripción activa
- ✅ Campo `isPremium` debe ser true

**📥 Backend devuelve (200 OK):**
```json
{
  "message": "Suscripción cancelada exitosamente",
  "email": "usuario@example.com",
  "cancelledAt": "2026-02-02T14:30:45.123Z"
}
```

**Flujo de cancelación:**
1. Usuario autenticado solicita cancelar su suscripción
2. Backend valida que tenga suscripción activa
3. Llamada a API de MercadoPago: `PreApproval.update({ status: 'cancelled' })`
4. Actualiza BD: `isPremium = false`, `subscriptionEndDate = ahora`
5. Usuario pierde acceso a beneficios premium
6. MercadoPago deja de cobrar renovaciones

**Cambios en la entidad User después de cancelar:**
```json
{
  "id": "uuid",
  "email": "usuario@example.com",
  "role": "user",
  "isPremium": false,
  "subscriptionId": "SUB_MP_ID",
  "subscriptionStartDate": "2026-01-01T...",
  "subscriptionEndDate": "2026-02-02T14:30:45.123Z"
}
```

**❌ Errores posibles:**
- `401 Unauthorized` - Token inválido o no proporcionado
- `404 Not Found` - Usuario no encontrado
- `400 Bad Request` - Usuario no tiene suscripción activa
- `500 Internal Server Error` - Error al contactar MercadoPago

**Ejemplo completo con JavaScript:**
```javascript
const cancelSubscription = async (access_token) => {
  try {
    const response = await fetch('http://localhost:3000/payments/cancel-subscription', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Suscripción cancelada:', data.message);
      console.log('Cancelada en:', data.cancelledAt);
    } else {
      const error = await response.json();
      console.error('❌ Error:', error.message);
    }
  } catch (error) {
    console.error('Error de conexión:', error);
  }
};
```

---

## 📦 ORDERS CONTROLLER

### 📍 GET `/orders/:id/status`
**Descripción:** Consulta el estado de una orden por su `orderId` (devuelto al crear la preferencia)

**📤 Frontend envía:**
```
GET /orders/550e8400-e29b-41d4-a716-446655440000/status
```

**📥 Backend devuelve (200 OK):**
```json
{
  "orderId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "approved",
  "totalAmount": 299.99
}
```

**Uso recomendado:** Tras el redireccionamiento de MercadoPago a `back_url`, el frontend debe consultar este endpoint para confirmar que la orden fue procesada por el webhook y mostrar un mensaje al usuario.


## 🔑 Usando el Token JWT

Todo endpoint con **(REQUIERE AUTENTICACIÓN)** necesita enviar el token en el header:

```
Authorization: Bearer {access_token}
```

**Ejemplo con fetch:**
```javascript
const response = await fetch('http://localhost:3000/products', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${access_token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: "Mi producto",
    price: 99.99
  })
});
```

**Ejemplo con axios:**
```javascript
axios.post('http://localhost:3000/products', 
  { name: "Mi producto", price: 99.99 },
  { headers: { Authorization: `Bearer ${access_token}` } }
);
```

---

## ⚙️ Variables de Entorno Necesarias

```env
# Backend
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=tu_password
DB_NAME=cursos_db

# Mercado Pago
MP_ACCESS_TOKEN=APP_USR-xxxxx
MP_WEBHOOK_SECRET=tu_webhook_secret_de_mercadopago
WEBHOOK_URL=https://tu-dominio.com/payments/webhook
BASE_URL=https://tu-dominio.com

# JWT
JWT_SECRET=tu_secret_muy_largo
JWT_EXPIRES_IN=24h
```

---

## 📊 Resumen Rápido

| Endpoint | Método | Autenticación | Rol Requerido | Descripción |
|----------|--------|---|---|---|
| `/auth/login` | POST | ❌ | - | Login |
| `/auth/forgot-password` | POST | ❌ | - | Solicitar reset de contraseña |
| `/auth/reset-password` | POST | ❌ | - | Resetear contraseña con token |
| `/users/register` | POST | ❌ | - | Registro |
| `/products` | GET | ❌ | - | Listar con paginación |
| `/products/:id` | GET | ❌ | - | Obtener uno |
| `/products` | POST | ✅ | admin | Crear |
| `/products/:id` | PATCH | ✅ | admin | Actualizar |
| `/products/:id` | DELETE | ✅ | admin | Eliminar |
| `/payments/create-preference` | POST | ✅ | user | Pago único |
| `/payments/create-subscription` | POST | ✅ | user | Suscripción |
| `/payments/cancel-subscription` | POST | ✅ | user | Cancelar suscripción |
| `/payments/subscription-status` | GET | ✅ | user | Ver estado suscripción |
| `/payments/webhook` | POST | ❌ | - | Webhook MP |
| `/orders/:id/status` | GET | ❌ | - | Ver estado de orden |

---

## 🔐 Sistema de Roles

**Roles disponibles:** `user` (default) y `admin`

| Acción | user | admin |
|--------|------|-------|
| Ver productos | ✅ | ✅ |
| Crear productos | ❌ | ✅ |
| Actualizar productos | ❌ | ✅ |
| Eliminar productos | ❌ | ✅ |
| Crear pagos | ✅ | ✅ |
| Crear suscripciones | ✅ | ✅ |

---

## 🗑️ RESETEAR BASE DE DATOS (SOLO SI LA CAGASTE Y NO ME PODES LLAMAR POR QUE ESTOY OCUPADO)

### ⚠️ Script de limpieza segura

Si necesitas empezar "de cero" eliminando TODAS las tablas de la base de datos en development:

**Comando:**
```bash
npx ts-node src/scripts/reset-db.ts --confirm
```

**¿Qué hace?**
1. Se conecta a PostgreSQL usando credenciales del `.env`
2. Elimina todo el esquema `public` (todas las tablas, índices, relaciones)
3. Recrea el esquema `public` vacío
4. La base de datos queda limpia en cero

**Después de ejecutar:**
```bash
npm run start:dev
```
- TypeORM detecta que las tablas no existen
- Recrea automáticamente todas las tablas desde el código (porque `synchronize: true` en development)
- La aplicación funciona con BD limpia y nuevas tablas

**⚠️ IMPORTANTE:**
- ✅ **Seguro en development** — requiere `--confirm` para evitar accidentes
- ❌ **NUNCA usar en producción** — perderías todos los datos reales
- 📦 **Haz backup primero** si tienes datos importantes que recuperar

**Alternativas si no quieres usar el script:**
- Usar `dropdb` + `createdb` (PostgreSQL CLI)
- Usar pgAdmin (interfaz gráfica)

---

