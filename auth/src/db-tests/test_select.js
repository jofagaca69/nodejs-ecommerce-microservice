const { MongoClient } = require('mongodb');
const uri = process.env.MONGODB_AUTH_URI || 'mongodb://mongodb-auth:27017/auth';

async function testSelect() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db('auth');
    const collection = db.collection('users');
    
    const testUser = {
      username: 'test_user_select',
      password: 'hashed_password_test'
    };
    
    await collection.insertOne(testUser);
    
    const foundUser = await collection.findOne({ username: 'test_user_select' });
    
    if (foundUser && foundUser.username === 'test_user_select') {
      console.log('Test SELECT pasado: Usuario encontrado correctamente');
      await collection.deleteOne({ _id: foundUser._id });
      process.exit(0);
    } else {
      console.error('Test SELECT falló: Usuario no encontrado');
      process.exit(1);
    }
  } catch (error) {
    console.error('Test SELECT falló:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

testSelect();

