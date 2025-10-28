// ✅ server.js (GanapatiUpload/server.js)
const dotenv = require("dotenv");
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const cors = require("cors");

// Load .env variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// ✅ Enable CORS and body parsing
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Folder paths
const rootFolder = path.join(__dirname, ".."); // → Ganapati-Tutorials
const uploadFolder = path.join(__dirname, "uploads"); // → GanapatiUpload/uploads

// ✅ Ensure 'uploads' base folder exists
if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder, { recursive: true });
  console.log("📁 Created uploads folder at:", uploadFolder);
}

// ✅ Make uploads public
app.use("/uploads", express.static(uploadFolder));
app.use(express.static(rootFolder));

// ✅ Configure Multer for dynamic subfolders (class + subject)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const className = req.body.className || "General";
    const subjectName = req.body.subjectName || "Misc";

    const folderPath = path.join(uploadFolder, className, subjectName);
    fs.mkdirSync(folderPath, { recursive: true }); // Auto create subfolders

    cb(null, folderPath);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const originalName = path.basename(file.originalname);
    const customName = req.body.filename || `${timestamp}_${originalName}`;
    cb(null, customName);
  },
});

const upload = multer({ storage });

// ✅ UPLOAD API (with password)
app.post("/upload", upload.single("file"), (req, res) => {
  try {
    const password = req.body.password;
    if (password !== process.env.UPLOAD_PASSWORD) {
      return res.status(401).json({ error: "❌ Wrong password!" });
    }

    const className = req.body.className || "General";
    const subjectName = req.body.subjectName || "Misc";
    const fileName = req.file.filename;
    const filePath = `/uploads/${encodeURIComponent(className)}/${encodeURIComponent(subjectName)}/${encodeURIComponent(fileName)}`;

    return res.json({
      message: "✅ File uploaded successfully!",
      viewUrl: `/file/${className}/${subjectName}/${encodeURIComponent(fileName)}`,
      downloadUrl: `/file/${className}/${subjectName}/${encodeURIComponent(fileName)}?download=true`,
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Server error during upload." });
  }
});

// ✅ VIEW / DOWNLOAD API
app.get("/file/:className/:subjectName/:filename", (req, res) => {
  try {
    const { className, subjectName, filename } = req.params;
    const filePath = path.join(uploadFolder, className, subjectName, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).send("❌ File not found");
    }

    if (req.query.download === "true") {
      return res.download(filePath);
    }

    res.sendFile(filePath);
  } catch (err) {
    console.error("File access error:", err);
    res.status(500).send("Error accessing file.");
  }
});

// ✅ Optional API — list all uploaded files
app.get("/files", (req, res) => {
  const result = [];

  function walkDir(dirPath, base = "") {
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
      const fullPath = path.join(dirPath, file);
      const relPath = path.join(base, file);
      const stats = fs.statSync(fullPath);
      if (stats.isDirectory()) {
        walkDir(fullPath, relPath);
      } else {
        result.push({
          name: relPath,
          viewUrl: `/file/${relPath.replace(/\\/g, "/")}`,
          downloadUrl: `/file/${relPath.replace(/\\/g, "/")}?download=true`,
        });
      }
    }
  }

  walkDir(uploadFolder);
  res.json(result);
});

// ✅ Fallback for frontend routes
app.get("*", (req, res) => {
  const indexPath = path.join(rootFolder, "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.send("✅ Server is running but index.html not found.");
  }
});

// ✅ Start Server
app.listen(port, () => console.log(`🚀 Server running on port ${port}`));
