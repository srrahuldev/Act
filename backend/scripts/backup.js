const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const User = require('../models/User');
const Transaction = require('../models/Transaction');

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected for backup'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

const backupData = async () => {
  try {
    console.log('Fetching users...');
    const users = await User.find({});
    
    console.log('Fetching transactions...');
    const transactions = await Transaction.find({});
    
    const backup = {
      timestamp: new Date().toISOString(),
      data: {
        users,
        transactions
      }
    };

    const backupDir = path.resolve(__dirname, '../backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }

    const fileName = `backup_${Date.now()}.json`;
    const filePath = path.join(backupDir, fileName);

    fs.writeFileSync(filePath, JSON.stringify(backup, null, 2));

    console.log(`✅ Backup successful! File saved to: ${filePath}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Backup failed:', err.message);
    process.exit(1);
  }
};

backupData();
