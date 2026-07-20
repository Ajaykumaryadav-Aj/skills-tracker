import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const users = await mongoose.connection.db.collection('users').find({}).toArray();
  console.log('USERS:', JSON.stringify(users.map(u => ({ email: u.email, role: u.role, isVerified: u.isVerified })), null, 2));
  await mongoose.disconnect();
}
run().catch(console.error);
