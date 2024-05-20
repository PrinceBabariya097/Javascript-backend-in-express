import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../modules/user.model.js";
import { uploadOnClodinary } from "../utils/Cloudinary.js";
import { ApiResponce } from "../utils/ApiResponce.js";
import jwt from "jsonwebtoken";

const generateAccessTokenAndRefreshToken = async (userid) => {
  try {
    const user = await User.findById(userid);

    const accessToken = user.generaeteAccessToken();
    const refreshToken = user.generateRefreshToken();
    // console.log('accessToken',accessToken,'-------','refreshToken',refreshToken);

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    console.log(error);
    throw new ApiError(500, "somethind went wrong");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { username, password, email, fullname } = req.body;

  if (
    [username, password, email, fullname].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All field are required");
  }

  //   console.log(req.body, "body of request"); = show the text send by the body

  const usernameExist = await User.findOne({ username });
  const emailExist = await User.findOne({ email });

  //   console.log(`username${usernameExist}email${emailExist}`); if not in DB than null

  if (usernameExist) {
    throw new ApiError(409, "username is alread exist");
  } else if (emailExist) {
    throw new ApiError(409, "email is already exist");
  }

  const avatarLocalPath = req.files?.avtar[0]?.path;
  let coverImageLocalPath;

  //   console.log(req.files,'files uploaded by user by postman'); show objects of files send by the user

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  //   console.log(avatarLocalPath, "avatarLocalPath"); show localpath(path of image stored in your device)

  if (req.files.coverImage && req.files.coverImage[0].path) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  //   console.log(coverImageLocalPath, "coverImageLocalPath"); same as avtar localpath

  const avatar = await uploadOnClodinary(avatarLocalPath);
  const coverImage = await uploadOnClodinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  //   console.log(avatar, "avatar"); show object of image stored in clodinary
  //   console.log(coverImage, "coverImage");

  const user = await User.create({
    username: username.toLowerCase(),
    email,
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    password,
  });

  //   console.log(user, "user"); show document in mongo DB

  const userRegistered = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  //   console.log(userRegistered, "userRegistered"); give the document from mongoDb by given id

  if (!userRegistered) {
    throw new ApiError(500, "something wend wrong while registerning the user");
  }

  // we cannot send two header to respons or same header status

  return res
    .status(200)
    .json(new ApiResponce(201, userRegistered, "user registered successfully"));
});

const logInUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  console.log(req.body);
  if (!username && !email) {
    throw new ApiError(400, "username or email is required for log in");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  // console.log(user)

  if (!user) {
    throw new ApiError(500, "user is not found");
  }

  const isVelid = await user.isPasswordCorrect(password);

  // console.log(isVelid);

  if (!isVelid) {
    throw new ApiError(400, "write valid password");
  }

  const { accessToken, refreshToken } =
    await generateAccessTokenAndRefreshToken(user._id);

  const loggedUSer = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const option = {
    httpOnly: true,
    secure: true,
  };

  return res
    .cookie("accessToken", accessToken, option)
    .cookie("refreshToken", refreshToken, option)
    .status(200)
    .json(
      new ApiResponce(
        200,
        { user: loggedUSer, accessToken, refreshToken },
        "user registered successfully"
      )
    );
});

const logOutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user_id,
    {
      $unset: { accessToken: 1 },
    },
    {
      new: true,
    }
  );

  const option = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", option)
    .clearCookie("refreshToken", option)
    .json(new ApiResponce(200, {}, "User Looged out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    const incomingToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingToken) {
      throw new ApiError(401, "unAuthorozied Access");
    }

    const decodeToken = jwt.verify(
      incomingToken,
      process.env.ACCESS_TOKEN_SECRET
    );

    const user = await User.findById(decodeToken?._id);

    if (!user) {
      throw new ApiError(401, "you have not valid token");
    }

    if (incomingToken !== user?.refreshToken) {
      throw new ApiError(402, "your access is denied because of invalid token");
    }

    const { accessToken, newRefreshToken } =
      await generateAccessTokenAndRefreshToken(user._id);

    const option = {
      httpOnly: true,
      secure: true,
    };

    return res
      .cookie("accessToken", accessToken, option)
      .cookie("refreshToken", newRefreshToken, option)
      .status(200)
      .json(
        new ApiResponce(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "generated new accessToken successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const changeCurrentUserPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id);

  const isPAsswordValid = await user.isPasswordCorrect(oldPassword);

  if (!isPAsswordValid) {
    throw new ApiError(400, "your password is not valid");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res.status(200).json(new ApiResponce(200, {}, "password is updated successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const user = req.user
  return res.status(200).json( new ApiResponce(200, user, "user data is fatched successfully"));
});

const chengeUserData = asyncHandler( async (req, res) => {
  const { fullName, email } = req.body;

  if (!fullName && !email){
    throw new ApiError(400, "fullName and email are required");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        fullName,
        email
      }
    },
    {
      new: true,
    }
  ).select('-password')

  return res
  .status(200)
  .json(new ApiResponce(200, user, "userData is updated successfulyy"))
})

const updateAvtarImage = asyncHandler( async (req, res) => {
  const avtarLocalPAth = req.file?.path

  if (!avtarLocalPAth) {
    throw new ApiError(400, 'avtar is required')
  }


  const avtar = await uploadOnClodinary(avtarLocalPAth)

  
  if (!avtar) {
    throw new ApiError(401, 'Error is acurred while uploading your avtar')
  }

  const user = User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        avatar: avtar?.url
      },
    },
    {new:true}
  ).select('-password')

  return res
  .status(200)
  .json( new ApiResponce(200, user, 'your avtar is updated succesfully'))
})

const updateCoverImage = asyncHandler( async (req, res) => {
  const coverImagePAth = req.file?.path

  if (!coverImagePAth) {
    throw new ApiError(400, 'coverImage is required')
  }


  const coverImage = await uploadOnClodinary(coverImagePAth)

  
  if (!coverImage) {
    throw new ApiError(401, 'Error is acurred while uploading your coverImage')
  }

  const user = User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        coverImage: coverImage?.url
      },
    },
    {new:true}
  ).select('-password')

  return res
  .status(200)
  .json( new ApiResponce(200, user, 'your coverImage is updated succesfully'))
})

export {
  registerUser,
  logInUser,
  logOutUser,
  refreshAccessToken,
  getCurrentUser,
  changeCurrentUserPassword,
  chengeUserData,
  updateAvtarImage,
  updateCoverImage
};
