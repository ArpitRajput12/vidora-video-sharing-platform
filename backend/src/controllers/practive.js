import { asyncHandler } from "../utils/asyncHandler";
import { uploadOnCloudinary } from "../utils/cloudinary";
import { User } from "../models/user.model";
import { ApiError } from "../utils/ApiError";
import { use } from "react";
import { ApiResponse } from "../utils/ApiResponse";

const changePassword = asyncHandler(async(req , res)=>{
    const { oldpassword, newpassword } = req.user
    const user = await User.fineById(req.user._id);
    if(!user){
        throw new ApiError(400, "user not found")
    }
    const isPasswordCorrect = User.isPasswordCorrect(oldpassword)
    if(!isPasswordCorrect){
        throw new ApiError(400, "old password is incorrect")
    }
    user.password = newpassword;
    
})