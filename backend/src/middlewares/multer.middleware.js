import multer from "multer";
import fs from "fs";
import path from "path";

const tempDir = "./public/temp";
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        cb(null, tempDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const cleanName = path.basename(file.originalname || "upload").replace(/[^a-zA-Z0-9.-]/g, "_");
        cb(null, `${uniqueSuffix}-${cleanName}`);
    }
});

export const upload = multer({
    storage,
});