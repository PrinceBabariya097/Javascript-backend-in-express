import { Router } from "express";
import { logInUser, logOutUser, refreshAccessToken, registerUser } from "../controllers/user.controller.js";
import {upload} from "../middelwares/multer.middelware.js"
import verifyJwt from "../middelwares/auth.middelwares.js";

const router = Router()

router.route('/register').post(
    upload.fields([
        {
            name: "avtar",
            maxCount:1
        },
        {
            name: "coverImage",
            maxCount:1
        }
    ]),
    registerUser)

router.route("/login").post(logInUser)

router.route('/logout').post(verifyJwt,logOutUser)

router.route('/refresh-token').post(refreshAccessToken)

export default router