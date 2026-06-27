// Load environment variables from .env file (MONGO_URI, JWT_SECRET, PORT)
require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io'); // WebSocket server built on top of http
const cors = require('cors');            // Allow cross-origin requests from React (port 3000)
const path = require('path');            // Node built-in: for resolving file paths
const jwt = require('jsonwebtoken');     // For verifying socket auth tokens
const multer = require('multer');        // Middleware for handling multipart file uploads
const helmet = require('helmet');        // Sets secure HTTP headers (XSS, clickjacking, etc.)
const rateLimit = require('express-rate-limit'); // Limits repeated requests (brute-force protection)
const connectDB = require('./config/db');         // Our MongoDB connection helper

const app = express();

// Wrap Express in a native HTTP server so Socket.io can share the same port
const server = http.createServer(app);

// Attach Socket.io to the HTTP server; allow WebSocket connections from the React client
const io = new Server(server, {
  cors: { origin: 'http://localhost:3000', methods: ['GET', 'POST'] }
});

// Helmet automatically sets ~15 security-related HTTP response headers:
//   Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, etc.
// crossOriginResourcePolicy: 'cross-origin' allows uploaded images/files to be
// served to the React app on a different port without CORP blocking.
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// Rate limiting — prevents abuse and brute-force attacks.
// General API: 200 requests per 15 minutes per IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15-minute window
  max: 200,
  standardHeaders: true,     // Return rate limit info in RateLimit-* headers
  legacyHeaders: false,      // Disable the old X-RateLimit-* headers
  message: { error: 'Too many requests, please try again later' }
});

// Auth endpoints get a stricter limit: 20 requests per 15 minutes
// This specifically prevents password brute-forcing on login/register
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many login attempts, please try again later' }
});

app.use('/api/', apiLimiter);        // Apply general limit to ALL /api/* routes
app.use('/api/auth', authLimiter);   // Apply stricter limit on top for auth routes

app.use(cors());                                    // Allow all cross-origin requests
app.use(express.json({ limit: '1mb' }));           // Parse JSON request bodies (max 1MB)
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve uploaded files

// diskStorage saves files to disk (as opposed to memory).
// This is better for large files like videos and PDFs.
const storage = multer.diskStorage({
  // Destination: save all uploads to the /server/uploads/ folder
  destination: (req, file, cb) => cb(null, path.join(__dirname, 'uploads')),

  // Filename: generate a unique name to avoid overwriting existing files.
  // Format: <timestamp>-<random9digits>.<original extension>
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname); // e.g. ".docx", ".pdf", ".png"
    cb(null, unique + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max file size
});

// POST /api/upload — Upload a single file (requires authentication)
// The React client sends a FormData with field name 'media'.
// Returns the public URL, server filename, media type, and original filename.
const auth = require('./middleware/auth');
app.post('/api/upload', auth, upload.single('media'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  // Build a publicly accessible URL for the uploaded file
  const url = `http://localhost:${process.env.PORT || 5000}/uploads/${req.file.filename}`;

  // Determine the type of media based on MIME type
  let mediaType = 'file';                                  // default: generic file (PDF, DOCX, etc.)
  if (req.file.mimetype.startsWith('image/')) mediaType = 'image';
  else if (req.file.mimetype.startsWith('video/')) mediaType = 'video';

  // Return all info the client needs to display/link the file correctly
  res.json({
    url,
    filename: req.file.filename,          // the hashed server filename
    mediaType,
    originalName: req.file.originalname  // the original filename (e.g. "homework.docx")
  });
});

// Mount each resource's router on its base path.
// All requests to /api/posts/... will be handled by postRoutes.js, etc.
app.use('/api/auth',          require('./routes/authRoutes'));
app.use('/api/users',         require('./routes/userRoutes'));
app.use('/api/groups',        require('./routes/groupRoutes'));
app.use('/api/posts',         require('./routes/postRoutes'));
app.use('/api/stats',         require('./routes/statsRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/messages',      require('./routes/messageRoutes'));

// Make the Socket.io instance available to controllers via req.app.get('io')
// This lets controllers emit real-time notifications without importing io directly
app.set('io', io);

// Every WebSocket connection must provide a valid JWT in the handshake auth field.
// The React client sends: io('http://localhost:5000', { auth: { token } })
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Authentication required'));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;       // attach userId for use in event handlers
    socket.userRole = decoded.role;
    next();                           // allow the connection
  } catch (err) {
    next(new Error('Invalid token')); // reject the connection
  }
});

// chatHandler.js handles all chat events: join_room, send_message, typing, etc.
require('./socket/chatHandler')(io);

// Track which users are currently online (userId → socketId mapping)
// Used to know whether to show online indicators in the UI
const onlineUsers = new Map();

io.on('connection', (socket) => {
  if (socket.userId) {
    onlineUsers.set(socket.userId, socket.id);
    // Each user joins their own private room so we can target them directly
    // e.g. io.to(`user_${recipientId}`).emit('new_notification', ...)
    socket.join(`user_${socket.userId}`);
  }
  socket.on('disconnect', () => {
    if (socket.userId) onlineUsers.delete(socket.userId);
  });
});

// Make onlineUsers available to controllers (e.g. to check if recipient is online)
app.set('onlineUsers', onlineUsers);

// Catches any unhandled errors thrown by route handlers (must have 4 params)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong' });
});

const PORT = process.env.PORT || 5000;

// Connect to MongoDB first, then start listening for HTTP/WebSocket connections
connectDB().then(() => {
  // Ensure the uploads directory exists (create it on first run)
  const fs = require('fs');
  const uploadsDir = path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
