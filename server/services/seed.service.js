const mongoose = require('mongoose');
require('dotenv').config();
const Competitor = require('../models/competitor.model');
const Training = require('../models/training.model');

const competitors = [
  { name: 'TechCorp Training', source_url: 'https://techcorp-training.example.com', category: 'Technology' },
  { name: 'LeaderSkills Academy', source_url: 'https://leaderskills.example.com', category: 'Leadership' },
  { name: 'DataPro Institute', source_url: 'https://datapro.example.com', category: 'Data Science' },
  { name: 'CloudMasters', source_url: 'https://cloudmasters.example.com', category: 'Cloud Computing' },
  { name: 'CyberShield Training', source_url: 'https://cybershield.example.com', category: 'Cybersecurity' },
];

const trainingTemplates = [
  { title: 'Advanced Machine Learning Workshop', price: 1500, audience: 'Engineers', delivery_mode: 'Online' },
  { title: 'Cybersecurity Fundamentals', price: 800, audience: 'IT Professionals', delivery_mode: 'In-Person' },
  { title: 'Cloud Architecture Masterclass', price: 2000, audience: 'Architects', delivery_mode: 'Hybrid' },
  { title: 'Leadership in Digital Transformation', price: 1200, audience: 'Managers', delivery_mode: 'Online' },
  { title: 'Data Analytics with Python', price: 950, audience: 'Analysts', delivery_mode: 'Online' },
  { title: 'DevOps Pipeline Bootcamp', price: 1800, audience: 'Engineers', delivery_mode: 'In-Person' },
  { title: 'Project Management Essentials', price: 600, audience: 'General', delivery_mode: 'Online' },
  { title: 'AI Strategy for Business Leaders', price: 2500, audience: 'Executives', delivery_mode: 'Hybrid' },
  { title: 'React & TypeScript Workshop', price: 700, audience: 'Developers', delivery_mode: 'Online' },
  { title: 'Agile Scrum Certification Prep', price: 1100, audience: 'Teams', delivery_mode: 'In-Person' },
  { title: 'Kubernetes Deep Dive', price: 1600, audience: 'Engineers', delivery_mode: 'Online' },
  { title: 'Public Speaking for Professionals', price: 500, audience: 'General', delivery_mode: 'In-Person' },
  { title: 'Blockchain Fundamentals', price: 1300, audience: 'Developers', delivery_mode: 'Online' },
  { title: 'UX Research Methods', price: 900, audience: 'Designers', delivery_mode: 'Hybrid' },
  { title: 'Network Security Advanced', price: 1750, audience: 'IT Professionals', delivery_mode: 'In-Person' },
  { title: 'SQL & Database Design', price: 650, audience: 'Analysts', delivery_mode: 'Online' },
  { title: 'Emotional Intelligence at Work', price: 450, audience: 'Managers', delivery_mode: 'Online' },
  { title: 'AWS Solutions Architect Training', price: 2200, audience: 'Architects', delivery_mode: 'Online' },
  { title: 'Compliance & Risk Management', price: 1000, audience: 'General', delivery_mode: 'In-Person' },
  { title: 'Full-Stack JavaScript Bootcamp', price: 3000, audience: 'Developers', delivery_mode: 'Hybrid' },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Competitor.deleteMany({});
    await Training.deleteMany({});
    console.log('Cleared existing data');

    // Insert competitors
    const createdCompetitors = await Competitor.insertMany(competitors);
    console.log(`Inserted ${createdCompetitors.length} competitors`);

    // Insert trainings - distribute across competitors and recent months
    const trainings = trainingTemplates.map((t, i) => {
      const competitorIndex = i % createdCompetitors.length;
      const monthOffset = Math.floor(Math.random() * 6); // random month in last 6 months
      const date = new Date();
      date.setMonth(date.getMonth() - monthOffset);
      date.setDate(Math.floor(Math.random() * 28) + 1);

      return {
        ...t,
        competitor_id: createdCompetitors[competitorIndex]._id,
        date,
        description: `Comprehensive ${t.title.toLowerCase()} covering industry best practices and hands-on exercises.`,
      };
    });

    const createdTrainings = await Training.insertMany(trainings);
    console.log(`Inserted ${createdTrainings.length} trainings`);

    console.log('Seed complete!');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err.message);
    process.exit(1);
  }
}

seed();
