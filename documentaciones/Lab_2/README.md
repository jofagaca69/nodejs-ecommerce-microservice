# Laboratory 2 - Integration Testing

## E-commerce Microservice - Pruebas de Integración

## 📋 Objetivo

Este laboratorio implementa las pruebas de integración para el **API Gateway**, el **Servicio de Autenticación (Auth)**, y el **Servicio de Órdenes (Order)**. Verificamos tanto la **comunicación externa (HTTP)** a través del _Gateway_ como la **integración interna** de los servicios con su respectiva base de datos **MongoDB**.

## 🏗️ Arquitectura del Sistema

El proyecto utiliza una arquitectura de microservicios con un API Gateway como punto de entrada:

### Flujo de Peticiones

1. **Cliente** → Envía petición HTTP a `http://localhost:3003/auth/*`
2. **API Gateway** → Recibe la petición y la reenvía a `http://auth:3000/*`
3. **Auth Service** → Procesa la petición y retorna respuesta
4. **API Gateway** → Retorna la respuesta al cliente

---

## 🧪 Pruebas de Integración Implementadas

### 📁 Ubicación

- **Directorio**: `api-gateway/__tests__/integration/`
- **Archivo**: `gateway-auth.test.js`
- **Framework**: Jest
- **Cliente HTTP**: Axios

### 🎯 Objetivo de las Pruebas

Validar que el API Gateway:

- ✅ Enruta correctamente las peticiones al servicio de Auth
- ✅ Preserva los datos de la petición (body, headers)
- ✅ Retorna correctamente las respuestas del servicio
- ✅ Maneja adecuadamente los códigos de estado HTTP
- ✅ Gestiona errores y respuestas de error

---

## 📊 Descripción Detallada de Pruebas

### Configuración de Pruebas

```javascript
const gatewayUrl = "http://localhost:3003";

beforeEach(async () => {
  await axios.post(`${gatewayUrl}/auth/delete-test-users`);
});

afterEach(async () => {
  await axios.post(`${gatewayUrl}/auth/delete-test-users`);
});
```

**Propósito**: Limpiar usuarios de prueba antes y después de cada test para asegurar independencia entre pruebas.

---

### 1. **Registro Exitoso** ✅

**Test ID**: `INT-001`

**Descripción**: Verifica que un usuario puede registrarse correctamente a través del API Gateway.

**Flujo**:

1. Cliente envía petición POST a `/auth/register` con credenciales válidas
2. API Gateway reenvía la petición al servicio Auth
3. Servicio Auth crea el usuario en la base de datos
4. Respuesta se retorna a través del gateway

**Código**:

```15:26:api-gateway/__tests__/integration/gateway-auth.test.js
  it("Registro exitoso: Debe devolver la información del usuario registrado", async () => {

    const user = {
      username: "testuser",
      password: "password123"
    };

    const response = await axios.post(`${gatewayUrl}/auth/register`, user);

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty("username", "testuser");
  });
```

**Validaciones**:

- ✅ Status code: `200 OK`
- ✅ Response body contiene `username` con el valor esperado

**Resultado Esperado**:

```
✓ Registro exitoso: Debe devolver la información del usuario registrado
```

---

### 2. **Registro Fallido: Username Duplicado** ❌

**Test ID**: `INT-002`

**Descripción**: Verifica que el sistema rechaza correctamente intentos de registro con un username ya existente.

**Flujo**:

1. Se registra un usuario con username "testuser"
2. Se intenta registrar otro usuario con el mismo username
3. El servicio Auth detecta el duplicado
4. Se retorna error 400 a través del gateway

**Código**:

```28:42:api-gateway/__tests__/integration/gateway-auth.test.js
  it("Registro fallido: username ya existe", async () => {
    const user = {
      username: "testuser",
      password: "password123"
    };

    await axios.post(`${gatewayUrl}/auth/register`, user);

    const err = await axios
      .post(`${gatewayUrl}/auth/register`, user)
      .catch(e => e);

    expect(err.response.status).toBe(400);
    expect(err.response.data).toHaveProperty("message", "Username already taken");
  });
```

**Validaciones**:

- ✅ Status code: `400 Bad Request`
- ✅ Response body contiene mensaje de error: "Username already taken"

**Resultado Esperado**:

```
✓ Registro fallido: username ya existe
```

---

### 3. **Login Exitoso** ✅

**Test ID**: `INT-003`

**Descripción**: Verifica que un usuario registrado puede autenticarse y obtener un token JWT.

**Flujo**:

1. Se registra un usuario
2. Cliente envía petición POST a `/auth/login` con credenciales válidas
3. API Gateway reenvía al servicio Auth
4. Servicio Auth valida credenciales y genera token JWT
5. Token se retorna a través del gateway

**Código**:

```44:57:api-gateway/__tests__/integration/gateway-auth.test.js
  it("Login exitoso: Debe devolver el token de autenticación", async () => {

    const user = {
      username: "testuser",
      password: "password123"
    };

    await axios.post(`${gatewayUrl}/auth/register`, user);

    const response = await axios.post(`${gatewayUrl}/auth/login`, user);

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty("token");
  });
```

**Validaciones**:

- ✅ Status code: `200 OK`
- ✅ Response body contiene propiedad `token`

**Resultado Esperado**:

```
✓ Login exitoso: Debe devolver el token de autenticación
```

---

### 4. **Login Erróneo: Credenciales Inválidas** ❌

**Test ID**: `INT-004`

**Descripción**: Verifica que el sistema rechaza correctamente intentos de login con credenciales incorrectas.

**Flujo**:

1. Se registra un usuario con credenciales válidas
2. Se intenta hacer login con credenciales diferentes
3. El servicio Auth valida y rechaza las credenciales
4. Se retorna error 400 a través del gateway

**Código**:

```59:79:api-gateway/__tests__/integration/gateway-auth.test.js
  it("Login erroneo: Debe devolver mensaje de error", async () => {

    const user = {
      username: "testuser",
      password: "password123"
    };

    const userIncorrect = {
      username: "prueba",
      password: "contra"
    };

    await axios.post(`${gatewayUrl}/auth/register`, user);

    const err = await axios.post(`${gatewayUrl}/auth/login`, userIncorrect)
      .catch(e => e);

    expect(err.response.status).toBe(400);
    expect(err.response.data).toHaveProperty("message", "Invalid username or password");

  });
```

**Validaciones**:

- ✅ Status code: `400 Bad Request`
- ✅ Response body contiene mensaje de error: "Invalid username or password"

**Resultado Esperado**:

```
✓ Login erroneo: Debe devolver mensaje de error
```

---

### 5. **Autenticación con Token: Acceso a Dashboard** ✅

**Test ID**: `INT-005`

**Descripción**: Verifica que un usuario autenticado puede acceder a rutas protegidas usando el token JWT.

**Flujo**:

1. Se registra un usuario
2. Se hace login y se obtiene un token JWT
3. Cliente envía petición GET a `/auth/dashboard` con header `x-auth-token`
4. API Gateway reenvía la petición con el header al servicio Auth
5. Servicio Auth valida el token y permite el acceso
6. Se retorna respuesta exitosa

**Código**:

```82:99:api-gateway/__tests__/integration/gateway-auth.test.js
  it("Autenticación exitosa con token", async () => {

    const user = {
      username: "testuser",
      password: "password123"
    };

    await axios.post(`${gatewayUrl}/auth/register`, user);

    const responseLogin = await axios.post(`${gatewayUrl}/auth/login`, user);
    const token = responseLogin.data.token;

    const response = await axios.get(`${gatewayUrl}/auth/dashboard`, {
      headers: { "x-auth-token": token }
    });

    expect(response.status).toBe(200);
  });
```

**Validaciones**:

- ✅ Status code: `200 OK`
- ✅ El token JWT es válido y permite acceso a rutas protegidas

**Resultado Esperado**:

```
✓ Autenticación exitosa con token
```

---

## 📋 Tabla de Diseño de Pruebas de Integración

| Test ID     | Escenario                              | Endpoint          | Método | Input                              | Expected Status | Expected Response                           | Estado |
| :---------- | :------------------------------------- | :---------------- | :----- | :--------------------------------- | :-------------- | :------------------------------------------ | :----- |
| **INT-001** | Registro exitoso                       | `/auth/register`  | POST   | `{username, password}`             | `200`           | `{username}`                                | ✅     |
| **INT-002** | Registro fallido (duplicado)           | `/auth/register`  | POST   | `{username, password}` (duplicado) | `400`           | `{message: "Username already taken"}`       | ✅     |
| **INT-003** | Login exitoso                          | `/auth/login`     | POST   | `{username, password}` (válidos)   | `200`           | `{token}`                                   | ✅     |
| **INT-004** | Login fallido (credenciales inválidas) | `/auth/login`     | POST   | `{username, password}` (inválidos) | `400`           | `{message: "Invalid username or password"}` | ✅     |
| **INT-005** | Acceso con token                       | `/auth/dashboard` | GET    | Header: `x-auth-token`             | `200`           | Respuesta exitosa                           | ✅     |

---

## 🧪 Pruebas de Integración - Gateway → Products

Estas pruebas validan la comunicación HTTP entre el **API Gateway** y el **Product Service**, verificando que el enrutamiento, autenticación y respuestas funcionen correctamente.

### 📁 Ubicación

- **Directorio**: `api-gateway/__tests__/integration/`
- **Archivo**: `gateway-products.test.js`
- **Framework**: Jest
- **Cliente HTTP**: Axios

### 🎯 Objetivo de las Pruebas

Validar que el API Gateway:

- ✅ Enruta correctamente las peticiones al servicio de Products
- ✅ Valida la autenticación con tokens JWT en cada petición
- ✅ Preserva los datos de la petición (body, headers)
- ✅ Retorna correctamente las respuestas del servicio
- ✅ Maneja adecuadamente los códigos de estado HTTP (201, 200, 400, 401)
- ✅ Gestiona errores de validación y autenticación

---

### 📊 Tabla de Diseño de Pruebas de Integración - Gateway → Products

| Test ID | Escenario | Endpoint | Método | Input | Expected Status | Expected Response | Estado |
|:--------|:----------|:---------|:-------|:------|:----------------|:------------------|:-------|
| **PROD-INT-001** | Crear producto exitosamente | `/products/api/products` | POST | `{name, description, price}` + Token | `201` | Producto con `_id` generado | ✅ |
| **PROD-INT-002** | Rechazar sin autenticación | `/products/api/products` | POST | `{name, description, price}` sin Token | `401` | `{message: "Unauthorized"}` | ✅ |
| **PROD-INT-003** | Listar productos con auth | `/products/api/products` | GET | Header con Token válido | `200` | Array de productos | ✅ |
| **PROD-INT-004** | Rechazar listado sin auth | `/products/api/products` | GET | Sin Token | `401` | `{message: "Unauthorized"}` | ✅ |
| **PROD-INT-005** | Validar campos requeridos | `/products/api/products` | POST | `{name}` (sin price) + Token | `400` | Mensaje de error de validación | ✅ |
| **PROD-INT-006** | Crear múltiples productos | `/products/api/products` | POST | 3 productos válidos + Token | `201` | 3 productos creados con IDs | ✅ |
| **PROD-INT-007** | Verificar estructura API | `/products/api/products` | POST | Producto válido + Token | `201` | Estructura correcta con tipos | ✅ |

**Total**: 7 pruebas de integración Gateway ↔ Products

---

### 📝 Descripción Detallada de Pruebas

#### PROD-INT-001: Crear Producto Exitosamente ✅

**Descripción**: Verifica que un usuario autenticado puede crear un producto a través del API Gateway.

**Flujo**:
1. Usuario obtiene token JWT mediante login
2. Cliente envía POST a `/products/api/products` con token en header
3. API Gateway valida y reenvía al Product Service
4. Product Service crea el producto en MongoDB
5. Respuesta con producto creado (incluyendo `_id`) se retorna al cliente

**Validaciones**:
- ✅ Status code: `201 Created`
- ✅ Response contiene `_id`, `name`, `description`, `price`
- ✅ Valores coinciden con los enviados

**Código de referencia**:
```javascript
it("PROD-INT-001: Debe crear un producto exitosamente...", async () => {
  const product = {
    name: "Laptop Test",
    description: "Laptop de prueba para testing",
    price: 1299.99
  };

  const response = await axios.post(
    `${gatewayUrl}/products/api/products`,
    product,
    { headers: { Authorization: `Bearer ${authToken}` } }
  );

  expect(response.status).toBe(201);
  expect(response.data).toHaveProperty("_id");
  expect(response.data.name).toBe(product.name);
});
```

---

#### PROD-INT-002: Rechazar Sin Autenticación ❌

**Descripción**: Verifica que el sistema rechaza intentos de crear productos sin token de autenticación.

**Flujo**:
1. Cliente envía POST sin header `Authorization`
2. Product Service o Gateway detecta falta de autenticación
3. Se retorna error 401

**Validaciones**:
- ✅ Status code: `401 Unauthorized`
- ✅ Response contiene mensaje de error

---

#### PROD-INT-003: Listar Productos Con Autenticación ✅

**Descripción**: Verifica que un usuario autenticado puede obtener la lista de productos.

**Flujo**:
1. Cliente envía GET a `/products/api/products` con token válido
2. API Gateway reenvía al Product Service
3. Product Service consulta MongoDB y retorna productos
4. Array de productos se retorna al cliente

**Validaciones**:
- ✅ Status code: `200 OK`
- ✅ Response es un array
- ✅ Array contiene al menos un producto
- ✅ Cada producto tiene estructura correcta (`_id`, `name`, `price`, `description`)

---

#### PROD-INT-004: Rechazar Listado Sin Autenticación ❌

**Descripción**: Verifica que el listado de productos requiere autenticación.

**Validaciones**:
- ✅ Status code: `401 Unauthorized`
- ✅ Mensaje: "Unauthorized"

---

#### PROD-INT-005: Validar Campos Requeridos ❌

**Descripción**: Verifica que el sistema valida campos requeridos del modelo de producto.

**Flujo**:
1. Cliente envía POST con datos incompletos (ej: sin `price`)
2. Mongoose/Product Service valida el esquema
3. Se retorna error 400 con detalles de validación

**Validaciones**:
- ✅ Status code: `400 Bad Request`
- ✅ Response contiene mensaje descriptivo del error

---

#### PROD-INT-006: Crear Múltiples Productos ✅

**Descripción**: Verifica que se pueden crear varios productos secuencialmente manteniendo la integridad de datos.

**Flujo**:
1. Se crean 3 productos diferentes en secuencia
2. Cada uno se guarda exitosamente en MongoDB
3. Cada respuesta contiene el producto con su `_id` único

**Validaciones**:
- ✅ 3 productos creados exitosamente
- ✅ Cada uno tiene `_id` único
- ✅ Datos preservados correctamente

---

#### PROD-INT-007: Verificar Estructura de API ✅

**Descripción**: Verifica que la respuesta del API tiene la estructura correcta con tipos de datos apropiados.

**Validaciones**:
- ✅ Status code: `201 Created`
- ✅ `_id` es string no vacío
- ✅ `name` coincide con el enviado
- ✅ `description` coincide con el enviado
- ✅ `price` coincide con el enviado
- ✅ Todos los campos esperados están presentes

---

### 🚀 Ejecutar Pruebas Gateway → Products

#### Prerrequisitos

1. **Servicios en ejecución**:
   - API Gateway (puerto 3003)
   - Product Service (puerto 3001)
   - Auth Service (puerto 3000) - para obtener tokens
   - MongoDB para Products (puerto 27019)
   - RabbitMQ (puerto 5672)

2. **Configuración de Entorno**:
   - Mismo `JWT_SECRET` en `auth/.env` y `product/.env`

#### Ejecución

```bash
# Con Docker Compose (Recomendado)
docker-compose up -d

# Ejecutar tests
cd api-gateway
npm test -- gateway-products.test.js
```

#### Resultado Esperado

```
PASS  __tests__/integration/gateway-products.test.js
  Gateway <--> Product microservice integration
    ✓ PROD-INT-001: Debe crear un producto exitosamente con todos los campos (115 ms)
    ✓ PROD-INT-002: Debe rechazar creación de producto sin token de autenticación (181 ms)
    ✓ PROD-INT-003: Debe listar todos los productos con autenticación válida (80 ms)
    ✓ PROD-INT-004: Debe rechazar listado de productos sin token de autenticación (22 ms)
    ✓ PROD-INT-005: Debe rechazar producto sin campos requeridos (26 ms)
    ✓ PROD-INT-006: Debe crear múltiples productos secuencialmente (74 ms)
    ✓ PROD-INT-007: Debe retornar la estructura correcta al crear producto (26 ms)

Test Suites: 1 passed, 1 total
Tests:       7 passed, 7 total
Time:        3.513 s
```

---

### ✅ Criterios de Éxito - Gateway → Products

- ✅ **Independencia**: Cada prueba crea y limpia sus propios datos
- ✅ **Autenticación**: Tests validan JWT en cada operación protegida
- ✅ **Integración Real**: Usa servicios reales (no mocks)
- ✅ **Flujo Completo**: Cliente → Gateway → Product Service → MongoDB → respuesta
- ✅ **Validación de Errores**: Casos de éxito y error cubiertos
- ✅ **Determinístico**: Resultados reproducibles

---

### 📚 Diferencias Clave vs Gateway → Auth

| Aspecto | Gateway → Auth | Gateway → Products |
|:--------|:--------------|:------------------|
| **Header Auth** | `x-auth-token` | `Authorization: Bearer` |
| **Operaciones** | Register, Login, Dashboard | CRUD de productos |
| **Códigos Status** | 200, 400 | 200, 201, 400, 401 |
| **Dependencias** | Solo MongoDB | MongoDB + RabbitMQ |
| **Autenticación** | Genera tokens | Consume tokens |

---

## 🧪 Pruebas de Integración Interna (Auth Service)

Estas pruebas se ejecutan dentro del servicio **Auth** y se enfocan en la lógica de negocio y la persistencia, aislando la capa HTTP.

### 📁 Ubicación

- **Directorio**: `auth/__tests__/integration/`
- **Archivo**: `auth-db.test.js`
- **Herramientas**: `bcryptjs`, `jsonwebtoken`, `mongoose` (MongoDB).

### 🎯 Objetivo de las Pruebas

Validar la **lógica de negocio y seguridad** del **Auth Service**:

- ✅ El _hashing_ de contraseñas con `bcrypt` y el guardado con `Mongoose` funcionan.
- ✅ La generación y validación del **Token JWT** es correcta.
- ✅ El servicio maneja errores de persistencia y lógica.

### 📊 Descripción Detallada de Pruebas (auth-db.test.js)

| Test ID          | Escenario                    | Método de Servicio Llamado | Validaciones Clave                                                        | Estado |
| :--------------- | :--------------------------- | :------------------------- | :------------------------------------------------------------------------ | :----- |
| **INT-AUTH-001** | Registro Exitoso             | `authService.register`     | ✅ El hash guardado es validable con `bcrypt.compare`.                    | ✅     |
| **INT-AUTH-004** | Registro Fallido (Duplicado) | `authService.register`     | ✅ Se lanza el error de negocio `"Username already taken"`.               | ✅     |
| **INT-AUTH-002** | Login Exitoso                | `authService.login`        | ✅ Retorna `{ success: true, token }` y el JWT es válido.                 | ✅     |
| **INT-AUTH-003** | Login Fallido (Contraseña)   | `authService.login`        | ✅ Retorna `{ success: false, message: "Invalid username or password" }`. | ✅     |
| **INT-AUTH-005** | Login Fallido (No Existe)    | `authService.login`        | ✅ Retorna `{ success: false, message: "Invalid username or password" }`. | ✅     |

---

## 🚀 Ejecutar Pruebas de Integración

### Prerrequisitos

1. **Servicios en ejecución**:

   - API Gateway (puerto 3003)
   - Servicio Auth (puerto 3000)
   - MongoDB para el servicio Auth

2. **Dependencias instaladas**:

   ```bash
   cd api-gateway
   npm install

   cd ..
   cd auth
   npm install
   ```

### Ejecución Local

#### Con Docker Compose (Recomendado)

```bash
# 1. Levantar todos los servicios
docker-compose up -d

# 2. Esperar a que los servicios estén listos
docker-compose ps

# 3. Ejecutar las pruebas de integración
cd api-gateway
npm test

cd ..
cd auth
npm test:integration
```

---

## ✅ Criterios de Éxito

### Pruebas de Integración

- ✅ Cada prueba es independiente (limpieza antes y después)
- ✅ Las pruebas validan el flujo completo Gateway → Auth Service
- ✅ Se validan casos de éxito y casos de error
- ✅ Se verifica el enrutamiento correcto de peticiones
- ✅ Se valida la preservación de headers (especialmente `x-auth-token`)
- ✅ Se verifica el manejo correcto de códigos de estado HTTP
- ✅ Las pruebas son determinísticas y reproducibles

---

## 🎓 Principios Aplicados

### ¿Por qué Pruebas de Integración?

1. **Validación End-to-End**: Las pruebas verifican que todos los componentes trabajan juntos correctamente
2. **Detección de Problemas de Integración**: Identifican problemas que no aparecen en pruebas unitarias (enrutamiento, headers, formato de respuestas)
3. **Confianza en el Sistema**: Aseguran que el API Gateway funciona correctamente como intermediario
4. **Documentación Viva**: Los tests sirven como documentación de cómo usar el sistema

### Aislamiento vs Integración

- **Pruebas Unitarias** (Lab 1): Aíslan componentes individuales usando fakes
- **Pruebas de Integración** (Lab 2): Validan la comunicación entre servicios reales

### Limpieza de Datos

Cada prueba limpia los datos de prueba antes y después de ejecutarse usando el endpoint `/auth/delete-test-users`. Esto asegura:

- Independencia entre pruebas
- No hay efectos secundarios entre ejecuciones
- Reproducibilidad de resultados

---

## 🧪 Pruebas de Integración - Order Service (Backend ↔ Database)

### 📁 Ubicación

- **Directorio**: `order/__tests__/integration/`
- **Archivo**: `order-db.test.js`
- **Framework**: Jest
- **Base de Datos**: MongoDB (puerto 27018 - Docker) 
- **ODM**: Mongoose

### 🎯 Objetivo de las Pruebas

Validar la **integración entre el Backend del Order Service y MongoDB**:

- ✅ Persistencia correcta de órdenes en la base de datos
- ✅ Cálculo y almacenamiento del precio total
- ✅ Validación del esquema de datos en MongoDB
- ✅ Manejo de casos límite (productos vacíos, datos inválidos)
- ✅ Operaciones CRUD completas (Create, Read, Update, Delete)
- ✅ Consultas con múltiples documentos

---

### 📊 Tabla de Diseño de Pruebas de Integración - Order Service

| Test ID          | Escenario                                    | Operación DB  | Validaciones Clave                                                                          | Estado |
| :--------------- | :------------------------------------------- | :------------ | :------------------------------------------------------------------------------------------ | :----- |
| **ORDER-INT-001** | Crear y persistir orden                      | `save()`      | ✅ Orden existe en DB<br>✅ `user` correcto<br>✅ 2 productos<br>✅ `totalPrice` correcto   | ✅     |
| **ORDER-INT-002** | Calcular precio total                        | `save()`      | ✅ `totalPrice` = suma de precios (36.50)                                                   | ✅     |
| **ORDER-INT-003** | Validar esquema MongoDB                      | `save()`, `lean()` | ✅ Tiene `_id`, `user`, `products`, `totalPrice`, `createdAt`<br>✅ Tipos correctos         | ✅     |
| **ORDER-INT-004** | Manejar productos vacíos                     | `save()`      | ✅ Orden guardada<br>✅ `products` array vacío<br>✅ `totalPrice = 0`                       | ✅     |
| **ORDER-INT-005** | Rechazar orden sin campo `user`              | `save()`      | ✅ Lanza error de validación                                                                | ✅     |
| **ORDER-INT-006** | Rechazar orden con `totalPrice` negativo     | `save()`      | ✅ Lanza error de validación (`min: 0`)                                                     | ✅     |
| **ORDER-INT-007** | Actualizar orden existente                   | `save()` (2x) | ✅ `totalPrice` actualizado<br>✅ Producto agregado al array                                | ✅     |
| **ORDER-INT-008** | Eliminar orden                               | `deleteOne()` | ✅ Orden eliminada de DB<br>✅ `findOne()` retorna `null`                                   | ✅     |
| **ORDER-INT-009** | Consultar múltiples órdenes del mismo usuario| `find()`      | ✅ Retorna 3 órdenes<br>✅ Suma total de precios = 225                                      | ✅     |

**Total**: 9 pruebas de integración Backend ↔ Database

---

### 🚀 Ejecutar Pruebas de Order Service

#### Prerrequisitos

1. **MongoDB corriendo** (puerto 27018):
   ```bash
   docker-compose up -d mongodb-order
   ```

2. **Dependencias instaladas**:
   ```bash
   cd order
   npm install
   ```

#### Ejecución Local

```bash
# 1. Asegurar que MongoDB Order está corriendo
docker ps --filter "name=mongodb-order"

# 2. Ejecutar pruebas
cd order
npm run test:integration
```

#### Resultado Esperado

```
 PASS  __tests__/integration/order-db.test.js
  Order Service <--> MongoDB Integration Tests
    ✓ ORDER-INT-001: Debe crear y persistir una orden en MongoDB (25 ms)
    ✓ ORDER-INT-002: Debe calcular y persistir correctamente el precio total (7 ms)
    ✓ ORDER-INT-003: Debe validar el esquema correcto en MongoDB (8 ms)
    ✓ ORDER-INT-004: Debe manejar órdenes con productos vacíos (6 ms)
    ✓ ORDER-INT-005: Debe rechazar órdenes sin campo user requerido (7 ms)
    ✓ ORDER-INT-006: Debe rechazar órdenes con totalPrice negativo (3 ms)
    ✓ ORDER-INT-007: Debe actualizar una orden existente (17 ms)
    ✓ ORDER-INT-008: Debe eliminar una orden de la base de datos (6 ms)
    ✓ ORDER-INT-009: Debe consultar múltiples órdenes del mismo usuario (11 ms)

Test Suites: 1 passed, 1 total
Tests:       9 passed, 9 total
```

---

### ✅ Criterios de Éxito - Order Service

- ✅ **Aislamiento**: Cada prueba limpia datos antes y después (`afterEach`)
- ✅ **Integración Real**: Usa MongoDB real (no mocks)
- ✅ **Flujo Completo**: Valida Backend → MongoDB → Backend
- ✅ **Validación de Datos**: Verifica estructura de documentos en MongoDB
- ✅ **Manejo de Errores**: Prueba casos límite y validaciones del esquema
- ✅ **Reproducibilidad**: Tests determinísticos y repetibles
- ✅ **Operaciones CRUD**: Cubre Create, Read, Update, Delete


### 📚 Modelo de Datos - Order

```javascript
const orderSchema = new mongoose.Schema({
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'products',
    required: true,
  }],
  user: {
    type: String,
    required: true,
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { collection : 'orders' });
```

**Campos**:
- `products`: Array de ObjectIds que referencian productos
- `user`: String con el username del usuario que hizo la orden
- `totalPrice`: Number con validación `min: 0`
- `createdAt`: Date generado automáticamente

---

## 🧪 Pruebas de Integración - Product Service (Backend ↔ Database)

### 📁 Ubicación

- **Directorio**: `product/__tests__/integration/`
- **Archivo**: `product-db.test.js`
- **Framework**: Jest
- **Base de Datos**: MongoDB (puerto 27019 - Docker)

### 🎯 Objetivo

Validar la integración entre el Backend del Product Service y MongoDB: persistencia, validación de esquema, operaciones CRUD y manejo de campos requeridos/opcionales.

### 📊 Resumen de Tests

| Test ID | Escenario | Estado |
|---------|-----------|--------|
| **PROD-INT-001** | Crear y persistir producto | ✅ |
| **PROD-INT-002** | Validar esquema MongoDB | ✅ |
| **PROD-INT-003** | Rechazar sin campo `name` | ✅ |
| **PROD-INT-004** | Rechazar sin campo `price` | ✅ |
| **PROD-INT-005** | Manejar `description` opcional | ✅ |
| **PROD-INT-006** | Actualizar producto | ✅ |
| **PROD-INT-007** | Eliminar producto | ✅ |
| **PROD-INT-008** | Consultar múltiples productos | ✅ |
| **PROD-INT-009** | Buscar por ID | ✅ |

**Total**: 9 pruebas de integración Backend ↔ Database

### 🚀 Ejecutar

```bash
cd product
npm run test:integration
```

**Resultado**: ✅ 9 tests pasando

---
## 📚 Estructura del Proyecto

```
nodejs-ecommerce-microservice/
│
├── api-gateway/
│   ├── __tests__/
│   │   └── integration/
│   │       ├── gateway-auth.test.js    # Pruebas de integración Gateway ↔ Auth
│   │       └── gateway-products.test.js # Pruebas de integración Gateway ↔ Products
│   ├── jest.config.js                  # Configuración de Jest
│   ├── index.js                        # Servidor API Gateway
│   └── package.json
│
├── auth/
│   ├── __tests__/
│   │   └── integration/
│   │       └── auth-db.test.js         # Pruebas de integración Auth ↔ MongoDB
│   ├── src/
│   │   ├── app.js                      # Servidor Auth
│   │   ├── controllers/
│   │   │   └── authController.js       # Controladores
│   │   ├── services/
│   │   │   └── authService.js          # Lógica de negocio
│   │   ├── repositories/
│   │   │   └── userRepository.js       # Acceso a datos
│   │   ├── models/
│   │   │   └── user.js                 # Modelo de Usuario
│   │   └── middlewares/
│   │       └── authMiddleware.js       # Middleware de autenticación
│   └── package.json
│
├── order/
│   ├── __tests__/
│   │   └── integration/
│   │       ├── order-db.test.js        # Pruebas de integración Order ↔ MongoDB  
│   ├── src/
│   │   ├── app.js                      # Servidor Order + RabbitMQ Consumer
│   │   ├── models/
│   │   │   └── order.js                # Modelo de Orden
│   │   ├── config.js                   # Configuración
│   │   └── utils/
│   │       ├── isAuthenticated.js      # Middleware de autenticación
│   │       └── messageBroker.js        # Utilidades RabbitMQ
│   ├── jest.config.js                  # Configuración de Jest
│   └── package.json
│
├── product/
│   ├── __tests__/
│   │   └── integration/
│   │       └── product-db.test.js      # Pruebas de integración Product ↔ MongoDB
│   ├── src/
│   │   ├── app.js                      # Servidor Product
│   │   ├── models/
│   │   │   └── product.js              # Modelo de Producto
│   │   └── ...
│   ├── jest.config.js                  # Configuración de Jest
│   └── package.json
│
└── docker-compose.yml                  # Orquestación de servicios
```

---

## 🔍 Análisis de Cobertura

### Servicios con Pruebas de Integración

| Servicio       | Tipo de Integración   | Archivo de Pruebas          | Tests Implementados |
| :------------- | :-------------------- | :-------------------------- | :------------------ |
| **API Gateway**| Gateway ↔ Auth        | `gateway-auth.test.js`      | 5 tests ✅          |
| **API Gateway**| Gateway ↔ Products    | `gateway-products.test.js`  | 7 tests ✅          |
| **Auth**       | Backend ↔ MongoDB     | `auth-db.test.js`           | 5 tests ✅          |
| **Order**      | Backend ↔ MongoDB     | `order-db.test.js`          | 9 tests ✅          |
| **Product**    | Backend ↔ MongoDB     | `product-db.test.js`        | 9 tests ✅          |

**Total**: **35 pruebas de integración** implementadas

---

### Endpoints Probados a Través del Gateway

#### Auth Service

| Endpoint                  | Método | Casos de Prueba                      | Estado       |
| :------------------------ | :----- | :----------------------------------- | :----------- |
| `/auth/register`          | POST   | Registro exitoso, Registro duplicado | ✅ 2 tests   |
| `/auth/login`             | POST   | Login exitoso, Login fallido         | ✅ 2 tests   |
| `/auth/dashboard`         | GET    | Acceso con token válido              | ✅ 1 test    |
| `/auth/delete-test-users` | POST   | Limpieza (usado en hooks)            | ✅ Implícito |

#### Product Service

| Endpoint                   | Método | Casos de Prueba                                              | Estado       |
| :------------------------- | :----- | :----------------------------------------------------------- | :----------- |
| `/products/api/products`   | POST   | Crear con auth, Rechazar sin auth, Validar campos, Múltiples | ✅ 4 tests   |
| `/products/api/products`   | GET    | Listar con auth, Rechazar sin auth, Verificar estructura     | ✅ 3 tests   |

---

### Operaciones Probadas (Order Service)

| Operación                | Método Mongoose | Casos de Prueba                                      | Estado     |
| :----------------------- | :-------------- | :--------------------------------------------------- | :--------- |
| **Create** (Persistencia)| `save()`        | Crear orden, Productos vacíos                        | ✅ 2 tests |
| **Read** (Consultas)     | `findOne()`, `find()` | Consultar orden, Múltiples órdenes                   | ✅ 2 tests |
| **Update** (Modificación)| `save()`        | Actualizar orden existente                           | ✅ 1 test  |
| **Delete** (Eliminación) | `deleteOne()`   | Eliminar orden                                       | ✅ 1 test  |
| **Validaciones**         | `save()`        | Rechazar sin user, Precio negativo, Validar esquema  | ✅ 3 tests |

---

### Cobertura por Área

| Área de Cobertura                                  | Servicio | Prueba de Integración      |
| :------------------------------------------------- | :------- | :------------------------- |
| **Flujo Completo HTTP** (Gateway, Enrutamiento)    | Auth     | `gateway-auth.test.js`     |
| **Flujo Completo HTTP** (Gateway, Enrutamiento)    | Product  | `gateway-products.test.js` |
| **Autenticación con JWT** (Headers, Bearer Token)  | Product  | `gateway-products.test.js` |
| **CRUD a través del Gateway**                      | Product  | `gateway-products.test.js` |
| **Persistencia (DB)** y Hashing                    | Auth     | `auth-db.test.js`          |
| **Lógica de Seguridad** (JWT, Comparación de Hash) | Auth     | `auth-db.test.js`          |
| **Operaciones CRUD en MongoDB**                    | Order    | `order-db.test.js`         |
| **Validaciones de Esquema**                        | Order    | `order-db.test.js`         |
| **Operaciones CRUD en MongoDB**                    | Product  | `product-db.test.js`       |
| **Validaciones de Esquema**                        | Product  | `product-db.test.js`       |

---

**Total acumulado**: 35 pruebas de integración

- **Auth Service**: 10 pruebas (5 gateway + 5 backend-db)
- **Product Service**: 16 pruebas (7 gateway + 9 backend-db)
- **Order Service**: 9 pruebas (backend-db)

---

## 📚 Referencias

- **Laboratorio Original**: Laboratory 2 - Integration Testing (SQ_2025ii)
- **Herramientas**:
  - Jest (framework de testing)
  - Axios (cliente HTTP)
  - Express (servidor API Gateway)
  - http-proxy (proxy HTTP)
  - Docker Compose (orquestación)

---
