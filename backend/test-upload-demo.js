import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config({ path: "./.env" });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function runTest() {
  console.log("Checking Cloudinary credentials...");
  console.log("Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME);
  console.log("API Key length:", process.env.CLOUDINARY_API_KEY?.length);

  // 1. Create a 1MB dummy test video/file
  const demoPath = path.resolve("./public/temp/demo_test.mp4");
  fs.mkdirSync(path.dirname(demoPath), { recursive: true });
  fs.writeFileSync(demoPath, Buffer.alloc(1024 * 1024, "a"));

  console.log("Attempting direct upload of demo file to Cloudinary...");
  try {
    const result = await cloudinary.uploader.upload(demoPath, {
      resource_type: "video",
      timeout: 60000
    });
    console.log("✅ UPLOAD SUCCESSFUL! URL:", result.secure_url);
  } catch (err) {
    console.error("❌ CLOUDINARY DIRECT UPLOAD FAILED:", err);
  } finally {
    if (fs.existsSync(demoPath)) fs.unlinkSync(demoPath);
  }
}

runTest();
