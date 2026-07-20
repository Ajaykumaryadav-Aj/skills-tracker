
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Roadmap from '../models/Roadmap.js';

dotenv.config();

// Since we need to login, we can get a token or just call the API directly by simulating a request or bypassing auth in a test.
// Wait, we can log in with test@example.com using Password123
async function run() {
  const loginRes = await fetch('http://localhost:5001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test@example.com', password: 'Password123' })
  });
  const loginData = await loginRes.json();
  console.log('Login response body:', loginData);
  const token = loginData.data?.token;
  console.log('Login token:', token ? 'Token received' : 'No token');

  const dbUri = process.env.MONGO_URI || 'mongodb://localhost:27017/skills-tracker';
  await mongoose.connect(dbUri);
  const roadmap = await Roadmap.findOne({ 'skills.0': { $exists: true } });
  await mongoose.disconnect();

  if (!roadmap) {
    console.log('No roadmap found.');
    return;
  }

  const skillIds = roadmap.skills.map(s => s._id.toString()).reverse();
  const url = `http://localhost:5001/api/roadmaps/${roadmap._id}/skills/reorder`;
  console.log('Sending PUT to:', url);

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ skillIds })
  });

  console.log('Status:', res.status);
  const data = await res.json();
  console.log('Response:', data);
}

run();
