import "dotenv/config";
import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
    path: "./.env"
});

connectDB()
// app are listen the db 
.then(() => {
    // app.on("error", (error) =>{
    //     console.log("ERROR:",error);
    //     throw error
    // })
    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is running at port : ${process.env.PORT}`);
    })
})
.catch((err) => {
    console.log("MONGO DB connection FAILED !!",err)
})







/*
import mongose from "mongose"
import {DB_NAME} from "./constants";
import express from"express"
const app = express()

(async() => {
    try {
        await mongose.connect(`${process.env.MONGODB_URL}/${BD_NAME}`)
        app.on("error",(error) => {
            console.log("ERROR:", error);
        })

        app.listen(process.env.PORT, () => {
            console.log(`App is listening on port ${process.env.PORT}`)
        })
        
    } catch (error) {
        console.error("ERROR:", error)
        throw err
    }
})()
    */