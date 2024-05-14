import mongoose from "mongoose";
import { DB_NAME } from "../contents.js";

const dbConnect = async () => {
    try{
        const connectionInstence = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`\n Mongo DB server is connected to host ${connectionInstence.connection.host}` );
    }catch(err){
        console.error(err);
    }
}

export default dbConnect