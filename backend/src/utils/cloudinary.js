import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Ensure environment variables are loaded even if imported before index.js
dotenv.config({ path: "./.env" });

const ensureCloudinaryConfig = () => {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
};

// Initial config
ensureCloudinaryConfig();

const uploadOnCloudinary = async (localFilePath, customResourceType = null) => {
    try {
        if (!localFilePath) {
            console.warn("Cloudinary upload: No local file path provided");
            return null;
        }

        const normalizedPath = path.resolve(localFilePath);
        if (!fs.existsSync(normalizedPath)) {
            console.error("Local file does not exist at path:", normalizedPath);
            return null;
        }

        // Re-ensure config in case env was loaded after initial import
        ensureCloudinaryConfig();

        // Determine resource type if not explicitly provided
        let resourceType = customResourceType;
        if (!resourceType) {
            const isVideo = /\.(mp4|mkv|mov|avi|webm|flv|wmv|m4v)$/i.test(normalizedPath);
            resourceType = isVideo ? "video" : "auto";
        }

        console.log(`Uploading to Cloudinary [type: ${resourceType}]:`, normalizedPath);

        const options = {
            resource_type: resourceType,
            timeout: 180000, // 3 minutes timeout prevents socket hanging
        };

        if (resourceType === "video") {
            options.eager_async = true;
        }

        const response = await cloudinary.uploader.upload(normalizedPath, options);

        console.log("Cloudinary upload successful:", response.secure_url || response.url);

        if (fs.existsSync(normalizedPath)) {
            try {
                fs.unlinkSync(normalizedPath);
            } catch (unlinkErr) {
                console.warn("Failed to delete temp file post-upload:", unlinkErr.message);
            }
        }

        return response;

    } catch (error) {
        console.error("========== CLOUDINARY UPLOAD ERROR DETAILS ==========");
        console.error("Error Message:", error.message);
        console.error("Error Name:", error.name);
        console.error("HTTP Code:", error.http_code);
        console.error("Cloud Name configured:", process.env.CLOUDINARY_CLOUD_NAME ? "PRESENT" : "MISSING");
        console.error("API Key configured:", process.env.CLOUDINARY_API_KEY ? "PRESENT" : "MISSING");
        console.error("Full Error:", error);
        console.error("=====================================================");

        if (localFilePath && fs.existsSync(localFilePath)) {
            try {
                fs.unlinkSync(localFilePath);
            } catch (unlinkErr) {
                console.warn("Failed to delete temp file on error:", unlinkErr.message);
            }
        }

        return null;
    }
};

export { uploadOnCloudinary };