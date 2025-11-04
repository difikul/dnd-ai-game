import multer from 'multer'
import path from 'path'
import { Request } from 'express'
import crypto from 'crypto'

// Storage configuration
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    // Screenshots budou uloženy v backend/uploads/screenshots/
    cb(null, path.join(__dirname, '../../uploads/screenshots'))
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    // Generovat unique filename: timestamp-uuid.ext
    const uniqueSuffix = `${Date.now()}-${crypto.randomUUID()}`
    const ext = path.extname(file.originalname)
    cb(null, `screenshot-${uniqueSuffix}${ext}`)
  }
})

// File filter - pouze obrázky
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Povolené MIME types
  const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg']

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(
      new Error(
        'Nepodporovaný formát souboru. Povolené formáty: PNG, JPG, JPEG'
      )
    )
  }
}

// Multer konfigurace
export const uploadScreenshot = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // Max 5MB
    files: 5 // Max 5 souborů najednou
  }
})

// Middleware pro single file upload
export const uploadSingle = uploadScreenshot.single('screenshot')

// Middleware pro multiple files upload (až 5 souborů)
export const uploadMultiple = uploadScreenshot.array('screenshots', 5)
