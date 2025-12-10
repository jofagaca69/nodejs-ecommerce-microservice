const mongoose = require('mongoose');
const Product = require('../models/product');
const Category = require('../models/category');

// Configuración de conexión a la base de datos
const DB_URI = process.env.MONGODB_URI || process.env.MONGODB_PRODUCT_URI || 'mongodb://localhost:27017/products';

// Categorías médicas
const medicalCategories = [
  { name: 'Medicamentos', description: 'Medicamentos de venta libre y con receta' },
  { name: 'Equipo Médico', description: 'Equipos y dispositivos médicos' },
  { name: 'Primeros Auxilios', description: 'Productos para primeros auxilios' },
  { name: 'Higiene y Cuidado Personal', description: 'Productos de higiene y cuidado personal' },
];

// Productos médicos
const medicalProducts = [
  // Medicamentos
  {
    name: 'Paracetamol 500mg',
    price: 5.99,
    description: 'Analgésico y antipirético para aliviar el dolor y reducir la fiebre',
    image: 'https://www.fahorro.com/media/catalog/product/7/5/7506472803833_1_1.jpg?optimize=medium&bg-color=255,255,255&fit=bounds&height=&width=&canvas=:',
    stock: 150,
    categoryName: 'Medicamentos'
  },
  {
    name: 'Ibuprofeno 400mg',
    price: 7.50,
    description: 'Antiinflamatorio no esteroideo para dolor e inflamación',
    image: 'https://copservir.vtexassets.com/arquivos/ids/1763204/IBUPROFENO-400-MG--COASPHARMA-_F.png?v=638970576127770000',
    stock: 120,
    categoryName: 'Medicamentos'
  },
  {
    name: 'Amoxicilina 500mg',
    price: 12.99,
    description: 'Antibiótico de amplio espectro',
    image: 'https://copservir.vtexassets.com/arquivos/ids/1766030/AMOXICILINA-500-MG-GENFAR_F.png?v=638974911612270000',
    stock: 80,
    categoryName: 'Medicamentos'
  },
  {
    name: 'Omeprazol 20mg',
    price: 9.99,
    description: 'Inhibidor de la bomba de protones para acidez estomacal',
    image: 'https://imagenes.heraldo.es/files/image_1920_1080/uploads/imagenes/2025/01/02/omeprazol-gsc1.jpeg',
    stock: 100,
    categoryName: 'Medicamentos'
  },
  {
    name: 'Loratadina 10mg',
    price: 6.50,
    description: 'Antihistamínico para alergias',
    image: 'https://www.drogueriascafam.com.co/49439-large_default/comprar-en-cafam-loratadina-10-mg-caja-con-20-tabletas-precio.jpg',
    stock: 90,
    categoryName: 'Medicamentos'
  },
  
  // Equipo Médico
  {
    name: 'Termómetro Digital',
    price: 15.99,
    description: 'Termómetro digital con lectura rápida y precisa',
    image: 'https://copservir.vtexassets.com/arquivos/ids/1567583/TERMOMETRO-VICK-DIGITAL-BLANCO_F.png?v=638788225233800000',
    stock: 45,
    categoryName: 'Equipo Médico'
  },
  {
    name: 'Tensiómetro Digital',
    price: 49.99,
    description: 'Monitor de presión arterial automático',
    image: 'https://media.falabella.com/sodimacCO/705907/public',
    stock: 30,
    categoryName: 'Equipo Médico'
  },
  {
    name: 'Oxímetro de Pulso',
    price: 35.00,
    description: 'Medidor de saturación de oxígeno en sangre',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTUfCPCLSXO3YgDDSe3MaVBt4gvpj8q67-cMA&s',
    stock: 25,
    categoryName: 'Equipo Médico'
  },
  
  // Primeros Auxilios
  {
    name: 'Botiquín de Primeros Auxilios',
    price: 29.99,
    description: 'Kit completo con 100 piezas para emergencias',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTepG5wf9-I5meRBvsOwN9GKxpPf9Jv23Zm9g&s',
    stock: 40,
    categoryName: 'Primeros Auxilios'
  },
  {
    name: 'Alcohol 70% - 500ml',
    price: 4.50,
    description: 'Alcohol antiséptico para desinfección',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT6pvasqLqK_2t67knOpYm_vbf5VGTdV945ng&s',
    stock: 85,
    categoryName: 'Primeros Auxilios'
  },
  {
    name: 'Agua Oxigenada - 250ml',
    price: 3.99,
    description: 'Peróxido de hidrógeno al 3% para desinfección',
    image: 'https://exitocol.vtexassets.com/arquivos/ids/29039783/Agua-Oxigenada-Antiseptico-X-120-ml-27765_a.jpg?v=638875103546470000',
    stock: 70,
    categoryName: 'Primeros Auxilios'
  },
  
  // Higiene y Cuidado Personal
  {
    name: 'Mascarillas Quirúrgicas (Pack 50)',
    price: 12.99,
    description: 'Mascarillas desechables de 3 capas',
    image: 'https://img.medicalexpo.es/images_me/photo-mg/128640-15941184.jpg',
    stock: 200,
    categoryName: 'Higiene y Cuidado Personal'
  },
  {
    name: 'Gel Antibacterial 500ml',
    price: 6.99,
    description: 'Gel desinfectante con 70% alcohol',
    image: 'https://www.kipclin.com/images/virtuemart/product/KIP-PQP-GELES00056.jpg',
    stock: 150,
    categoryName: 'Higiene y Cuidado Personal'
  },
];

/**
 * Función para conectar a la base de datos
 */
async function connectDB() {
  try {
    await mongoose.connect(DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Conectado a MongoDB');
  } catch (error) {
    console.error('❌ Error al conectar a MongoDB:', error);
    process.exit(1);
  }
}

/**
 * Función para crear las categorías
 */
async function createCategories() {
  try {
    console.log('\n📂 Creando categorías...');
    
    // Eliminar categorías existentes
    await Category.deleteMany({});
    
    // Crear nuevas categorías
    const categories = await Category.insertMany(medicalCategories);
    console.log(`✅ ${categories.length} categorías creadas`);
    
    return categories;
  } catch (error) {
    console.error('❌ Error al crear categorías:', error);
    throw error;
  }
}

/**
 * Función para crear los productos
 */
async function createProducts(categories) {
  try {
    console.log('\n📦 Creando productos...');
    
    // Eliminar productos existentes
    await Product.deleteMany({});
    
    // Crear un mapa de categorías por nombre
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.name] = cat._id;
    });
    
    // Preparar productos con sus IDs de categoría
    const productsToInsert = medicalProducts.map(product => {
      const categoryId = categoryMap[product.categoryName];
      
      if (!categoryId) {
        throw new Error(`Categoría "${product.categoryName}" no encontrada para el producto "${product.name}". Asegúrate de que la categoría esté definida en medicalCategories.`);
      }
      
      return {
        name: product.name,
        price: product.price,
        description: product.description,
        image: product.image,
        stock: product.stock,
        categories: [categoryId]
      };
    });
    
    // Insertar productos
    const products = await Product.insertMany(productsToInsert);
    console.log(`✅ ${products.length} productos creados`);
    
    return products;
  } catch (error) {
    console.error('❌ Error al crear productos:', error);
    throw error;
  }
}

/**
 * Función para mostrar un resumen
 */
async function showSummary() {
  try {
    console.log('\n📊 RESUMEN DE LA BASE DE DATOS');
    console.log('═══════════════════════════════');
    
    const totalProducts = await Product.countDocuments();
    const totalCategories = await Category.countDocuments();
    
    console.log(`\n📦 Total de productos: ${totalProducts}`);
    console.log(`📂 Total de categorías: ${totalCategories}`);
    
    console.log('\n📋 Productos por categoría:');
    const categories = await Category.find();
    
    for (const category of categories) {
      const count = await Product.countDocuments({ categories: category._id });
      console.log(`   - ${category.name}: ${count} productos`);
    }
    
    console.log('\n💰 Valor total del inventario:');
    const valueResult = await Product.aggregate([
      {
        $group: {
          _id: null,
          totalValue: { $sum: { $multiply: ['$price', '$stock'] } }
        }
      }
    ]);
    
    if (valueResult.length > 0) {
      console.log(`   $${valueResult[0].totalValue.toFixed(2)}`);
    }
    
    console.log('\n⚠️  Productos con stock bajo (≤ 20):');
    const lowStockProducts = await Product.find({ stock: { $lte: 20 } }).sort({ stock: 1 });
    lowStockProducts.forEach(product => {
      console.log(`   - ${product.name}: ${product.stock} unidades`);
    });
    
  } catch (error) {
    console.error('❌ Error al mostrar resumen:', error);
  }
}

/**
 * Función principal
 */
async function fillDatabase() {
  try {
    console.log('🚀 Iniciando proceso de llenado de base de datos...');
    
    await connectDB();
    
    const categories = await createCategories();
    const products = await createProducts(categories);
    
    await showSummary();
    
    console.log('\n✅ ¡Base de datos llenada exitosamente!');
    
  } catch (error) {
    console.error('\n❌ Error al llenar la base de datos:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Conexión a MongoDB cerrada');
    process.exit(0);
  }
}

// Ejecutar el script si se llama directamente
if (require.main === module) {
  fillDatabase();
}

module.exports = { fillDatabase, createCategories, createProducts };