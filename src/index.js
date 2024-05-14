import { app } from "./app.js";
import dbConnect from "../src/db/index.js";
import dotenv  from "dotenv";

dbConnect()

dotenv.config({
    path: "./.env",
})

try{
    app.listen(process.env.PORT | 8000, () => {
        console.log(`Server is running on port ${process.env.PORT}`)
    })
}catch(err){
console.error(err);
}

