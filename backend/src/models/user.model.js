import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
const userSchema = new Schema({
    username : {
        type : String,
        required : true,
        unique : true,
        lowercase : true,
        trim : true,
        index : true, //searching field enable
    },
    email : {
        type : String,
        required : true,
        unique : true,
        lowercase : true,
        trim : true,   
    },
    fullName : {
        type : String,
        required : true,
        trim : true,  
        index : true, 
    },
    avatar : {
        type : String, //cloudinary url
        required : true,      
    },
    coverImage : {
        type : String, //cloudinary url
    },
    watchHistory : [
        {
            type : Schema.Types.ObjectId,
            ref : "Video"
        }
    ],
    password : {
        type : String,
        required : [true, '[Pass is required]']
    },
    refreshToken : {
        type : String
    }

},{
    timestamps : true
})

userSchema.pre("save", async function (next){
    if(!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10)
    next()
})


// userSchema.methods --- used to define instance methods
userSchema.methods.isPasswordCorrect = async function (password){
    return await bcrypt.compare(password, //clean password
         this.password // hashed pass from db
    )
}
// equivalent code of above
// userSchema.methods = {
//     isPasswordCorrect : function(password){
//         return bcrypt.compare(password, this.password);
//     }
// }
 
// already in database
userSchema.methods.generateAccessToken = function (){
    // jwt.sign(payload, secret, options(define token lifetime))
    return jwt.sign(
        {
            _id : this._id,
            email : this.email,
            username : this.username,
            fullName : this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn : process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken = function (){
     return jwt.sign(
        {
            _id : this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn : process.env.REFRESH_TOKEN_EXPIRY 
        }
    )
} 


export const User = mongoose.model("User", userSchema)

// jwt is like key i.e bearer token, jo bejhega usko data mil jaega