const { MongoClient } = require('mongodb');
const uri = process.env.MONGODB_AUTH_URI || 'mongodb://mongodb-auth:27017/auth';

async function testInsert() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db('auth');
    const collection = db.collection('users');
    
    await collection.deleteMany({ username: /^test/ });
    
    const testUser = {
      username: 'test_user_insert',
      password: 'hashed_password_test'
    };
    
    const result = await collection.insertOne(testUser);
    
    const insertedUser = await collection.findOne({ _id: result.insertedId });
    
    if (insertedUser && insertedUser.username === 'test_user_insert') {
      console.log('est INSERT pasado: Usuario insertado correctamente');
      await collection.deleteOne({ _id: result.insertedId });
      process.exit(0);
    } else {
      console.error('Test INSERT falló: Usuario no encontrado');
      process.exit(1);
    }
  } catch (error) {
    console.error('Test INSERT falló:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

testInsert();

