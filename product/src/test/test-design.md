# Diseño de Pruebas Unitarias - Product Service
## Enfoque Académico Simplificado: Capa de Servicio con Fakes

## 📋 Objetivo

Este documento define el diseño de pruebas unitarias para la **capa de servicio** del microservicio **Product** usando **fakes** (dobles de prueba) en lugar de mocks. Este enfoque simplificado es ideal para entender los conceptos fundamentales de testing unitario en un contexto académico.

## 🎓 ¿Qué es un Fake vs Mock?

### **Mock**
- Objeto que **simula** el comportamiento de otro objeto
- Se configura con expectativas (qué métodos se llamarán, con qué parámetros)
- Se usa para **verificar interacciones** (ej: "¿se llamó este método?")
- Ejemplo: `jest.fn()` que registra llamadas

### **Fake**
- Objeto que **implementa** la misma interfaz que el objeto real, pero con una implementación **simplificada**
- No verifica interacciones, solo proporciona funcionalidad básica
- Ejemplo: Un array en memoria en lugar de una base de datos real
- **Más fácil de entender** para estudiantes porque se comporta "casi como el real"

---

## 🏗️ Arquitectura - Enfoque en Capa de Servicio

Para este ejercicio académico, nos enfocamos únicamente en la **capa de servicio**:

```
┌─────────────────────────────────────┐
│   ProductsService                    │  ← ⭐ CAPA A TESTEAR
│   - createProduct(product)           │
│   - getProductById(productId)        │
│   - getProducts()                     │
└──────────────┬──────────────────────┘
               │
               │ usa
               ▼
┌─────────────────────────────────────┐
│   ProductsRepository (FAKE)          │  ← 🔧 DOBLE DE PRUEBA
│   - create(product)                 │     (implementación en memoria)
│   - findById(productId)             │
│   - findAll()                       │
└─────────────────────────────────────┘
```

**Estrategia**: Crearemos un `FakeProductsRepository` que usa un array en memoria en lugar de MongoDB.

---

## 🧪 Unidades Testables - Capa de Servicio

### **ProductsService** (`productsService.js`)

**Responsabilidad**: Lógica de negocio que orquesta las operaciones con productos.

| Método | Descripción | Dependencia a Reemplazar |
|--------|-------------|--------------------------|
| `createProduct(product)` | Crea un producto usando el repository | `productsRepository` → **FAKE** |
| `getProductById(productId)` | Obtiene un producto por su ID | `productsRepository` → **FAKE** |
| `getProducts()` | Obtiene todos los productos | `productsRepository` → **FAKE** |

**Estrategia de Testing**:
- Crear un `FakeProductsRepository` que implementa la misma interfaz que `ProductsRepository`
- El fake usa un **array en memoria** para almacenar productos
- Usar `jest.mock()` para interceptar el `require()` de `ProductsRepository` y reemplazarlo con el fake
- **No modificamos `ProductsService`**: Jest intercepta automáticamente cuando hace `new ProductsRepository()`
- Testear los 3 métodos del servicio de forma aislada

---

## 📊 Tablas de Diseño de Casos de Prueba

### **Test Suite: `ProductsService` (con Fake Repository)**

#### **Implementación del Fake**

```javascript
class FakeProductsRepository {
  constructor() {
    this.products = []; // Array en memoria
    this.nextId = 1;
  }

  async create(product) {
    const newProduct = {
      _id: `fake-${this.nextId++}`,
      ...product
    };
    this.products.push(newProduct);
    return newProduct;
  }

  async findById(productId) {
    return this.products.find(p => p._id === productId) || null;
  }

  async findAll() {
    return [...this.products]; // Retorna copia del array
  }
}
```

---

#### **Test Cases**

| Test Case ID | Método | Description | Input | Expected Output | Condiciones Especiales |
|--------------|--------|-------------|-------|-----------------|------------------------|
| **SVC-001** | `createProduct(product)` | Crear producto válido exitosamente | `{name: "Laptop", description: "Gaming laptop", price: 999.99}` | Objeto producto con `_id` generado | - |
| **SVC-002** | `createProduct(product)` | Crear producto y verificar que se guarda | `{name: "Mouse", price: 25}` | Producto retornado debe tener los mismos datos | Verificar que el fake repository contiene el producto |
| **SVC-003** | `getProductById(productId)` | Obtener producto existente | `productId: "fake-1"` (después de crear) | Objeto producto completo | Producto debe existir previamente |
| **SVC-004** | `getProductById(productId)` | Obtener producto inexistente | `productId: "fake-999"` | `null` | - |
| **SVC-005** | `getProducts()` | Obtener lista cuando hay productos | - (después de crear varios) | Array con todos los productos creados | Debe retornar todos los productos del fake |
| **SVC-006** | `getProducts()` | Obtener lista cuando está vacía | - (sin crear productos) | Array vacío `[]` | - |

**Notas de Implementación**:
- Usar `jest.mock()` para reemplazar el módulo `ProductsRepository` antes de importar `ProductsService`
- El fake se crea automáticamente cuando `ProductsService` hace `new ProductsRepository()`
- Limpiar el fake en `beforeEach()` para asegurar aislamiento entre tests
- No usar MongoDB real
- Los tests deben ser determinísticos

---

---

## 🔧 Estructura del Código de Prueba

### **Archivo: `product/src/test/fakes/FakeProductsRepository.js`**

```javascript
class FakeProductsRepository {
  constructor() {
    this.products = [];
    this.nextId = 1;
  }

  async create(product) {
    const newProduct = {
      _id: `fake-${this.nextId++}`,
      ...product
    };
    this.products.push(newProduct);
    return newProduct;
  }

  async findById(productId) {
    return this.products.find(p => p._id === productId) || null;
  }

  async findAll() {
    return [...this.products];
  }
}

module.exports = FakeProductsRepository;
```

### **Archivo: `product/src/test/productsService.test.js`**

Estructura implementada:

```javascript
jest.mock('../repositories/productsRepository', () => {
  const FakeProductsRepository = require('./fakes/FakeProductsRepository');
  return FakeProductsRepository;
});

const ProductsService = require('../services/productsService');

describe('ProductsService', () => {
  let service;
  let fakeRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ProductsService(); // Jest intercepta y usa el fake
    fakeRepository = service.productsRepository;
    fakeRepository.clear();
  });

  describe('createProduct', () => {
    it('should create a product successfully', async () => {
      // Arrange-Act-Assert pattern
    });
    // ... más tests
  });
});
```

**Nota importante**: Usamos `jest.mock()` para interceptar el módulo sin modificar `ProductsService`. Esto permite testear sin cambiar el código de producción.

---

## 🎯 Criterios de Éxito

### **Aislamiento**
- ✅ Ningún test depende de MongoDB real
- ✅ El fake repository usa solo memoria (array)
- ✅ Cada test es independiente (fake se reinicia en `beforeEach`)

### **Cobertura**
- ✅ Los 3 métodos principales están testeados: `createProduct`, `getProductById`, `getProducts`
- ✅ Casos de éxito y casos límite (lista vacía, producto no encontrado) están cubiertos

### **Determinismo**
- ✅ Tests producen el mismo resultado cada vez
- ✅ El fake repository es completamente controlado
- ✅ No hay dependencias externas

### **Claridad Académica**
- ✅ El código es fácil de entender (fake es más simple que mock)
- ✅ Se puede explicar claramente qué hace cada test
- ✅ El fake demuestra el concepto de "doble de prueba"

---

## 📝 Notas Importantes

### **¿Por qué usar Fakes en lugar de Mocks para este ejercicio?**

1. **Simplicidad**: Los fakes son más fáciles de entender porque se comportan "casi como el objeto real"
2. **Claridad conceptual**: Un estudiante puede ver que el fake hace lo mismo que el repository real, pero en memoria
3. **Menos configuración**: No necesitamos configurar expectativas complejas como en los mocks
4. **Adecuado para el nivel**: Para un ejercicio académico introductorio, los fakes son perfectos

### **¿Por qué diseñar antes de implementar?**

1. **Claridad de objetivos**: Saber exactamente qué testear antes de escribir código evita tests incompletos
2. **Identificación de dependencias**: Al diseñar, identificamos que necesitamos un fake del repository
3. **Cobertura completa**: Las tablas aseguran que no olvidemos casos importantes (éxito, límites)
4. **Documentación**: El diseño sirve como documentación de qué comportamientos se esperan

### **Ventajas de este enfoque simplificado**

- ✅ **Enfoque**: Solo una capa (Service)
- ✅ **Claridad**: 3 métodos, 6 casos de prueba
- ✅ **Aprendizaje**: Entender fakes es más fácil que mocks
- ✅ **Tiempo**: Ejercicio manejable para un contexto académico

---

## ✅ Implementación Completada

### **Resumen de lo Implementado**

1. ✅ **FakeProductsRepository** creado en `product/src/test/fakes/FakeProductsRepository.js`
   - Implementa la misma interfaz que `ProductsRepository`
   - Usa array en memoria para almacenamiento
   - Métodos: `create()`, `findById()`, `findAll()`, `clear()`

2. ✅ **Tests unitarios** implementados en `product/src/test/productsService.test.js`
   - 6 tests cubriendo los 3 métodos principales
   - Uso de `jest.mock()` para interceptar el módulo sin modificar `ProductsService`
   - Patrón AAA (Arrange-Act-Assert) aplicado en tests clave
   - Todos los tests pasando ✅

3. ✅ **Configuración**
   - Jest instalado y configurado
   - Scripts en `package.json`: `test:unit` y `test:unit:watch`
   - `jest.config.js` configurado para excluir tests de integración

### **Ejecutar Tests**

```bash
cd product
npm run test:unit
```

### **Resultado**
- ✅ 6 tests pasando
- ✅ 0 tests fallando
- ✅ Cobertura completa de la capa de servicio
- ✅ Aislamiento total (sin MongoDB)

---

## 🧪 Pruebas de Integración - Product Service (Backend ↔ Database)

### 📁 Ubicación

- **Directorio**: `product/__tests__/integration/`
- **Archivo**: `product-db.test.js`
- **Framework**: Jest
- **Base de Datos**: MongoDB (puerto 27019 - Docker)
- **ODM**: Mongoose

### 🎯 Objetivo de las Pruebas

Validar la **integración entre el Backend del Product Service y MongoDB**:

- ✅ Persistencia correcta de productos en la base de datos
- ✅ Validación del esquema de datos en MongoDB
- ✅ Manejo de campos requeridos y opcionales
- ✅ Operaciones CRUD completas (Create, Read, Update, Delete)
- ✅ Consultas con múltiples documentos

---

### 📊 Tabla de Diseño de Pruebas de Integración - Product Service

| Test ID          | Escenario                                    | Operación DB  | Validaciones Clave                                                                          | Estado |
| :--------------- | :------------------------------------------- | :------------ | :------------------------------------------------------------------------------------------ | :----- |
| **PROD-INT-001** | Crear y persistir producto                   | `save()`      | ✅ Producto existe en DB<br>✅ `name`, `price`, `description` correctos                     | ✅     |
| **PROD-INT-002** | Validar esquema MongoDB                      | `save()`, `lean()` | ✅ Tiene `_id`, `name`, `price`, `description`<br>✅ Tipos correctos                         | ✅     |
| **PROD-INT-003** | Rechazar producto sin campo `name`           | `save()`      | ✅ Lanza error de validación                                                                | ✅     |
| **PROD-INT-004** | Rechazar producto sin campo `price`         | `save()`      | ✅ Lanza error de validación                                                                | ✅     |
| **PROD-INT-005** | Manejar `description` opcional               | `save()`      | ✅ Producto guardado sin description<br>✅ Campo opcional funciona correctamente             | ✅     |
| **PROD-INT-006** | Actualizar producto existente                | `save()` (2x) | ✅ `price` y `description` actualizados correctamente                                       | ✅     |
| **PROD-INT-007** | Eliminar producto                            | `deleteOne()` | ✅ Producto eliminado de DB<br>✅ `findOne()` retorna `null`                                 | ✅     |
| **PROD-INT-008** | Consultar múltiples productos                | `find()`      | ✅ Retorna 3 productos<br>✅ Suma total de precios = 225                                    | ✅     |
| **PROD-INT-009** | Buscar producto por ID                       | `findById()`  | ✅ Retorna producto correcto<br>✅ ID coincide                                              | ✅     |

**Total**: 9 pruebas de integración Backend ↔ Database

---

### 🚀 Ejecutar Pruebas de Integración

#### Prerrequisitos

1. **MongoDB corriendo** (puerto 27019):
   ```bash
   docker-compose up -d mongodb-product
   ```

2. **Dependencias instaladas**:
   ```bash
   cd product
   npm install
   ```

#### Ejecución Local

```bash
# 1. Asegurar que MongoDB Product está corriendo
docker ps --filter "name=mongodb-product"

# 2. Ejecutar pruebas
cd product
npm run test:integration
```

#### Resultado Esperado

```
PASS  __tests__/integration/product-db.test.js
  Product Service <--> MongoDB Integration Tests
    ✓ PROD-INT-001: Debe crear y persistir un producto en MongoDB
    ✓ PROD-INT-002: Debe validar el esquema correcto en MongoDB
    ✓ PROD-INT-003: Debe rechazar productos sin campo name requerido
    ✓ PROD-INT-004: Debe rechazar productos sin campo price requerido
    ✓ PROD-INT-005: Debe manejar productos sin description (campo opcional)
    ✓ PROD-INT-006: Debe actualizar un producto existente
    ✓ PROD-INT-007: Debe eliminar un producto de la base de datos
    ✓ PROD-INT-008: Debe consultar múltiples productos
    ✓ PROD-INT-009: Debe buscar un producto por ID

Test Suites: 1 passed, 1 total
Tests:       9 passed, 9 total
```

---

### ✅ Criterios de Éxito - Product Service (Integración)

- ✅ **Aislamiento**: Cada prueba limpia datos antes y después (`afterEach`)
- ✅ **Integración Real**: Usa MongoDB real (no mocks)
- ✅ **Flujo Completo**: Valida Backend → MongoDB → Backend
- ✅ **Validación de Datos**: Verifica estructura de documentos en MongoDB
- ✅ **Manejo de Errores**: Prueba casos límite y validaciones del esquema
- ✅ **Reproducibilidad**: Tests determinísticos y repetibles
- ✅ **Operaciones CRUD**: Cubre Create, Read, Update, Delete

### 📚 Modelo de Datos - Product

```javascript
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String },
}, { collection: 'products' });
```

**Campos**:
- `name`: String requerido
- `price`: Number requerido
- `description`: String opcional

---

### ✅ Implementación Completada - Tests de Integración

1. ✅ **Tests de integración** implementados en `product/__tests__/integration/product-db.test.js`
   - 9 tests cubriendo operaciones CRUD y validaciones
   - Uso de MongoDB real para validar persistencia
   - Patrón AAA (Arrange-Act-Assert) aplicado
   - Todos los tests pasando ✅

2. ✅ **Configuración**
   - Scripts en `package.json`: `test:integration` y `test:integration:watch`
   - MongoDB Product configurado (puerto 27019)

### **Ejecutar Tests de Integración**

```bash
cd product
npm run test:integration
```

### **Resultado**
- ✅ 9 tests pasando
- ✅ 0 tests fallando
- ✅ Cobertura completa de operaciones CRUD
- ✅ Validación de esquema MongoDB

