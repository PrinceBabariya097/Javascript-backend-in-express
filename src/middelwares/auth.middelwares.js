import  jwt  from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../modules/user.model.js";

const verifyJwt = asyncHandler(async(req,res,next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer", "")

        if (!token) {
            throw new ApiError(401, "Unauthorized request")
        }

        // console.log(token,'------------------------------------------------','token');

        const decodeToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)

        // console.log(decodeToken,'------------------------------------------------','decodeToken');

        const user = User.findOne(decodeToken._id)?.select("-password -refreshToken")
        
        if (!user) {
            
            throw new ApiError(401, "Invalid Access Token")
        }

        req.user = user
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || 'invelid access token')
    }
})

export default verifyJwt