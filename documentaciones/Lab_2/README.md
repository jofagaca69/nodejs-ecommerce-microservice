# Laboratory 2 - Integration Testing

## E-commerce Microservice - Pruebas de Integración

## 📋 Objetivo

Este laboratorio implementa las pruebas de integración para el **API Gateway** y el **Servicio de Autenticación (Auth)**. Verificamos tanto la **comunicación externa (HTTP)** a través del _Gateway_ como la **integración interna** del servicio con su base de datos **MongoDB**.

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

## 📚 Estructura del Proyecto

```
nodejs-ecommerce-microservice/
│
├── api-gateway/
│   ├── __tests__/
│   │   └── integration/
│   │       └── gateway-auth.test.js    # Pruebas de integración
│   ├── jest.config.js                  # Configuración de Jest
│   ├── index.js                        # Servidor API Gateway
│   └── package.json
│
├── auth/
│   ├── __tests__/
│   │   └── integration/
│   │       └── auth-db.test.js         # Pruebas de integración
│   ├── src/
│   │   ├── app.js                      # Servidor Auth
│   │   ├── controllers/
│   │   │   └── authController.js       # Controladores
│   │   └── ...
│   └── package.json
│
└── docker-compose.yml                  # Orquestación de servicios
```

---

## 🔍 Análisis de Cobertura

### Endpoints Probados

| Endpoint                  | Método | Casos de Prueba                      | Estado       |
| :------------------------ | :----- | :----------------------------------- | :----------- |
| `/auth/register`          | POST   | Registro exitoso, Registro duplicado | ✅ 2 tests   |
| `/auth/login`             | POST   | Login exitoso, Login fallido         | ✅ 2 tests   |
| `/auth/dashboard`         | GET    | Acceso con token válido              | ✅ 1 test    |
| `/auth/delete-test-users` | POST   | Limpieza (usado en hooks)            | ✅ Implícito |

| Área de Cobertura                                  | Prueba de Integración  |
| :------------------------------------------------- | :--------------------- |
| **Flujo Completo HTTP** (Gateway, Enrutamiento)    | `gateway-auth.test.js` |
| **Persistencia (DB)** y Hashing                    | `auth-db.test.js`      |
| **Lógica de Seguridad** (JWT, Comparación de Hash) | `auth-db.test.js`      |

**Total**: 10 pruebas de integración implementadas

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
