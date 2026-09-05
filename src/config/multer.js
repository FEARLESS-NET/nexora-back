import multer from "multer";

// ==========================================
// MEMORY STORAGE
// ==========================================
// Rasm diskka yozilmaydi.
// Rasm RAM ichida buffer sifatida turadi.
// Keyin controller uni ImgBB'ga yuboradi.
// ==========================================

const storage = multer.memoryStorage();

// ==========================================
// FILE FILTER
// ==========================================

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"), false);
  }
};

// ==========================================
// MULTER
// ==========================================

const upload = multer({
  storage,

  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },

  fileFilter,
});

export default upload;