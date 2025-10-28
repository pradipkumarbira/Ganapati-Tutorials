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

// Enable CORS
app.use(cors());

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Paths (IMPORTANT FIX)
const rootFolder = path.join(__dirname, '..'); // one level up from GanapatiUpload
const uploadFolder = path.join(rootFolder, 'uploads'); // uploads directly inside main project

// ✅ Ensure uploads folder exists (with recursive)
if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder, { recursive: true });
  console.log('Uploads folder created at:', uploadFolder);
}

// ✅ Serve all frontend files (your HTMLs in root)
app.use(express.static(rootFolder));

// ✅ Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadFolder),
  filename: (req, file, cb) => {
    const customName = req.body.filename || file.originalname;
    cb(null, customName);
  },
});
const upload = multer({ storage });

// ===== ROUTES =====

// ✅ Upload route
app.post('/upload', upload.single('file'), (req, res) => {
  const password = req.body.password;
  if (password !== process.env.UPLOAD_PASSWORD) {
    return res.status(401).json({ error: 'Wrong password!' });
  }
  return res.json({
    message: 'File uploaded successfully',
    filename: req.file.filename,
  });
});

// ✅ Serve a specific file (view/download)
app.get('/file/:filename', (req, res) => {
  const filepath = path.join(uploadFolder, req.params.filename);

  if (!fs.existsSync(filepath)) return res.status(404).send('File not found');

  // Download if ?download=true
  if (req.query.download === 'true') {
    res.setHeader('Content-Disposition', `attachment; filename="${req.params.filename}"`);
    return res.download(filepath);
  }

  // Otherwise open in browser
  res.sendFile(filepath, err => {
    if (err) {
      console.error('Error sending file:', err);
      res.status(500).send('Error opening file');
    }
  });
});

// ✅ List all uploaded files (important for frontend display)
app.get('/files', (req, res) => {
  fs.readdir(uploadFolder, (err, files) => {
    if (err) return res.status(500).json({ error: 'Server error' });

    const fileList = files.map(file => ({
      name: file,
      viewUrl: `/file/${encodeURIComponent(file)}`,
      downloadUrl: `/file/${encodeURIComponent(file)}?download=true`
    }));

    res.json(fileList);
  });
});

// ✅ Default fallback (serve index.html if available)
app.get('*', (req, res) => {
  const indexPath = path.join(rootFolder, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.send('Server running. No index.html found.');
  }
});

// ✅ Start server
app.listen(port, () => console.log(`✅ Server running on port ${port}`));
