# Cómo Crear un Usuario Administrador

Este documento explica las diferentes formas de crear un usuario administrador para probar el sistema de login de admin.

## Método 1: Script Automático (Recomendado) 🚀

El método más fácil es usar el script proporcionado:

```bash
cd nodejs-ecommerce-microservice/auth
node scripts/create-admin.js <username> <password>
```

### Ejemplo:

```bash
cd nodejs-ecommerce-microservice/auth
node scripts/create-admin.js admin admin123
```

**Nota**: Asegúrate de que:
- MongoDB esté corriendo (puerto 27017)
- Las variables de entorno estén configuradas (`.env` o `MONGODB_AUTH_URI`)

## Método 2: Usando MongoDB directamente 🗄️

Si prefieres usar MongoDB directamente:

### Opción A: Usando mongosh (MongoDB Shell)

```bash
# Conectar a MongoDB
mongosh mongodb://localhost:27017/auth

# Crear usuario admin (reemplaza 'admin' y 'admin123' con tus credenciales)
use auth
db.users.insertOne({
  username: "admin",
  password: "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy", // hash de "admin123"
  role: "admin"
})
```

**⚠️ Problema**: Necesitas el hash de la contraseña. Para obtenerlo, puedes:

1. Usar el script de Node.js para generar el hash:
```javascript
const bcrypt = require('bcryptjs');
bcrypt.hash('admin123', 10).then(hash => console.log(hash));
```

2. O mejor, usar el método 1 (script automático) que hace esto por ti.

### Opción B: Actualizar un usuario existente

Si ya tienes un usuario creado y quieres convertirlo en admin:

```bash
mongosh mongodb://localhost:27017/auth

use auth
db.users.updateOne(
  { username: "tu_usuario_existente" },
  { $set: { role: "admin" } }
)
```

## Método 3: Usando el API de Registro + Actualización 🔌

### Paso 1: Registrar un usuario normal

```bash
curl -X POST http://localhost:3003/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

### Paso 2: Actualizar el rol a admin (requiere autenticación o acceso directo a DB)

Luego actualiza el rol en MongoDB como en el Método 2, Opción B.

## Método 4: Usando Docker (si usas contenedores) 🐳

Si estás usando Docker Compose:

```bash
# Ejecutar el script dentro del contenedor de auth
docker exec -it nodejs-ecommerce-microservice-auth-1 node scripts/create-admin.js admin admin123

# O conectarte a MongoDB directamente
docker exec -it mongodb-auth mongosh

# Luego usar los comandos del Método 2
```

## Verificación ✅

Después de crear el usuario admin, puedes verificar que funciona:

1. **Probar login desde el frontend**:
   - Ve a: `http://localhost:4200/admin/login`
   - Usa las credenciales que creaste

2. **Probar login desde API**:
```bash
curl -X POST http://localhost:3003/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123",
    "requireRole": "admin"
  }'
```

Deberías recibir un token JWT que incluye el campo `role: "admin"`.

## Credenciales de Ejemplo

Para pruebas rápidas, puedes usar:

- **Username**: `admin`
- **Password**: `admin123`
- **Role**: `admin`

**⚠️ IMPORTANTE**: Cambia estas credenciales en producción.

## Solución de Problemas 🔧

### Error: "Cannot connect to MongoDB"
- Verifica que MongoDB esté corriendo: `docker ps` o `mongod --version`
- Verifica la URI en `.env` o `MONGODB_AUTH_URI`

### Error: "User already exists"
- El script actualizará el usuario existente a rol admin automáticamente
- O elimina el usuario primero y vuelve a crearlo

### Error: "Script not found"
- Asegúrate de estar en el directorio correcto: `nodejs-ecommerce-microservice/auth`
- Verifica que el archivo existe: `ls scripts/create-admin.js`

## Notas Adicionales 📝

- El script usa `bcrypt` para hashear la contraseña automáticamente
- El rol por defecto es `'user'`, así que debes especificar `'admin'` explícitamente
- Puedes crear múltiples usuarios admin con diferentes usernames
- Los usuarios con rol `'employee'` también pueden acceder a rutas admin

