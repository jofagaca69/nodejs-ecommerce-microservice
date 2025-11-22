# Tests Unitarios - ProductsService

## 📚 Estrategia de Testing

1. **FakeProductsRepository**: Implementa la misma interfaz que `ProductsRepository` pero usando un array en memoria.

2. **Jest Mock**: Usamos `jest.mock()` para interceptar el `require()` del módulo `ProductsRepository` y reemplazarlo con nuestro fake.



## 🚀 Ejecutar Tests

```bash
# Instalar dependencias 
pnpm install

# Ejecutar tests unitarios
npm run test:unit

# Ejecutar en modo watch (re-ejecuta al cambiar archivos)
npm run test:unit:watch
```

## 📁 Estructura

```
src/test/
├── fakes/
│   └── FakeProductsRepository.js  # Implementación fake del repository
├── productsService.test.js        # Tests para ProductsService
```

## ✅ Tests Implementados

- ✅ `createProduct` - 2 casos (crear producto, verificar guardado)
- ✅ `getProductById` - 2 casos (producto existente, inexistente)
- ✅ `getProducts` - 2 casos (con productos, lista vacía)

**Total: 6 tests**

## 🎓 Conceptos Aplicados

- **Fake**: Objeto que implementa la funcionalidad real pero simplificada
- **Aislamiento**: Tests no dependen de MongoDB
- **Determinismo**: Tests producen el mismo resultado siempre

