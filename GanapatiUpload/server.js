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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Define folders
const rootFolder = path.join(__dirname, '..'); // root of your project
const uploadFolder = path.join(__dirname, 'uploads'); // keep uploads in same folder as server.js

// ✅ Ensure uploads folder exists
if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder, { recursive: true });
  console.log('Uploads folder created at:', uploadFolder);
}

// ✅ Make uploads folder publicly accessible
app.use('/uploads', express.static(uploadFolder));

// ✅ Serve frontend files
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

// ✅ View / Download route
app.get('/file/:filename', (req, res) => {
  const filePath = path.join(uploadFolder, req.params.filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send('File not found');
  }

  // For download
  if (req.query.download === 'true') {
    return res.download(filePath);
  }

  // For view in browser
  return res.sendFile(filePath);
});

// ✅ List all uploaded files (optional)
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

// ✅ Default fallback
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
