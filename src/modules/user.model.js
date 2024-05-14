import mongoose,{Schema} from "mongoose";
// import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
import  Jwt  from "jsonwebtoken";
import bcrypt from "bcrypt"

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullname: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    avatar: {
      type: String,
      required: true,
    },
    coverImage: {
      type: String,
    },
    watchHestory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    password: {
      type: String,
      required: [true, "password is required"],
    },
    refreshToken: {
      type: String,
    },
  },
  { timeStamps: true }
);

userSchema.pre("save", async function(next){
  if(!this.isModified("password")) return next()

  this.password = await bcrypt.hash(this.password,10)
  next()
})

userSchema.methods.isPasswordCorrect = async function(password){
 return await bcrypt.compare(password,this.password)
}

userSchema.methods.generaeteAccessToken = function(){
  return Jwt.sign({
    _id:this._id,
    username:this.username,
    email:this.email,
    fullname:this.fullname
  },
  process.env.ACCESS_TOKEN_SECRET,{
    expiresIn:process.env.ACCESS_TOKEN_EXPIRY
  }
  )
}

userSchema.methods.generateRefreshToken = function(){
  return Jwt.sign({
    _id:this._id,
  },
  process.env.REFRESH_TOKEN_SCRET,{
    expiresIn:process.env.REFRESH_TOKEN_EXPIRY
  }
  )
}

export const User = mongoose.model("User", userSchema)
