import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Roadmap from '../models/Roadmap.js';

dotenv.config();

async function test() {
  const dbUri = process.env.MONGO_URI || 'mongodb://localhost:27017/skills-tracker';
  console.log('Connecting to:', dbUri);
  await mongoose.connect(dbUri);
  console.log('Connected.');

  const roadmap = await Roadmap.findOne({ 'skills.0': { $exists: true } });
  if (!roadmap) {
    console.log('No roadmap with skills found.');
    await mongoose.disconnect();
    return;
  }

  console.log('Found roadmap:', roadmap.title);
  console.log('Original skills order:', roadmap.skills.map(s => s._id.toString()));

  const skillIds = roadmap.skills.map(s => s._id.toString()).reverse();
  console.log('Attempting reorder with:', skillIds);

  try {
    const skillMap = new Map(roadmap.skills.map((s) => [s._id.toString(), s]));
    const newSkills = [];

    for (const id of skillIds) {
      const skill = skillMap.get(id);
      if (skill) {
        newSkills.push(skill);
        skillMap.delete(id);
      }
    }

    for (const skill of skillMap.values()) {
      newSkills.push(skill);
    }

    roadmap.skills = newSkills;
    await roadmap.save();
    console.log('Saved successfully!');
    console.log('New skills order in DB:', roadmap.skills.map(s => s._id.toString()));
  } catch (err) {
    console.error('Error during save:', err);
  }

  await mongoose.disconnect();
}

test();
