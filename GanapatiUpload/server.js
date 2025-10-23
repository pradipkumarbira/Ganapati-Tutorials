const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const multer = require('multer');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;  // ✅ IMPORTANT CHANGE

// Serve static files
app.use(express.static(__dirname));

// Upload folder setup
const upload = multer({ dest: 'uploads/' });
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.urlencoded({ extended: true }));

// Upload route
app.post('/upload', upload.single('file'), (req, res) => {
  const password = req.body.password;
  if (password !== process.env.UPLOAD_PASSWORD) {
    return res.send('Wrong password!');
  }
  res.send(`File uploaded: ${req.file.originalname}`);
});

// ✅ IMPORTANT: dynamic PORT for Render
app.listen(port, () => console.log(`Server running at port ${port}`));
