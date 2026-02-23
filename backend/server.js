const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);

// Load env: .env first, then .env.example fills any missing vars (dotenv does not override)
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, '.env.example');
require('dotenv').config({ path: envPath });
require('dotenv').config({ path: envExamplePath });

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads', 'accommodations');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');
const hostRoutes = require('./routes/hostRoutes');

app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);
app.use('/api/host', hostRoutes);

// Socket.IO
const initSocket = require('./config/socket');
initSocket(server);

// DB & Start
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const MONGODB_URI = process.env.MONGODB_URI;
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;

if (!MONGODB_URI || typeof MONGODB_URI !== 'string') {
  console.error('\n❌ MONGODB_URI is not set or invalid.');
  console.error('   Copy .env.example to .env and add your MongoDB connection string:');
  console.error('   Windows: copy .env.example .env');
  console.error('   Mac/Linux: cp .env.example .env');
  console.error('   Then edit .env with your credentials.\n');
  process.exit(1);
}
if (/YOUR_(USER|PASSWORD|CLUSTER|DB)/i.test(MONGODB_URI)) {
  console.error('\n❌ MONGODB_URI still has placeholder values. Edit .env with your real MongoDB credentials.\n');
  process.exit(1);
}

if (!JWT_SECRET || typeof JWT_SECRET !== 'string' || JWT_SECRET.length < 16) {
  console.error('\n❌ JWT_SECRET is not set, invalid, or too short (min 16 chars).');
  console.error('   Add a secure random string to .env, e.g.:');
  console.error('   JWT_SECRET=your-long-random-secret-at-least-16-chars\n');
  process.exit(1);
}

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("MongoDB Connected");
  } catch (err) {
    console.error("Mongo Error:", err.message);
    process.exit(1);
  }
}

connectDB();

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
