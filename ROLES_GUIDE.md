# 🔐 Sistema de Roles Implementado

## ¿Qué cambió?

Ahora hay un **sistema de control de acceso por roles** para operaciones de productos:

- **User** (rol por defecto): Puede ver productos y crear pagos
- **Admin**: Puede crear, actualizar y eliminar productos

---

## 📝 Cambios en el Código

### 1. Nuevo Guard de Roles
**Archivo:** `src/auth/roles.guard.ts`
```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly allowedRoles: string[]) {}

  canActivate(context: ExecutionContext): boolean {
    const user = request.user;
    if (!this.allowedRoles.includes(user.role)) {
      throw new ForbiddenException('Acceso denegado');
    }
    return true;
  }
}
```

### 2. Nuevo Decorador
**Archivo:** `src/auth/require-roles.decorator.ts`
```typescript
@RequireRoles(['admin'])  // Uso simplificado
@Post()
create(@Body() createProductDto: CreateProductDto) { }
```

### 3. Controlador Actualizado
**Archivo:** `src/products/products.controller.ts`
- `POST /products` → Solo admin
- `PATCH /products/:id` → Solo admin
- `DELETE /products/:id` → Solo admin
- `GET /products` → Público
- `GET /products/:id` → Público

---

## 🧪 Cómo Testear

### 1. Crear usuario regular (user)
```bash
curl -X POST http://localhost:3000/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@example.com",
    "password": "Usuario123"
  }'
```

**Respuesta:**
```json
{
  "id": "uuid-user",
  "email": "usuario@example.com",
  "role": "user"
}
```

### 2. Crear usuario admin
```bash
# Vía base de datos (development)
# UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
```

O más fácil, crear uno directamente:

```bash
# 1. Registrarse normalmente
curl -X POST http://localhost:3000/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin123456"
  }'

# 2. Actualizar rol en BD con SQL
# En pgAdmin o psql:
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
```

### 3. Login con usuario regular
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@example.com",
    "password": "Usuario123"
  }'
```

**Respuesta:**
```json
{
  "access_token": "eyJhbGc...",
  "user": {
    "email": "usuario@example.com",
    "role": "user"
  }
}
```

### 4. Intentar crear producto como user (DEBE FALLAR)
```bash
curl -X POST http://localhost:3000/products \
  -H "Authorization: Bearer {access_token_de_user}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Producto Test",
    "price": 99.99
  }'
```

**Respuesta esperada (403):**
```json
{
  "statusCode": 403,
  "message": "Acceso denegado. Se requiere rol: admin. Tu rol: user"
}
```

### 5. Login con admin
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin123456"
  }'
```

### 6. Crear producto como admin (DEBE FUNCIONAR)
```bash
curl -X POST http://localhost:3000/products \
  -H "Authorization: Bearer {access_token_de_admin}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Producto Admin",
    "description": "Creado por admin",
    "price": 199.99,
    "isSubscription": false
  }'
```

**Respuesta esperada (201):**
```json
{
  "id": 1,
  "name": "Producto Admin",
  "description": "Creado por admin",
  "price": "199.99",
  "isSubscription": false
}
```

---

## ✅ Flujo de Seguridad

```
1. Usuario hace request a POST /products
    ↓
2. AuthGuard verifica JWT válido
    ↓
3. RolesGuard verifica user.role === 'admin'
    ↓
4a. Si es admin → Ejecuta controller
4b. Si es user/otro → Lanza ForbiddenException (403)
```

---

## 📊 Matriz de Permisos

| Endpoint | GET | POST | PATCH | DELETE |
|----------|-----|------|-------|--------|
| `/products` | ✅ Public | ✅ Admin | - | - |
| `/products/:id` | ✅ Public | - | ✅ Admin | ✅ Admin |

---

## 🔧 Extensiones Futuras

Para agregar más roles (ej: `moderator`, `premium_user`):

```typescript
// En require-roles.decorator.ts
@RequireRoles(['admin', 'moderator'])
@Delete(':id')
remove(@Param('id') id: number) { }
```

---

## 📝 Nota para Producción

Para crear admins de forma segura en producción:
1. Crear endpoint protegido `POST /admin/create` que solo otros admins puedan usar
2. O usar migraciones de BD con seed de datos iniciales
3. O panel admin con gestión de usuarios y roles

Ejemplo de seed en `database.sql`:
```sql
INSERT INTO users (id, email, password, role) VALUES
  ('uuid-1', 'admin@company.com', '$2b$10$hashedpass...', 'admin');
```
