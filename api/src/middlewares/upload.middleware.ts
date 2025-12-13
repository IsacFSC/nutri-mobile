import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

// Garantir que pasta de uploads existe
const uploadDir = path.join(__dirname, '../../uploads/avatars');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuração de armazenamento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Gerar nome único: userId-timestamp-random.ext
    const userId = (req as any).userId || 'unknown';
    const ext = path.extname(file.originalname);
    const randomString = crypto.randomBytes(8).toString('hex');
    const filename = `${userId}-${Date.now()}-${randomString}${ext}`;
    cb(null, filename);
  }
});

// Filtro de arquivos
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Formato de arquivo inválido. Use JPG, PNG ou WEBP'));
  }
};

// Configuração do multer
export const uploadAvatar = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: fileFilter
});

// Middleware para upload de múltiplas fotos (progresso do paciente)
const progressPhotosDir = path.join(__dirname, '../../uploads/progress');
if (!fs.existsSync(progressPhotosDir)) {
  fs.mkdirSync(progressPhotosDir, { recursive: true });
}

const progressStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, progressPhotosDir);
  },
  filename: (req, file, cb) => {
    const userId = (req as any).userId || 'unknown';
    const ext = path.extname(file.originalname);
    const randomString = crypto.randomBytes(8).toString('hex');
    const filename = `progress-${userId}-${Date.now()}-${randomString}${ext}`;
    cb(null, filename);
  }
});

export const uploadProgressPhotos = multer({
  storage: progressStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB por foto
    files: 10 // Máximo 10 fotos por vez
  },
  fileFilter: fileFilter
});
