import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    const {content} = req.body;
    if(!content || content.trim() === ""){
        throw new ApiError(400, "content not found")
    }

    // const user = await User.findById(req.User._id) ------ dont fetch the user
    //  you have to create an object in the database
    const tweet = await Tweet.create({
        content : content,
        owner : req.user._id,
    })
    if(!tweet){
        throw new ApiError(500, "Tweet not created")
    }
    return res
    .status(201)
    .json(
        new ApiResponse(
            201,
            {tweet},
            "Tweet created successfully"
        )
    )
})

const getUserTweets = asyncHandler(async (req, res) => {
    const{userId} = req.params
    if(!userId){
        throw new ApiError(400, "User id does not found ")
    }
    // Tweet.find({
    //     owner : "userId"
    // }) 
    const tweets = await Tweet.aggregate([
        {
            $match : {
                // owner : userId, --> wrong
                owner : new mongoose.Types.ObjectId(userId),
            }
        },
        {
            $lookup : {
                from : "users",
                localField : "owner",
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
            $addFields: {
            owner: { 
                $first: "$ownerDetails" 
            }
        }
    }
    ])
    // if(!tweet){
    //     throw new ApiError(401, "Tweet not found")
    // }
    if(!tweets?.length){ // because aggregation returns the array
        throw new ApiError(404,"Tweet Not found")
    }

    return res
    .status(200)
    .json(
       new ApiResponse(
         200,
        tweets,
        "User tweet fetched succussfully"
       )
    )
})

const updateTweet = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    const {newcontent} = req.body
    if(!tweetId){
        throw new ApiError(400, "tweetId is required")
    }
    if(!newcontent || newcontent.trim() !== ""){
        throw new ApiError(400, "Content is required")
    }
    const tweet = await Tweet.findById(tweetId);
    if(!tweet){
        throw new ApiError(404, "tweet not found")
    }
    if(tweet.owner.toString() !== req.user._id.toString()){
        throw new ApiError(404, "unauthorized request")
    }
    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set : {
                content : newcontent,
            }
        },
        {
            new : true
        }
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            updatedTweet,
            "Tweet Updated Sucessfully"
        )
    )
})

const deleteTweet = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    if(!tweetId){
        throw new ApiError(400, "TweetId is required")
    }
    const tweet = await Tweet.findById(tweetId);
    if(!tweet){
        throw new ApiError(404, "Tweet not found")
    }
    // if(!tweet.owner.toString() || req.user._id.toString() === ""){
    //     throw new ApiError(403, "unauthorized request")
    // }
    if(tweet.owner.toString() !== req.user._id){
        throw new ApiError(403, "unauthorized request")
    }
    // await Tweet.findByIdAndDelete(
    //     tweetId,
    //     {}
    // )
    await Tweet.findByIdAndDelete( // takes only one argument
        tweetId 
    )
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "Tweet deleted successfully"
        )
    )

})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}