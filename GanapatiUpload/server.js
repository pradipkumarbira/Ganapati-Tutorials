// Example server.js for Ganapati Tutorials
// Adjust paths as needed

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 5000;

// Create uploads folder if missing
const uploadPath = path.join(__dirname, 'GanapatiUpload');
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath);
}

// Multer storage setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage: storage });

// For JSON
app.use(express.json());
app.use('/GanapatiUpload', express.static(uploadPath));

// Upload API
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  res.json({
    message: 'File uploaded successfully',
    fileUrl: `/GanapatiUpload/${req.file.filename}`,
  });
});

// View files API
app.get('/files', (req, res) => {
  fs.readdir(uploadPath, (err, files) => {
    if (err) return res.status(500).json({ error: 'Error reading files' });
    const fileList = files.map(f => ({ name: f, url: `/GanapatiUpload/${f}` }));
    res.json(fileList);
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
