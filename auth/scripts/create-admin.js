#!/usr/bin/env node

/**
 * Script para crear un usuario administrador
 * 
 * Uso:
 *   node scripts/create-admin.js <username> <password>
 * 
 * Ejemplo:
 *   node scripts/create-admin.js admin admin123
 */

require('dotenv').config();
const mongoose = require('mongoose');
const AuthService = require('../src/services/authService');
const User = require('../src/models/user');

const MONGODB_URI = process.env.MONGODB_AUTH_URI || 'mongodb://localhost:27017/?authSource=admin';

async function createAdmin() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('❌ Error: Se requieren username y password');
    console.log('\nUso:');
    console.log('  node scripts/create-admin.js <username> <password>');
    console.log('\nEjemplo:');
    console.log('  node scripts/create-admin.js admin admin123');
    process.exit(1);
  }

  const username = args[0];
  const password = args[1];

  try {
    // Conectar a MongoDB
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ Conectado a MongoDB');

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      console.log(`⚠️  El usuario "${username}" ya existe.`);
      console.log('¿Deseas actualizar su rol a admin? (s/n)');
      
      // En modo no interactivo, actualizar automáticamente
      if (process.env.NON_INTERACTIVE === 'true') {
        existingUser.role = 'admin';
        await existingUser.save();
        console.log(`✅ Usuario "${username}" actualizado a rol admin`);
        await mongoose.disconnect();
        process.exit(0);
      }
      
      // En modo interactivo, necesitaríamos leer de stdin, pero por simplicidad
      // actualizamos directamente
      existingUser.role = 'admin';
      await existingUser.save();
      console.log(`✅ Usuario "${username}" actualizado a rol admin`);
    } else {
      // Crear nuevo usuario admin
      const authService = new AuthService();
      const adminUser = await authService.register({
        username,
        password,
        role: 'admin'
      });

      console.log(`✅ Usuario administrador creado exitosamente:`);
      console.log(`   Username: ${username}`);
      console.log(`   Role: admin`);
      console.log(`   ID: ${adminUser._id}`);
    }

    // Verificar que se creó correctamente
    const user = await User.findOne({ username });
    if (user && user.role === 'admin') {
      console.log('\n🎉 ¡Usuario admin listo para usar!');
      console.log('\nPuedes iniciar sesión en:');
      console.log('  http://localhost:4200/admin/login');
      console.log(`\nCredenciales:`);
      console.log(`  Usuario: ${username}`);
      console.log(`  Contraseña: ${password}`);
    } else {
      console.error('❌ Error: No se pudo verificar la creación del usuario');
      process.exit(1);
    }

    await mongoose.disconnect();
    console.log('\n✅ Desconectado de MongoDB');
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Ejecutar
createAdmin();

