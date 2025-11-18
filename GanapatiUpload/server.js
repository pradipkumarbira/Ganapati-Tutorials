// ======================= 
//    Ganapati Tutorials
//        server.js
// =======================

const dotenv = require("dotenv");
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const cors = require("cors");

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =======================
// Folder Paths
// =======================

// ⚠️ THIS IS THE FIX
// Your server.js is INSIDE GanapatiUpload/
// So uploads folder is also INSIDE GanapatiUpload/
const uploadFolder = path.join(__dirname, "uploads");

// Create uploads folder if missing
if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder, { recursive: true });
  console.log("📁 Created uploads folder:", uploadFolder);
}

// Serve uploaded files
app.use("/GanapatiUpload/uploads", express.static(uploadFolder));

// Serve frontend (index.html, classes folder, etc.)
const rootFolder = path.join(__dirname, "..");
app.use(express.static(rootFolder));

// =======================
// Multer storage
// =======================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const className = req.body.className?.trim() || "General";
    const subjectName = req.body.subjectName?.trim() || "Misc";

    const folderPath = path.join(uploadFolder, className, subjectName);
    fs.mkdirSync(folderPath, { recursive: true });

    console.log(`📂 Uploading to: ${folderPath}`);
    cb(null, folderPath);
  },

  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const original = path.basename(file.originalname);
    cb(null, `${timestamp}_${original}`);
  }
});

const upload = multer({ storage });

// =======================
// Upload Route
// =======================
app.post("/upload", upload.single("file"), (req, res) => {
  if (req.body.password !== process.env.UPLOAD_PASSWORD) {
    return res.status(401).json({ error: "❌ Wrong password" });
  }

  const { className = "General", subjectName = "Misc" } = req.body;
  const fileName = req.file.filename;

  const baseUrl = `/GanapatiUpload/uploads/${className}/${subjectName}/${encodeURIComponent(fileName)}`;

  res.json({
    message: "✅ File uploaded successfully!",
    viewUrl: baseUrl,
    downloadUrl: `${baseUrl}?download=true`
  });
});

// =======================
// View or Download File
// =======================
app.get("/GanapatiUpload/uploads/:className/:subjectName/:filename", (req, res) => {
  const { className, subjectName, filename } = req.params;

  const filePath = path.join(uploadFolder, className, subjectName, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send("❌ File not found");
  }

  if (req.query.download === "true") {
    return res.download(filePath);
  }

  res.sendFile(filePath);
});

// =======================
// Default Route
// =======================
app.get("*", (req, res) => {
  res.sendFile(path.join(rootFolder, "index.html"));
});

// Start Server
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});

// =======================
// Multer storage settings
// =======================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const className = req.body.className?.trim() || "General";
    const subjectName = req.body.subjectName?.trim() || "Misc";

    const folderPath = path.join(uploadFolder, className, subjectName);

    fs.mkdirSync(folderPath, { recursive: true });
    console.log(`📂 Uploading to: ${folderPath}`);

    cb(null, folderPath);
  },

  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const original = path.basename(file.originalname);
    cb(null, `${timestamp}_${original}`);
  }
});

const upload = multer({ storage });

// =======================
// Upload Route
// =======================
app.post("/upload", upload.single("file"), (req, res) => {

  // Password check
  if (req.body.password !== process.env.UPLOAD_PASSWORD) {
    return res.status(401).json({ error: "❌ Wrong password" });
  }

  const { className = "General", subjectName = "Misc" } = req.body;
  const fileName = req.file.filename;

  const baseUrl = `/GanapatiUpload/uploads/${className}/${subjectName}/${encodeURIComponent(fileName)}`;

  const viewUrl = baseUrl;
  const downloadUrl = `${baseUrl}?download=true`;

  console.log(`✅ Uploaded: ${fileName} → ${className}/${subjectName}`);

  res.json({
    message: "✅ File uploaded successfully!",
    viewUrl,
    downloadUrl
  });
});

// =======================
// View or Download File
// =======================
app.get("/GanapatiUpload/uploads/:className/:subjectName/:filename", (req, res) => {
  const { className, subjectName, filename } = req.params;

  const filePath = path.join(uploadFolder, className, subjectName, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send("❌ File not found");
  }

  if (req.query.download === "true") {
    return res.download(filePath);
  }

  return res.sendFile(filePath);
});

// =======================
// Default route (index.html)
// =======================
app.get("*", (req, res) => {
  res.sendFile(path.join(rootFolder, "index.html"));
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});

