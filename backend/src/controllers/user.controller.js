import fs from "fs";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

// ======================================================
// Helper Utilities
// ======================================================

const removeLocalFile = (filePath) => {
    if (filePath && fs.existsSync(filePath)) {
        try {
            fs.unlinkSync(filePath);
        } catch (error) {
            console.error("Failed to delete local temp file:", filePath, error?.message);
        }
    }
};

const getCookieOptions = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/"
});

// ======================================================
// Generate Access Token + Refresh Token
// ======================================================

const generateAccessTokenAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);

        if (!user) {
            throw new ApiError(404, "User not found");
        }

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;

        await user.save({
            validateBeforeSave: false
        });

        return {
            accessToken,
            refreshToken
        };

    } catch (error) {
        throw new ApiError(
            500,
            "Something went wrong while generating refresh and access token"
        );
    }
};


// ======================================================
// Register User
// ======================================================

const registerUser = asyncHandler(async (req, res) => {

    // 1. Get user details from frontend
    const {
        fullName,
        email,
        username,
        password
    } = req.body;

    // 2. Identify local file paths
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    let coverImageLocalPath;

    if (
        req.files &&
        Array.isArray(req.files.coverImage) &&
        req.files.coverImage.length > 0
    ) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    const cleanupTempFiles = () => {
        removeLocalFile(avatarLocalPath);
        removeLocalFile(coverImageLocalPath);
    };

    // 3. Validate required fields
    if (
        [fullName, email, username, password]
            .some((field) => !field || (typeof field === "string" && field.trim() === ""))
    ) {
        cleanupTempFiles();
        throw new ApiError(400, "All fields are required");
    }

    const cleanFullName = fullName.trim();
    const cleanEmail = email.toLowerCase().trim();
    const cleanUsername = username.toLowerCase().trim();

    // 4. Check if user already exists
    const existedUser = await User.findOne({
        $or: [
            { username: cleanUsername },
            { email: cleanEmail }
        ]
    });

    if (existedUser) {
        cleanupTempFiles();
        throw new ApiError(
            409,
            "User with email or username already exists"
        );
    }

    // Avatar is required
    if (!avatarLocalPath) {
        cleanupTempFiles();
        throw new ApiError(400, "Avatar file is required");
    }

    // 5. Upload images to Cloudinary
    let avatar = null;
    if (avatarLocalPath) {
        try {
            avatar = await uploadOnCloudinary(avatarLocalPath);
        } catch (err) {
            console.error("Cloudinary upload failed for avatar:", err?.message);
        }
    }

    let coverImage = null;
    if (coverImageLocalPath) {
        try {
            coverImage = await uploadOnCloudinary(coverImageLocalPath);
        } catch (err) {
            console.error("Cloudinary upload failed for cover image:", err?.message);
        }
    }

    // Always clean up temp files immediately after upload attempt
    cleanupTempFiles();

    // 6. Resolve avatar and cover image URLs with safe fallback
    let avatarUrl = avatar?.secure_url || avatar?.url;

    if (!avatarUrl) {
        console.warn(
            `⚠️  [Cloudinary Diagnostics] Cloudinary returned null (e.g. HTTP 403 / missing upload permissions). Using initial-based avatar fallback for: ${cleanUsername}`
        );
        avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanFullName || cleanUsername)}`;
    }

    const coverImageUrl = coverImage?.secure_url || coverImage?.url || "";

    // 7. Create user
    const user = await User.create({
        fullName: cleanFullName,
        avatar: avatarUrl,
        coverImage: coverImageUrl,
        email: cleanEmail,
        password: password,
        username: cleanUsername
    });

    // 8. Get created user without password and refresh token
    const createdUser = await User
        .findById(user._id)
        .select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(
            500,
            "Something went wrong while registering the user"
        );
    }

    // 9. Send response
    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                createdUser,
                "User registered successfully"
            )
        );
});


// ======================================================
// Login User
// ======================================================

const loginUser = asyncHandler(async (req, res) => {

    // 1. Get login data
    const {
        email,
        username,
        usernameOrEmail,
        password
    } = req.body;

    // Support usernameOrEmail, email, or username
    const identifier = (usernameOrEmail || email || username || "").toString().trim().toLowerCase();

    // 2. Validate inputs
    if (!identifier) {
        throw new ApiError(
            400,
            "Username or email is required"
        );
    }

    if (!password) {
        throw new ApiError(
            400,
            "Password is required"
        );
    }

    // 3. Find user by email OR username
    const user = await User.findOne({
        $or: [
            { email: identifier },
            { username: identifier }
        ]
    });

    if (!user) {
        throw new ApiError(
            404,
            "User does not exist"
        );
    }

    // 4. Check password
    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(
            401,
            "Invalid user credentials"
        );
    }

    // 5. Generate tokens
    const {
        accessToken,
        refreshToken
    } = await generateAccessTokenAndRefreshToken(
        user._id
    );

    // 6. Get logged-in user without sensitive fields
    const loggedInUser = await User
        .findById(user._id)
        .select("-password -refreshToken");

    // 7. Cookie options
    const options = getCookieOptions();

    // 8. Send response with tokens in cookies AND body
    return res
        .status(200)
        .cookie(
            "accessToken",
            accessToken,
            options
        )
        .cookie(
            "refreshToken",
            refreshToken,
            options
        )
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken
                },
                "User logged in successfully"
            )
        );
});


// ======================================================
// Logout User
// ======================================================

const logoutUser = asyncHandler(async (req, res) => {

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        }
    );

    const options = getCookieOptions();

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(
                200,
                {},
                "User logged out"
            )
        );
});


// ======================================================
// Refresh Access Token
// ======================================================

const refreshAccessToken = asyncHandler(async (req, res) => {

    const incomingRefreshToken =
        req.cookies?.refreshToken ||
        req.body?.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(
            401,
            "Unauthorized request"
        );
    }

    try {

        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        const user = await User.findById(
            decodedToken?._id
        );

        if (!user) {
            throw new ApiError(
                401,
                "Invalid refresh token"
            );
        }

        if (
            incomingRefreshToken !==
            user.refreshToken
        ) {
            throw new ApiError(
                401,
                "Refresh token is expired or used"
            );
        }

        // Generate new tokens
        const {
            accessToken,
            refreshToken
        } = await generateAccessTokenAndRefreshToken(
            user._id
        );

        const options = getCookieOptions();

        return res
            .status(200)
            .cookie(
                "accessToken",
                accessToken,
                options
            )
            .cookie(
                "refreshToken",
                refreshToken,
                options
            )
            .json(
                new ApiResponse(
                    200,
                    {
                        accessToken,
                        refreshToken
                    },
                    "Access token refreshed"
                )
            );

    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }

        if (
            ["JsonWebTokenError", "TokenExpiredError", "NotBeforeError"].includes(
                error?.name
            ) && error.message !== "secret or public key must be provided"
        ) {
            throw new ApiError(
                401,
                error.message || "Invalid refresh token"
            );
        }

        throw new ApiError(
            500,
            "Something went wrong while refreshing access token"
        );
    }
});


// ======================================================
// Change Current Password
// ======================================================

const changeCurrentPassword = asyncHandler(
    async (req, res) => {

        const {
            oldPassword,
            newPassword
        } = req.body;


        const user = await User.findById(
            req.user?._id
        );


        if (!user) {
            throw new ApiError(
                404,
                "User not found"
            );
        }


        const isPasswordCorrect =
            await user.isPasswordCorrect(
                oldPassword
            );


        if (!isPasswordCorrect) {
            throw new ApiError(
                400,
                "Invalid old password"
            );
        }


        user.password = newPassword;

        await user.save({
            validateBeforeSave: false
        });


        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    {},
                    "Password changed successfully"
                )
            );
    }
);


// ======================================================
// Get Current User
// ======================================================

const getCurrentUser = asyncHandler(
    async (req, res) => {

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    req.user,
                    "Current user fetched successfully"
                )
            );
    }
);


// ======================================================
// Update Account Details
// ======================================================

const updateAccountDetails = asyncHandler(
    async (req, res) => {

        const {
            fullName,
            email
        } = req.body;


        if (!fullName || !email) {
            throw new ApiError(
                400,
                "All fields are required"
            );
        }


        const user = await User
            .findByIdAndUpdate(
                req.user?._id,
                {
                    $set: {
                        fullName,
                        email: email.toLowerCase()
                    }
                },
                {
                    new: true
                }
            )
            .select("-password -refreshToken");


        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    user,
                    "Account details updated successfully"
                )
            );
    }
);


// ======================================================
// Update User Avatar
// ======================================================

const updateUserAvatar = asyncHandler(
    async (req, res) => {

        const avatarLocalPath =
            req.file?.path;


        if (!avatarLocalPath) {
            throw new ApiError(
                400,
                "Avatar file is missing"
            );
        }


        const avatar =
            await uploadOnCloudinary(
                avatarLocalPath
            );


        let avatarUrl = avatar?.secure_url || avatar?.url;

        if (!avatarUrl) {
            console.warn("Cloudinary avatar update returned null. Using fallback avatar URL.");
            avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(req.user?.fullName || req.user?.username || "user")}`;
        }

        const user = await User
            .findByIdAndUpdate(
                req.user?._id,
                {
                    $set: {
                        avatar: avatarUrl
                    }
                },
                {
                    new: true
                }
            )
            .select("-password -refreshToken");


        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    user,
                    "Avatar updated successfully"
                )
            );
    }
);


// ======================================================
// Update User Cover Image
// ======================================================

const updateUserCoverImage = asyncHandler(
    async (req, res) => {

        const coverImageLocalPath =
            req.file?.path;


        if (!coverImageLocalPath) {
            throw new ApiError(
                400,
                "Cover image file is missing"
            );
        }


        const coverImage =
            await uploadOnCloudinary(
                coverImageLocalPath
            );


        let coverImageUrl = coverImage?.secure_url || coverImage?.url || "";

        const user = await User
            .findByIdAndUpdate(
                req.user?._id,
                {
                    $set: {
                        coverImage: coverImageUrl
                    }
                },
                {
                    new: true
                }
            )
            .select("-password -refreshToken");


        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    user,
                    "Cover image updated successfully"
                )
            );
    }
);


// ======================================================
// Get User Channel Profile
// ======================================================

const getUserChannelProfile = asyncHandler(
    async (req, res) => {

        const {
            username
        } = req.params;


        if (!username?.trim()) {
            throw new ApiError(
                400,
                "Username is missing"
            );
        }


        const channel = await User.aggregate([

            {
                $match: {
                    username: username.toLowerCase()
                }
            },

            {
                $lookup: {
                    from: "subscriptions",
                    localField: "_id",
                    foreignField: "channel",
                    as: "subscribers"
                }
            },

            {
                $lookup: {
                    from: "subscriptions",
                    localField: "_id",
                    foreignField: "subscriber",
                    as: "subscribedTo"
                }
            },

            {
                $addFields: {

                    subscribersCount: {
                        $size: "$subscribers"
                    },

                    channelsSubscribedToCount: {
                        $size: "$subscribedTo"
                    },

                    isSubscribed: {
                        $cond: {
                            if: {
                                $in: [
                                    req.user?._id,
                                    "$subscribers.subscriber"
                                ]
                            },
                            then: true,
                            else: false
                        }
                    }
                }
            },

            {
                $project: {
                    fullName: 1,
                    username: 1,
                    subscribersCount: 1,
                    channelsSubscribedToCount: 1,
                    isSubscribed: 1,
                    avatar: 1,
                    coverImage: 1,
                    email: 1
                }
            }
        ]);


        if (!channel?.length) {
            throw new ApiError(
                404,
                "Channel does not exist"
            );
        }


        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    channel[0],
                    "User channel fetched successfully"
                )
            );
    }
);


// ======================================================
// Get Watch History
// ======================================================

const getWatchHistory = asyncHandler(
    async (req, res) => {

        const user = await User.aggregate([

            {
                $match: {
                    _id: new mongoose.Types.ObjectId(
                        req.user._id
                    )
                }
            },

            {
                $lookup: {
                    from: "videos",

                    localField: "watchHistory",

                    foreignField: "_id",

                    as: "watchHistory",

                    pipeline: [

                        {
                            $lookup: {
                                from: "users",

                                localField: "owner",

                                foreignField: "_id",

                                as: "owner",

                                pipeline: [

                                    {
                                        $project: {
                                            fullName: 1,
                                            username: 1,
                                            avatar: 1
                                        }
                                    }
                                ]
                            }
                        },

                        {
                            $addFields: {
                                owner: {
                                    $first: "$owner"
                                }
                            }
                        }
                    ]
                }
            }
        ]);


        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    user[0]?.watchHistory || [],
                    "Watch history fetched successfully"
                )
            );
    }
);


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
};