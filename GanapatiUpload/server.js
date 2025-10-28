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

// ✅ Ensure uploads folder exists
if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder, { recursive: true });
  console.log("📁 Created uploads folder at:", uploadFolder);
}

// ✅ Serve uploads publicly
app.use("/uploads", express.static(uploadFolder));
app.use(express.static(rootFolder));

// ✅ Multer setup (creates subfolders based on class + subject)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const className = req.body.className?.trim() || "General";
    const subjectName = req.body.subjectName?.trim() || "Misc";

    const folderPath = path.join(uploadFolder, className, subjectName);
    fs.mkdirSync(folderPath, { recursive: true }); // ensure folders exist

    cb(null, folderPath);
  },
  filename: (req, file, cb) => {
    const originalName = path.basename(file.originalname);
    const timestamp = Date.now();
    cb(null, `${timestamp}_${originalName}`);
  },
});

const upload = multer({ storage });

// ✅ Upload API (with password)
app.post("/upload", upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "❌ No file received." });
    }

    const password = req.body.password;
    if (password !== process.env.UPLOAD_PASSWORD) {
      fs.unlinkSync(req.file.path); // delete uploaded file if wrong password
      return res.status(401).json({ error: "❌ Wrong password!" });
    }

    const className = req.body.className || "General";
    const subjectName = req.body.subjectName || "Misc";
    const fileName = req.file.filename;

    const viewUrl = `/file/${encodeURIComponent(className)}/${encodeURIComponent(subjectName)}/${encodeURIComponent(fileName)}`;
    const downloadUrl = `${viewUrl}?download=true`;

    res.json({
      message: "✅ File uploaded successfully!",
      viewUrl,
      downloadUrl,
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Server error during upload." });
  }
});

// ✅ View / Download API
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

// ✅ Optional — List all uploaded files
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
        const parts = relPath.split(path.sep);
        if (parts.length >= 3) {
          const [className, subjectName, fileName] = parts;
          result.push({
            name: fileName,
            className,
            subjectName,
            viewUrl: `/file/${className}/${subjectName}/${fileName}`,
            downloadUrl: `/file/${className}/${subjectName}/${fileName}?download=true`,
          });
        }
      }
    }
  }

  walkDir(uploadFolder);
  res.json(result);
});

// ✅ Fallback for frontend
app.get("*", (req, res) => {
  const indexPath = path.join(rootFolder, "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.send("✅ Server running, but index.html not found.");
  }
});

// ✅ Start Server
app.listen(port, () => console.log(`🚀 Server running on port ${port}`));
