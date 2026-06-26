require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const connectDB = require('./config/db');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: 'http://localhost:3000', methods: ['GET', 'POST'] }
});

// middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// multer file upload config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, 'uploads')),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, unique + ext);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
});

// upload endpoint
const auth = require('./middleware/auth');
app.post('/api/upload', auth, upload.single('media'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const url = `http://localhost:${process.env.PORT || 5000}/uploads/${req.file.filename}`;
  let mediaType = 'file';
  if (req.file.mimetype.startsWith('image/')) mediaType = 'image';
  else if (req.file.mimetype.startsWith('video/')) mediaType = 'video';
  res.json({ url, filename: req.file.filename, mediaType, originalName: req.file.originalname });
});

// routes
app.use('/api/auth',          require('./routes/authRoutes'));
app.use('/api/users',         require('./routes/userRoutes'));
app.use('/api/groups',        require('./routes/groupRoutes'));
app.use('/api/posts',         require('./routes/postRoutes'));
app.use('/api/stats',         require('./routes/statsRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/messages',      require('./routes/messageRoutes'));

// make io accessible to controllers via app
app.set('io', io);

// socket.io authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Authentication required'));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    socket.userRole = decoded.role;
    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
});

// socket.io chat + notifications
require('./socket/chatHandler')(io);

// track online users for real-time notifications
const onlineUsers = new Map();
io.on('connection', (socket) => {
  if (socket.userId) {
    onlineUsers.set(socket.userId, socket.id);
    socket.join(`user_${socket.userId}`);
  }
  socket.on('disconnect', () => {
    if (socket.userId) onlineUsers.delete(socket.userId);
  });
});
app.set('onlineUsers', onlineUsers);

// global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong' });
});

// start
const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  // ensure uploads directory exists
  const fs = require('fs');
  const uploadsDir = path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
