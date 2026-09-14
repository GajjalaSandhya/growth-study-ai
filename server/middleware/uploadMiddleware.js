import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.resolve(__dirname, "../uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".pdf";
    const safeBaseName = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .substring(0, 50);
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}`;
    cb(null, `${uniqueSuffix}-${safeBaseName}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const isPdfExt = path.extname(file.originalname).toLowerCase() === ".pdf";
  const isPdfMime = file.mimetype === "application/pdf";

  if (isPdfExt && isPdfMime) {
    cb(null, true);
  } else {
    const error = new Error("Invalid file type. Only PDF documents (.pdf) are allowed.");
    error.statusCode = 400;
    cb(error, false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB max file size
  },
});

/**
 * Middleware handling single PDF upload with validation
 */
export const handleSinglePdfUpload = (req, res, next) => {
  // Allow 'file' or 'material' field name
  const singleUpload = upload.single("file");

  singleUpload(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            success: false,
            message: "File size limit exceeded. Maximum allowed size is 20MB.",
          });
        }
        return res.status(400).json({
          success: false,
          message: `File upload error: ${err.message}`,
        });
      }
      return res.status(err.statusCode || 400).json({
        success: false,
        message: err.message || "File upload failed",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No PDF file provided in request",
      });
    }

    next();
  });
};

export default handleSinglePdfUpload;
