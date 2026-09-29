import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


// Plain english:
// "If I'm already subscribed → unsubscribe
//  If I'm not subscribed → subscribe"
// One button. Two behaviors. Depends on current state
const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    if(!channelId){
        throw new ApiError(400, "ChannelId is required")
    }
    // self subscription check
    if(channelId === req.user._id.toString()){
        throw new ApiError( 400, "You cannot subscribe to yourself")
    }
    const existingSubscription = await Subscription.findOne({
        subscriber : req.user._id,
        channel : channelId
    })
    if(existingSubscription){
        await Subscription.findByIdAndDelete(existingSubscription._id)
        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {subscribed : false},
                "unsubscribed successfully"
            )
        )
    }else{
        await Subscription.create({
            subscriber : req.user._id,
            channel : channelId
        })
        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {subscribed : true},
                "subscribed successfully"
            )
        )
    }
})

// controller to return subscriber list of a channel
// As a Channel Owner
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    if(!channelId){
        throw new ApiError(400, "Channel Id is required")
    }
    const subscribers = await Subscription.aggregate([
        {
            $match : {
                channel : new mongoose.Types.ObjectId(channelId)
                // channel : channelId ---> wrong cause channelId is plain string from req.params
            }
        },
        {
            $lookup : {
                from : "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriberDetails",
                pipeline : [
                    {
                        $project : {
                            username : 1,
                            avatar : 1,
                            coverImage : 1,
                            // isSubscribed : 1 // ← this field doesn't exist on User, it computed later imn $addFields 
                        }
                    }
                ]
            }
        },
        {
            $addFields : {
                subscriberDetials : {
                    $first : "$subscriberDetails"
                },
                isSubscribed : {
                    $cond : {
                        if : {
                            $in : [
                                req.user?._id,
                                "$subscriberDetails.subscriber"
                            ]
                        },
                        then : true,
                        else : false
                    }
                }
            }
        },
        {
            $project : {
                username : "$subscriberDetails.username",
                avatar : "$subscriberDetails.avatar",
                coverImage : "$subscriberDetails.coverImage",
                isSubscribed : 1
            }
        }
    ])

    // if(!subscribers?.length){
    //     throw new ApiError(404, "No subscribers found")
    // }
    // Option 1 — treat as error
    // Option 2 — treat as valid, return empty array
// don't throw, just return
// frontend receives [] and handles it
    return res
    .status(200)
    .json(
        new ApiResponse(
            200, 
            subscribers,
            "Subscribers fetched successfully"
        )
    )
})
 
// controller to return channel list to which user has subscribed
// As a Viewer (Subscriber), we who they follow 
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    if(!subscriberId){
        throw new ApiError( 400, "Subscriber Id is required")
    }

    const channels = await Subscription.aggregate([
        {
            $match : {
               subscriber : new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup : {
                from : "users",
                localField : "channel",
                foreignField : "_id",
                as : "channelDetails",
                pipeline : [
                    {
                        $project : {
                            username : 1,
                            avatar : 1,
                            coverImage : 1
                        }
                    }
                ]
            }
        },{
            $addFields : {
                channelDetails : {
                    $first : "$channelDetails"
                },
                isSubscribed : true
            }
        },
        {
            $project : {
                username : "channelDetails.username",
                avatar : "channelDetails.avatar", 
                coverImage : "channelDetails.coverImage",
                isSubscribed : 1
            }
        }
    ])
    return res
    .status(200)
    .json(
        new ApiResponse (
            200, 
            channels,
            "Channel Fetched Successfully"
        )
    )
})


export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}