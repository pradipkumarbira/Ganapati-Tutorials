// server.js
const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// Serve static files from public folder
app.use(express.static('public'));

// Ensure uploads folder exists
const uploadFolder = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadFolder)) fs.mkdirSync(uploadFolder);

// Multer config
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, uploadFolder);
  },
  filename: function(req, file, cb) {
    cb(null, file.originalname); // Keep original filename
  }
});
const upload = multer({ storage });

// Body parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ----------------- Upload Route -----------------
app.post('/upload', upload.single('file'), (req, res) => {
  const password = req.body.password;
  if (password !== process.env.UPLOAD_PASSWORD) {
    return res.status(401).send('Wrong password!');
  }
  res.json({ message: 'File uploaded successfully', filename: req.file.originalname });
});

// ----------------- Serve Single File -----------------
app.get('/file/:filename', (req, res) => {
  const filepath = path.join(uploadFolder, req.params.filename);
  if (!fs.existsSync(filepath)) return res.status(404).send('File not found');

  if (req.query.download === 'true') {
    return res.download(filepath); // Force download
  }

  res.sendFile(filepath); // Open in browser
});

// ----------------- List All Files -----------------
app.get('/files', (req, res) => {
  fs.readdir(uploadFolder, (err, files) => {
    if (err) return res.status(500).send('Server error');
    res.json(files); // Send array of filenames
  });
});

// ----------------- Start Server -----------------
app.listen(port, () => console.log(`Server running on port ${port}`));
