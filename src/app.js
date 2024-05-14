import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
// parse requests of content-type - application/json
app.use(
  express.json({
    limit: "16kb", // Maximum request body size.
  })
);
app.use(
  express.urlencoded({
    extended: true,
    limit: "16kb",
  })
);
app.use(express.static("public"));
app.use(cookieParser());


import userRouter from "./routes/user.routes.js"

app.use("/api/v1/users",userRouter)

export { app };
