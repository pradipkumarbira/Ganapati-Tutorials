// ✅ server.js
const dotenv = require("dotenv");
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const cors = require("cors");

// Load env
dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Paths
const rootFolder = path.join(__dirname, "..");
const uploadFolder = path.join(__dirname, "uploads");

// Ensure uploads folder exists
if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder, { recursive: true });
  console.log("📁 Created uploads folder:", uploadFolder);
}

// Serve static files
app.use("/uploads", express.static(uploadFolder));
app.use(express.static(rootFolder));

// Multer storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const className = req.body.className || "General";
    const subjectName = req.body.subjectName || "Misc";
    const folderPath = path.join(uploadFolder, className, subjectName);
    fs.mkdirSync(folderPath, { recursive: true });
    cb(null, folderPath);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const originalName = path.basename(file.originalname);
    cb(null, `${timestamp}_${originalName}`);
  },
});

const upload = multer({ storage });

// Upload route
app.post("/upload", upload.single("file"), (req, res) => {
  const password = req.body.password;
  if (password !== process.env.UPLOAD_PASSWORD) {
    return res.status(401).json({ error: "❌ Wrong password" });
  }

  const className = req.body.className || "General";
  const subjectName = req.body.subjectName || "Misc";
  const fileName = req.file.filename;
  const viewUrl = `/file/${className}/${subjectName}/${encodeURIComponent(fileName)}`;
  const downloadUrl = `${viewUrl}?download=true`;

  res.json({
    message: "✅ File uploaded successfully!",
    viewUrl,
    downloadUrl,
  });
});

// File view/download
app.get("/file/:className/:subjectName/:filename", (req, res) => {
  const { className, subjectName, filename } = req.params;
  const filePath = path.join(uploadFolder, className, subjectName, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send("❌ File not found");
  }

  if (req.query.download === "true") {
    res.download(filePath);
  } else {
    res.sendFile(filePath);
  }
});

// Default route
app.get("*", (req, res) => {
  const indexPath = path.join(rootFolder, "index.html");
  res.sendFile(indexPath);
});

// Start server
app.listen(port, () => console.log(`🚀 Server running on port ${port}`));
