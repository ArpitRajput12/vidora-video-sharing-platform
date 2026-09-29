import fs from "fs";
import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query

    const pipeline = []

    // text search on title/description with regex
    if (query && query.trim() !== "") {
        const cleanQuery = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        pipeline.push({
            $match: {
                $or: [
                    { title: { $regex: cleanQuery, $options: "i" } },
                    { description: { $regex: cleanQuery, $options: "i" } }
                ]
            }
        })
    }

    // filter by owner
    if (userId) {
        if (!isValidObjectId(userId)) {
            throw new ApiError(400, "Invalid user id")
        }
        pipeline.push({
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        })
    }

    // Ensure only published videos are returned for public searches.
    // If a creator is querying their own videos by userId, do not filter out drafts.
    const isOwnerQuery = req.user?._id && userId && req.user._id.toString() === userId.toString();
    if (!isOwnerQuery) {
        pipeline.push({
            $match: { isPublished: true }
        })
    }

    // sorting
    if (sortBy) {
        pipeline.push({
            $sort: {
                [sortBy]: sortType === "asc" ? 1 : -1
            }
        })
    } else {
        pipeline.push({ $sort: { createdAt: -1 } })
    }

    // join owner details
    pipeline.push(
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                owner: { $first: "$owner" }
            }
        }
    )

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    }

    const videos = await Video.aggregatePaginate(
        Video.aggregate(pipeline),
        options
    )

    return res
        .status(200)
        .json(new ApiResponse(200, videos, "Videos fetched successfully"))
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;

    const videoFileLocalPath = req.files?.videoFile?.[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

    const cleanupTemp = () => {
        if (videoFileLocalPath && fs.existsSync(videoFileLocalPath)) {
            try { fs.unlinkSync(videoFileLocalPath); } catch (e) {}
        }
        if (thumbnailLocalPath && fs.existsSync(thumbnailLocalPath)) {
            try { fs.unlinkSync(thumbnailLocalPath); } catch (e) {}
        }
    };

    if (!title || !title.trim()) {
        cleanupTemp();
        throw new ApiError(400, "Title is required");
    }

    if (!description || !description.trim()) {
        cleanupTemp();
        throw new ApiError(400, "Description is required");
    }

    if (!videoFileLocalPath) {
        cleanupTemp();
        throw new ApiError(400, "Video file is required");
    }

    if (!thumbnailLocalPath) {
        cleanupTemp();
        throw new ApiError(400, "Thumbnail is required");
    }

    console.log("Publishing video: starting parallel upload of video and thumbnail to Cloudinary...");
    const [videoFile, thumbnail] = await Promise.all([
        uploadOnCloudinary(videoFileLocalPath, "video"),
        uploadOnCloudinary(thumbnailLocalPath, "image")
    ]);

    cleanupTemp();

    if (!videoFile || (!videoFile.secure_url && !videoFile.url)) {
        throw new ApiError(500, "Failed to upload video file to cloud storage. Please ensure the video format is supported.");
    }

    if (!thumbnail || (!thumbnail.secure_url && !thumbnail.url)) {
        throw new ApiError(500, "Failed to upload thumbnail to cloud storage.");
    }

    const video = await Video.create({
        videoFile: videoFile.secure_url || videoFile.url,
        thumbnail: thumbnail.secure_url || thumbnail.url,
        title: title.trim(),
        description: description.trim(),
        duration: Number(videoFile.duration) || 0,
        owner: req.user?._id
    });

    const createdVideo = await Video.findById(video._id);

    if (!createdVideo) {
        throw new ApiError(500, "Something went wrong while publishing the video");
    }

    return res
        .status(201)
        .json(new ApiResponse(201, createdVideo, "Video published successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }

    const video = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                owner: { $first: "$owner" }
            }
        }
    ])

    if (!video.length) {
        throw new ApiError(404, "Video not found")
    }

    await Video.findByIdAndUpdate(videoId, {
        $inc: { views: 1 }
    })

    return res
        .status(200)
        .json(new ApiResponse(200, video[0], "Video fetched successfully"))
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { title, description } = req.body

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    if (video.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You are not allowed to update this video")
    }

    const updateFields = {}
    if (title && title.trim()) updateFields.title = title
    if (description && description.trim()) updateFields.description = description

    const thumbnailLocalPath = req.file?.path
    if (thumbnailLocalPath) {
        const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
        if (!thumbnail) {
            throw new ApiError(500, "Failed to upload thumbnail")
        }
        updateFields.thumbnail = thumbnail.url
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        { $set: updateFields },
        { new: true }
    )

    return res
        .status(200)
        .json(new ApiResponse(200, updatedVideo, "Video updated successfully"))
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    if (video.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You are not allowed to delete this video")
    }

    await Video.findByIdAndDelete(videoId)

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Video deleted successfully"))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    if (video.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You are not allowed to modify this video")
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        { $set: { isPublished: !video.isPublished } },
        { new: true }
    )

    return res
        .status(200)
        .json(new ApiResponse(200, updatedVideo, "Publish status toggled successfully"))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}