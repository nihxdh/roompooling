const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);

require('dotenv').config();

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

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB Connected");
  } catch (err) {
    console.log("Mongo Error:", err);
  }
}

connectDB();

const PORT = process.env.PORT;

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
