require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/user');
const AuthService = require('../services/authService');
const config = require('../config');

// Configuración de conexión a la base de datos
const DB_URI = process.env.MONGODB_AUTH_URI || config.mongoURI || 'mongodb://localhost:27017/auth';

// Usuario administrador por defecto
const defaultAdmin = {
  username: process.env.ADMIN_USERNAME || 'admin',
  password: process.env.ADMIN_PASSWORD || 'admin123',
  role: 'admin',
  name: 'Administrador',
  phone: '12345678',
  address: 'Dirección del administrador'
};

/**
 * Función para conectar a la base de datos
 */
async function connectDB() {
  try {
    await mongoose.connect(DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Conectado a MongoDB (Auth)');
  } catch (error) {
    console.error('❌ Error al conectar a MongoDB:', error.message);
    throw error;
  }
}

/**
 * Función para crear el usuario administrador
 */
async function createAdminUser() {
  try {
    console.log('\n👤 Creando usuario administrador...');
    
    const authService = new AuthService();
    
    // Verificar si el usuario admin ya existe
    const existingAdmin = await User.findOne({ username: defaultAdmin.username });
    
    if (existingAdmin) {
      // Si existe, actualizar su rol a admin (por si acaso)
      if (existingAdmin.role !== 'admin') {
        existingAdmin.role = 'admin';
        await existingAdmin.save();
        console.log(`✅ Usuario "${defaultAdmin.username}" actualizado a rol admin`);
      } else {
        console.log(`ℹ️  Usuario administrador "${defaultAdmin.username}" ya existe`);
      }
      return existingAdmin;
    }
    
    // Crear nuevo usuario admin
    const adminUser = await authService.register({
      username: defaultAdmin.username,
      password: defaultAdmin.password,
      role: defaultAdmin.role,
      name: defaultAdmin.name,
      phone: defaultAdmin.phone,
      address: defaultAdmin.address
    });
    
    console.log(`✅ Usuario administrador creado:`);
    console.log(`   Username: ${defaultAdmin.username}`);
    console.log(`   Role: ${defaultAdmin.role}`);
    console.log(`   ID: ${adminUser._id}`);
    
    return adminUser;
  } catch (error) {
    console.error('❌ Error al crear usuario administrador:', error);
    throw error;
  }
}

/**
 * Función para mostrar un resumen
 */
async function showSummary() {
  try {
    const adminCount = await User.countDocuments({ role: 'admin' });
    const totalUsers = await User.countDocuments();
    
    console.log('\n📊 Resumen de usuarios:');
    console.log(`   Total de usuarios: ${totalUsers}`);
    console.log(`   Usuarios admin: ${adminCount}`);
  } catch (error) {
    console.error('❌ Error al obtener resumen:', error);
  }
}

/**
 * Función principal
 */
async function fillDatabase() {
  try {
    console.log('🚀 Iniciando proceso de inicialización de base de datos (Auth)...');
    
    await connectDB();
    
    const adminUser = await createAdminUser();
    
    await showSummary();
    
    console.log('\n✅ ¡Base de datos inicializada exitosamente!');
    console.log('\n📝 Credenciales del administrador:');
    console.log(`   Username: ${defaultAdmin.username}`);
    console.log(`   Password: ${defaultAdmin.password}`);
    console.log('\n🔗 Puedes iniciar sesión en: http://localhost:4200/admin/login');
    
  } catch (error) {
    console.error('\n❌ Error al inicializar la base de datos:', error);
    process.exit(1);
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

module.exports = { fillDatabase, createAdminUser };

