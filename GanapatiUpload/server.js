// =======================
//     Ganapati Tutorials
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

// =======================
// Middleware
// =======================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =======================
// Folder Setup
// =======================
const uploadFolder = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder, { recursive: true });
  console.log("📁 Created uploads folder:", uploadFolder);
}

// static serve
app.use("/GanapatiUpload/uploads", express.static(uploadFolder));

// frontend root
const rootFolder = path.join(__dirname, "..");
app.use(express.static(rootFolder));

// =======================
// Multer Storage
// =======================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const className = (req.body.className || "General").trim();
    const subjectName = (req.body.subjectName || "Misc").trim();

    const folderPath = path.join(uploadFolder, className, subjectName);

    fs.mkdirSync(folderPath, { recursive: true });
    console.log(`📂 Uploading To: ${folderPath}`);

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

  const className = req.body.className;
  const subjectName = req.body.subjectName;
  const fileName = req.file.filename;

  const fullPath = `/GanapatiUpload/uploads/${className}/${subjectName}/${fileName}`;

  res.json({
    message: "✅ File uploaded successfully!",
    viewUrl: fullPath,
    downloadUrl: `${fullPath}?download=true`,
    savedFileName: fileName
  });
});

// =======================
// View / Download Files
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
// SPA Route
// =======================
app.get("*", (req, res) => {
  res.sendFile(path.join(rootFolder, "index.html"));
});

// =======================
// Start Server
// =======================
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
