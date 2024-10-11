const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const multer = require('multer');  // For file uploads
const session = require('express-session'); // To maintain login sessions

const app = express();
const PORT = 3000;

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/userdb')
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Failed to connect to MongoDB', err));

// Middleware to parse form data
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session middleware
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true
}));

// Set up multer for handling profile picture uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/');  // Uploads go to this folder
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));  // Add timestamp to avoid name conflicts
  }
});

const upload = multer({ storage: storage });

// User schema and model
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  mobile: String,
  designation: String,
  profilePicture: String  // Path to profile picture
});

const User = mongoose.model('User', userSchema);

// Routes

// Registration Page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Login Page
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

// Handle User Registration with Profile Picture Upload
app.post('/register', upload.single('profilePicture'), async (req, res) => {
  const { name, email, password, mobile, designation } = req.body;
  const profilePicture = req.file ? req.file.filename : null;

  const newUser = new User({ name, email, password, mobile, designation, profilePicture });

  await newUser.save();

  // Save user details in session and redirect to profile page
  req.session.user = newUser;
  res.redirect('/profile');
});

// Handle User Login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email, password });

  if (user) {
    // Save user details in session and redirect to profile page
    req.session.user = user;
    res.redirect('/profile');
  } else {
    res.send('Invalid credentials');
  }
});

// Profile Page
app.get('/profile', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  res.sendFile(path.join(__dirname, 'views', 'profile.html'));
});

// API to fetch user data (to display on profile page)
app.get('/api/profile', (req, res) => {
  if (!req.session.user) {
    return res.status(401).send('Unauthorized');
  }

  res.json(req.session.user);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
