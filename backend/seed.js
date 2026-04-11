/**
 * SEED SCRIPT: Import Mumbai NGO CSV into MongoDB
 * 
 * Usage:
 *   node seed.js path/to/mumbai_ngos.csv
 * 
 * Expected CSV columns (case-insensitive):
 *   name, email, contact, address, ward, isBmcPartner, areaOfWork
 * 
 * Example row:
 *   "Asha Foundation","asha@example.org","9876543210","Andheri West","K West","true","Food,Health"
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const readline = require('readline');
const NGOData = require('./src/models/NGOData');

const CSV_PATH = process.argv[2] || './data/mumbai_ngos.csv';

const parseCSVLine = (line) => {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') { inQuotes = !inQuotes; continue; }
    if (char === ',' && !inQuotes) { result.push(current.trim()); current = ''; continue; }
    current += char;
  }
  result.push(current.trim());
  return result;
};

const seed = async () => {
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`❌ CSV file not found: ${CSV_PATH}`);
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  const rl = readline.createInterface({ input: fs.createReadStream(CSV_PATH) });
  const lines = [];

  for await (const line of rl) {
    lines.push(line);
  }

  const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, ''));
  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length < 2) continue;
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = values[idx] || ''; });

    records.push({
      name: obj.name || '',
      email: (obj.email || '').toLowerCase(),
      contact: obj.contact || '',
      address: obj.address || '',
      ward: obj.ward || '',
      isBmcPartner: obj.isbmcpartner === 'true' || obj.isbmcpartner === '1',
      areaOfWork: obj.areaofwork ? obj.areaofwork.split(',').map((s) => s.trim()) : [],
    });
  }

  // Clear existing and insert fresh
  await NGOData.deleteMany({});
  const inserted = await NGOData.insertMany(records);
  console.log(`✅ Seeded ${inserted.length} NGOs into MongoDB`);

  await mongoose.disconnect();
  console.log('🔌 Disconnected. Seed complete!');
};

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});