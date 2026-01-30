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
    "role": "user"
  }
}
```

**❌ Errores posibles:**
- `401 Unauthorized` - Credenciales incorrectas
- `400 Bad Request` - Email o password inválido

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
  "role": "user"
}
```

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
- ✅ Token JWT requerido
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
1. Usuario se suscribe a un plan mensual
2. MercadoPago cobra automáticamente cada mes
3. Backend recibe webhooks de renovación
4. Usuario acceso se activa/desactiva según estado

**❌ Errores posibles:**
- `401 Unauthorized` - Token inválido
- `400 Bad Request` - Producto no existe o no es suscripción
- `500 Internal Server Error` - Error en MercadoPago

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
| `/users/register` | POST | ❌ | - | Registro |
| `/products` | GET | ❌ | - | Listar con paginación |
| `/products/:id` | GET | ❌ | - | Obtener uno |
| `/products` | POST | ✅ | admin | Crear |
| `/products/:id` | PATCH | ✅ | admin | Actualizar |
| `/products/:id` | DELETE | ✅ | admin | Eliminar |
| `/payments/create-preference` | POST | ✅ | user | Pago único |
| `/payments/create-subscription` | POST | ✅ | user | Suscripción |
| `/payments/webhook` | POST | ❌ | - | Webhook MP |

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

