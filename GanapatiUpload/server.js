const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// Serve static files
app.use(express.static('public')); // tera HTML/CSS/JS public folder me ho

// Ensure uploads folder exists
const uploadFolder = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadFolder)) fs.mkdirSync(uploadFolder);

// Multer config
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, uploadFolder);
  },
  filename: function(req, file, cb) {
    cb(null, file.originalname); // Save with original filename
  }
});
const upload = multer({ storage: storage });

// Body parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Upload route with password
app.post('/upload', upload.single('file'), (req, res) => {
  const password = req.body.password;
  if (password !== process.env.UPLOAD_PASSWORD) {
    return res.status(401).send('Wrong password!');
  }
  res.send(`File uploaded successfully: ${req.file.originalname}`);
});

// Serve uploaded file dynamically
app.get('/file/:filename', (req, res) => {
  const filepath = path.join(uploadFolder, req.params.filename);
  if (fs.existsSync(filepath)) {
    res.sendFile(filepath);
  } else {
    res.status(404).send('File not found');
  }
});

app.listen(port, () => console.log(`Server running on port ${port}`));
