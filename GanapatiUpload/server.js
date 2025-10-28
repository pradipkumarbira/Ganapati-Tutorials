// ✅ server.js (GanapatiUpload/server.js)
const dotenv = require('dotenv');
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

// Load .env variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// ✅ Enable CORS and body parsing
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Define folder paths
const rootFolder = path.join(__dirname, '..');         // → Ganapati-Tutorials (frontend)
const uploadFolder = path.join(__dirname, 'uploads');  // → GanapatiUpload/uploads

// ✅ Ensure 'uploads' folder exists
if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder, { recursive: true });
  console.log('📁 Uploads folder created at:', uploadFolder);
}

// ✅ Make uploads publicly accessible
app.use('/uploads', express.static(uploadFolder));

// ✅ Serve all frontend files (like index.html, upload.html)
app.use(express.static(rootFolder));

// ✅ Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadFolder),
  filename: (req, file, cb) => {
    // Optional: add timestamp to avoid duplicate name conflicts
    const timestamp = Date.now();
    const originalName = path.basename(file.originalname);
    const customName = req.body.filename || `${timestamp}_${originalName}`;
    cb(null, customName);
  },
});

const upload = multer({ storage });

// ✅ UPLOAD API (with password protection)
app.post('/upload', upload.single('file'), (req, res) => {
  try {
    const password = req.body.password;
    if (password !== process.env.UPLOAD_PASSWORD) {
      return res.status(401).json({ error: '❌ Wrong password!' });
    }

    return res.json({
      message: '✅ File uploaded successfully!',
      filename: req.file.filename,
      viewUrl: `/file/${encodeURIComponent(req.file.filename)}`,
      downloadUrl: `/file/${encodeURIComponent(req.file.filename)}?download=true`,
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Server error during upload.' });
  }
});

// ✅ VIEW or DOWNLOAD API
app.get('/file/:filename', (req, res) => {
  try {
    const filePath = path.join(uploadFolder, req.params.filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).send('❌ File not found');
    }

    if (req.query.download === 'true') {
      // Trigger file download
      return res.download(filePath);
    }

    // View file in browser (for PDFs, images, etc.)
    return res.sendFile(filePath);
  } catch (err) {
    console.error('File view/download error:', err);
    res.status(500).send('Error accessing file.');
  }
});

// ✅ FILE LIST API (optional)
app.get('/files', (req, res) => {
  fs.readdir(uploadFolder, (err, files) => {
    if (err) return res.status(500).json({ error: 'Server error while listing files.' });

    const fileList = files.map(file => ({
      name: file,
      viewUrl: `/file/${encodeURIComponent(file)}`,
      downloadUrl: `/file/${encodeURIComponent(file)}?download=true`
    }));

    res.json(fileList);
  });
});

// ✅ FALLBACK for unknown routes
app.get('*', (req, res) => {
  const indexPath = path.join(rootFolder, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.send('✅ Server is running — index.html not found.');
  }
});

// ✅ Start the Server
app.listen(port, () => console.log(`🚀 Server running on port ${port}`));

ye sahi hai to
