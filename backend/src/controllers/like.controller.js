import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { existsSync } from "fs"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    if(!videoId){
        throw new ApiError(400, "Video id not found")
    }

    const existingVideoLike = await Like.findOne ({
        video : videoId,
        likedBy : req.user._id
    })

    if(existingVideoLike){
        // await Like.findByIdAndDelete(videoId) -> you have to delete the like document
        await Like.findByIdAndDelete(existingVideoLike._id)
        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {liked : false},
//                 Frontend uses liked: true/false to:
// update like button color
// update like count display
// toggle button state
                "video disliked successfully"
            )
        )
    }
    else{
        await Like.create({
            likedBy : req.user._id,
            video : videoId
        })

        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {liked : true}, 
                "video liked successfully"
            )
        )
    }
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    if(!commentId){
        throw new ApiError(400, "Comment Id not found")
    }

    const existingCommentLike = await Like.findOne({
        likedBy : req.user._id,
        comment : commentId
    })

    if(existingCommentLike){
        await Like.findByIdAndDelete(existingCommentLike._id)
        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {liked : false}, 
                "commend disliked successfully"
            )
        )
    }
    else {
        await Like.create({
            likedBy : req.user._id,
            comment : commentId
        })
        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {liked : true}, 
                "commend liked successfully"
            )
        )
    }

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    if(!tweetId){
        throw new ApiError(400, "tweet id not found")
    }

    const existingTweetLike = await Like.findOne({
        likedBy : req.user._id,
        tweet : tweetId
    })

    if(existingTweetLike){
        await Like.findByIdAndDelete(existingTweetLike._id)
        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {liked : false}, 
                "tweet disliked successfully"
            )
        )
    }
    else {
        await Like.create({
            likedBy : req.user._id,
            tweet : tweetId
        })
        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {liked : true}, 
                "tweet liked successfully"
            ) 
        )
    }
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    const likedVideos = await Like.aggregate([
        {
            $match : {
                likedBy : new mongoose.Types.ObjectId(req.user._id),
                video : {
                    $exists : true,
                    $ne : null
//                     $exists: true → field exists on document
//                      $ne: null → field is not null
                }
            }
        },
        { // aggregate on like collection
            $lookup : {
                from : "videos",
                localField : "video",
                foreignField : "_id",
                as : "videoDetails",
                pipeline : [
                    {
                        $project : {
                            videoFile : 1,
                            thumbnail : 1,
                            title : 1,
                            description : 1,
                            duration : 1,
                            views : 1,
                            isPublished : 1,
                            owner : 1, // need for second lookup to work 
                        }
                    }
                ]
            }
        },
        {
            $match : {
                "videoDetails.isPublished" : true
            }
        },
        {
            $lookup : {
                from : "users",
                localField : "videoDetails.owner",
                foreignField : "_id",
                as : "ownerDetails",
                pipeline : [
                    {
                        $project : {
                            username : 1,
                            avatar : 1,
                        }
                    }
                ]
            }
        },
        {
            $addFields : {
                ownerDetails :{
                    $first : "ownerDetails"
                },
                videoDetials  : {
                    $first : "videoDetials"
                }
            }
        },
        {
            $project : {
                thumbnail : "$videosDetails.thumbnail",
                title : "$videoDetials.title",
                duration : "$videoDetials.duration",
                videoFile : "$videoDetials.videoFile",
                views : "$videoDetials.views",
                description : "$videoDetials.description"   ,

                owner : {
                    username : "$ownerDetails.username",
                    avatar : "ownerDetails.avatar"
                }
            }
        }
    ])
    // if(!likedVideos){
    //     throw new ApiError(400, "Liked Video not found")
    // }

    return res
    .status(200)
    .json (
        new ApiResponse (
            200,
            likedVideos,
            "liked videos fetched successfully"
        )
    )
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}