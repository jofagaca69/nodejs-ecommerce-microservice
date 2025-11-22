const { MongoClient } = require('mongodb');
const mongoose = require('mongoose');
const User = require('../models/user');

const uri = process.env.MONGODB_AUTH_URI || 'mongodb://mongodb-auth:27017/auth';

async function testConstraints() {
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    await User.deleteMany({ username: /^test/ });
    
    try {
      const invalidUser = new User({
        password: 'password123'
      });
      
      await invalidUser.save();
      console.error('Test CONSTRAINTS falló: Debería requerir username');
      await mongoose.disconnect();
      process.exit(1);
    } catch (error) {
      if (error.errors && error.errors.username) {
        console.log('Test CONSTRAINTS pasado: Restricción de username funciona');
      } else {
        throw error;
      }
    }
    
    try {
      const invalidUser = new User({
        username: 'test_user'
      });
      
      await invalidUser.save();
      console.error('Test CONSTRAINTS falló: Debería requerir password');
      await mongoose.disconnect();
      process.exit(1);
    } catch (error) {
      if (error.errors && error.errors.password) {
        console.log('Test CONSTRAINTS pasado: Restricción de password funciona');
        await mongoose.disconnect();
        process.exit(0);
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Test CONSTRAINTS falló:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

testConstraints();

