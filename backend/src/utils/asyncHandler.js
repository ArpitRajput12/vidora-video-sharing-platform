const asyncHandler = (requestHandler)=>{
   return (req,res, next) =>{
        Promise.resolve(requestHandler(req,res, next)).catch((err) => next(err))
    }
}


export{asyncHandler}



/***** 2- Type

const asyncHandler = () =>{}
const asyncHandler = (fun) => () => {}
const asyncHandler = (fun) => async() => {}

import { json } from "express"

    const asyncHandler = (fn) =>async(req,res,next){
        try {
            await fun(req,res,next)
        } catch (error) {
            res.status(error.code || 500).json({
                success:false,
                message:error.message
            })
            
        }
    }*/