# Laboratory 1 - Unit Testing
## E-commerce Microservice - Pruebas Unitarias

## 📋 Objetivo

Este laboratorio implementa pruebas unitarias siguiendo una arquitectura multi-tier para el sistema de e-commerce con microservicios. Se enfoca en dos niveles de pruebas:

1. **Pruebas de Base de Datos (Nivel 1)**: Validación directa de operaciones CRUD en MongoDB
2. **Pruebas Unitarias de Backend (Nivel 2)**: Validación de lógica de negocio con fakes (dobles de prueba)

---

## 🏗️ Arquitectura del Sistema

El proyecto utiliza una arquitectura de microservicios:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Auth Service  │     │ Product Service │     │  Order Service  │
│   (MongoDB)     │     │   (MongoDB +    │     │   (MongoDB +    │
│                 │     │   RabbitMQ)     │     │   RabbitMQ)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │                       │
         └───────────────────────┴───────────────────────┘
                                 │
                    ┌────────────────────┐
                    │   API Gateway      │
                    └────────────────────┘
```

---

## 📊 Nivel 1: Pruebas de Base de Datos (MongoDB)

### 🎯 Objetivo

Validar las operaciones CRUD directamente en MongoDB sin dependencias del código de aplicación. Estas pruebas aseguran que la base de datos funciona correctamente y que las restricciones del esquema se cumplen.

### 📁 Ubicación

- **Servicio**: `auth`
- **Directorio**: `auth/src/db-tests/`

### 🧪 Pruebas Implementadas

#### 1. **test_insert.js** - Prueba de Inserción

**Propósito**: Validar que los usuarios se pueden insertar correctamente en MongoDB.

**Operaciones**:
- Limpia usuarios de prueba previos
- Inserta un nuevo usuario de prueba
- Verifica que el usuario fue insertado correctamente
- Limpia el usuario de prueba creado

**Resultado esperado**:
```
✓ Test INSERT pasado: Usuario insertado correctamente
```

#### 2. **test_select.js** - Prueba de Selección

**Propósito**: Validar que los usuarios se pueden leer correctamente desde MongoDB.

**Operaciones**:
- Inserta un usuario de prueba
- Busca el usuario por username
- Verifica que el usuario fue encontrado
- Limpia el usuario de prueba

**Resultado esperado**:
```
Test SELECT pasado: Usuario encontrado correctamente
```

#### 3. **test_constraints.js** - Prueba de Restricciones

**Propósito**: Validar que las restricciones del esquema de Mongoose funcionan correctamente.

**Operaciones**:
- Intenta crear un usuario sin `username` (debe fallar)
- Verifica que se lanza error de validación
- Intenta crear un usuario sin `password` (debe fallar)
- Verifica que se lanza error de validación

**Resultado esperado**:
```
Test CONSTRAINTS pasado: Restricción de username funciona
Test CONSTRAINTS pasado: Restricción de password funciona
```

### 📋 Tabla de Diseño de Pruebas de Base de Datos

| Unidad | Descripción | Resultado Esperado | Estado |
| :-- | :-- | :-- | :-- |
| **INSERT** | Agregar usuario | Usuario agregado correctamente | ✅ Implementado |
| **SELECT** | Leer usuario | Usuario encontrado | ✅ Implementado |
| **CONSTRAINTS** | Validar restricciones | Error si falta username o password | ✅ Implementado |

### 🚀 Ejecutar Pruebas de Base de Datos

#### Localmente

```bash
cd auth

# Ejecutar todas las pruebas
npm run test:db

# Ejecutar pruebas individuales
npm run test:db:insert
npm run test:db:select
npm run test:db:constraints
```

#### Con Docker Compose

```bash
# 1. Levantar MongoDB
docker-compose up -d mongodb-auth

# 2. Ejecutar las pruebas de base de datos
docker-compose up --build auth-db-tests
```

**Resultado**: El contenedor sale con código 0 si todas las pruebas pasan, código 1 si alguna falla.

---

## 📊 Nivel 2: Pruebas Unitarias de Backend (con Fakes)

### 🎯 Objetivo

Validar la lógica de negocio de forma aislada usando **fakes** (dobles de prueba) en lugar de dependencias reales como MongoDB. Este enfoque asegura que los tests sean rápidos, determinísticos y no dependan de servicios externos.

### 🎓 ¿Qué es un Fake?

Un **fake** es un objeto que implementa la misma interfaz que el objeto real, pero con una implementación simplificada. A diferencia de un mock, un fake proporciona funcionalidad real básica (como un array en memoria en lugar de una base de datos).

**Ventajas de usar Fakes**:
- ✅ Más fácil de entender que mocks
- ✅ Comportamiento más cercano al real
- ✅ Menos configuración necesaria
- ✅ Ideal para contextos académicos

### 📁 Ubicación

- **Servicio**: `product`
- **Directorio**: `product/src/test/`
- **Fakes**: `product/src/test/fakes/`

### 🧪 Pruebas Implementadas

#### **ProductsService** - Pruebas de Capa de Servicio

**Estrategia**: Usar `jest.mock()` para reemplazar `ProductsRepository` con `FakeProductsRepository` que almacena datos en memoria.

**Archivos**:
- `productsService.test.js` - Tests unitarios del servicio
- `fakes/FakeProductsRepository.js` - Implementación del fake

#### FakeProductsRepository

```javascript
class FakeProductsRepository {
  constructor() {
    this.products = []; // Array en memoria
    this.nextId = 1;
  }

  async create(product) { /* ... */ }
  async findById(productId) { /* ... */ }
  async findAll() { /* ... */ }
  clear() { /* ... */ } // Útil para limpiar entre tests
}
```

### 📋 Tabla de Diseño de Pruebas Unitarias

| Test ID | Método | Descripción | Input | Expected Output | Estado |
| :-- | :-- | :-- | :-- | :-- | :-- |
| **SVC-001** | `createProduct` | Crear producto válido | `{name, description, price}` | Producto con `_id` generado | ✅ |
| **SVC-002** | `createProduct` | Verificar persistencia | Producto creado | Producto recuperable por ID | ✅ |
| **SVC-003** | `getProductById` | Obtener producto existente | `productId` válido | Producto completo | ✅ |
| **SVC-004** | `getProductById` | Obtener producto inexistente | `productId` inválido | `null` | ✅ |
| **SVC-005** | `getProducts` | Listar productos existentes | - | Array con todos los productos | ✅ |
| **SVC-006** | `getProducts` | Listar cuando está vacío | - | Array vacío `[]` | ✅ |

### 🚀 Ejecutar Pruebas Unitarias

#### Localmente

```bash
cd product

# Instalar dependencias (si no están instaladas)
npm install

# Ejecutar pruebas unitarias
npm test

# O si está configurado Jest
npx jest productsService.test.js
```

#### Requisitos

- Node.js 16+
- Jest instalado
- **NO** requiere MongoDB ejecutándose (usa fakes)

---

## 🏃 Ejecución Automatizada en Docker

### Servicio de Pruebas de Base de Datos

El `docker-compose.yml` incluye un servicio para ejecutar las pruebas de base de datos automáticamente:

```yaml
auth-db-tests:
  build: ./auth
  volumes:
    - ./auth/src:/app/src
  depends_on:
    mongodb-auth:
      condition: service_healthy
  environment:
    - MONGODB_AUTH_URI=mongodb://mongodb-auth:27017/auth
  command: ["npm", "run", "test:db"]
```

**Comando**:
```bash
docker-compose up --build auth-db-tests
```

---

## 📝 Estructura del Proyecto

```
nodejs-ecommerce-microservice/
│
├── auth/
│   ├── src/
│   │   ├── db-tests/              # Pruebas de Base de Datos
│   │   │   ├── test_insert.js
│   │   │   ├── test_select.js
│   │   │   └── test_constraints.js
│   │   └── ...
│   └── package.json
│
├── product/
│   ├── src/
│   │   ├── test/                  # Pruebas Unitarias
│   │   │   ├── productsService.test.js
│   │   │   ├── test-design.md
│   │   │   └── fakes/
│   │   │       └── FakeProductsRepository.js
│   │   └── ...
│   └── package.json
│
└── docker-compose.yml
```

---

## ✅ Criterios de Éxito

### Pruebas de Base de Datos
- ✅ Cada prueba es independiente
- ✅ Las pruebas limpian datos de prueba después de ejecutarse
- ✅ Las pruebas validan operaciones CRUD reales en MongoDB
- ✅ Las pruebas validan restricciones del esquema

### Pruebas Unitarias
- ✅ Ningún test depende de MongoDB real
- ✅ El fake repository usa solo memoria (array)
- ✅ Cada test es independiente (fake se reinicia en `beforeEach`)
- ✅ Tests producen el mismo resultado cada vez (determinísticos)
- ✅ Todos los métodos principales están testeados

---

## 🎓 Principios Aplicados

### ¿Por qué diseñar pruebas antes de implementar?

1. **Claridad de objetivos**: Saber exactamente qué testear antes de escribir código evita tests incompletos
2. **Identificación de dependencias**: Al diseñar, identificamos que necesitamos un fake del repository
3. **Cobertura completa**: Las tablas aseguran que no olvidemos casos importantes (éxito, límites, errores)
4. **Documentación**: El diseño sirve como documentación de qué comportamientos se esperan

### Aislamiento de Pruebas

- **Base de Datos**: Las pruebas se conectan directamente a MongoDB pero limpian después
- **Backend**: Las pruebas unitarias **NO** requieren MongoDB (usan fakes)
- **Independencia**: Cada test puede ejecutarse en cualquier orden sin afectar otros tests

---

## 📚 Referencias

- **Laboratorio Original**: Laboratory 1 - Unit Testing (SQ_2025ii)
- **Herramientas**: 
  - Mocha + Chai (pruebas de integración)
  - Jest (pruebas unitarias)
  - MongoDB Driver (pruebas de BD)
  - Docker Compose (automatización)

---

## 🔧 Solución de Problemas

### Error: MongoDB no conecta
- Verificar que los servicios de MongoDB estén corriendo: `docker-compose ps`
- Verificar variables de entorno: `MONGODB_AUTH_URI`

### Error: Módulo no encontrado
- Ejecutar `npm install` en cada servicio
- Verificar que las dependencias de desarrollo estén instaladas

### Error: SyntaxError con operador `??=`
- Actualizar Node.js a versión 16+ (el Dockerfile usa Node.js 16)

---

## 📊 Resumen de Cobertura

| Nivel | Servicio | Tipo de Prueba | Archivos | Estado |
| :-- | :-- | :-- | :-- | :-- |
| **1** | auth | Base de Datos | 3 tests | ✅ Completo |
| **2** | product | Unitarias (Fakes) | 6 tests | ✅ Completo |

**Total**: 9 pruebas implementadas y documentadas.

