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
// Upload Folder
// =======================
const uploadFolder = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadFolder)) {
    fs.mkdirSync(uploadFolder, { recursive: true });
}

// Static file serving
app.use("/GanapatiUpload/uploads", express.static(uploadFolder));

// Frontend root folder
const rootFolder = path.join(__dirname, "..");
app.use(express.static(rootFolder));

// =======================
// Multer Setup
// =======================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const className = (req.body.className || "General").trim();
        const subjectName = (req.body.subjectName || "Misc").trim();

        const folderPath = path.join(uploadFolder, className, subjectName);
        fs.mkdirSync(folderPath, { recursive: true });

        cb(null, folderPath);
    },

    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const original = file.originalname;
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

    const className = req.body.className || "General";
    const subjectName = req.body.subjectName || "Misc";
    const fileName = req.file.filename;

    const fileUrl = `/GanapatiUpload/uploads/${className}/${subjectName}/${fileName}`;

    res.json({
        message: "✅ File uploaded successfully!",
        viewUrl: fileUrl,
        downloadUrl: `${fileUrl}?download=true`
    });
});

// =======================
// File View / Download
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
// SPA Fallback
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
