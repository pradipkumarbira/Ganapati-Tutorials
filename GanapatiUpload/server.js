// server.js
const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for frontend requests
app.use(cors());

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Define paths
const publicFolder = path.join(__dirname, 'public');
const uploadFolder = path.join(__dirname, 'uploads');

// Ensure uploads folder exists
if (!fs.existsSync(uploadFolder)) fs.mkdirSync(uploadFolder);

// Serve frontend files
app.use(express.static(publicFolder));

// Multer setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadFolder);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage });

// Upload API
app.post('/upload', upload.single('file'), (req, res) => {
  const password = req.body.password;
  if (password !== process.env.UPLOAD_PASSWORD) {
    return res.status(401).json({ error: 'Wrong password!' });
  }
  return res.json({ message: 'File uploaded successfully', filename: req.file.originalname });
});

// Serve a single file (view or download)
app.get('/file/:filename', (req, res) => {
  const filepath = path.join(uploadFolder, req.params.filename);
  if (!fs.existsSync(filepath)) return res.status(404).send('File not found');

  if (req.query.download === 'true') {
    return res.download(filepath);
  }
  res.sendFile(filepath);
});

// List all uploaded files
app.get('/files', (req, res) => {
  fs.readdir(uploadFolder, (err, files) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    res.json(files);
  });
});

// Fallback route for React/SPA support (optional)
app.get('*', (req, res) => {
  res.sendFile(path.join(publicFolder, 'class9(science).html'));
});

// Start server
app.listen(port, () => console.log(`Server running on port ${port}`));
