import { asyncHandler } from "../utils/asynchHandler.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import z from "zod";
import jwt from "jsonwebtoken";

const registerSchema = z.object({
  fullname: z.string().min(1, "fullname is required"),
  email: z.string().min(1, "email is required"),
  username: z.string().min(1, "username is required"),
  password: z.string().min(1, "password is required"),
});

const loginSchema = z.object({
  email: z.string().min(1, "Email is required"),
  username: z.string().min(1, "username is required"),
  password: z.string().min(1, "Password is required"),
});

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.log(
      "Something Went wrong while generating refresh and access token"
    );
  }
};

const registerUser = async (req, res) => {
  try {
    const { fullname, email, username, password } = req.body;
    const userData = { fullname, email, username, password };
    const reqData = registerSchema.safeParse(userData);

    if (!reqData.success) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const findingExistingUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (findingExistingUser) {
      return res.status(409).json({
        error: "User already exists. Please check email or password.",
      });
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (
      req.files &&
      Array.isArray(req.files.coverImage) &&
      req.files.coverImage.length > 0
    ) {
      coverImageLocalPath = req.files.coverImage[0].path;
    }
    if (!avatarLocalPath) {
      return res.status(400).json({ error: "Avatar file is required" });
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatar) {
      return res.status(400).json({ error: "Avatar file upload failed" });
    }

    const user = await User.create({
      fullname,
      avatar: avatar.url,
      coverImage: coverImage?.url || "",
      username: username.toLowerCase(),
      password,
      email,
    });

    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    if (!createdUser) {
      return res.status(500).json({
        error: "Something went wrong while registering the user",
      });
    }

    return res
      .status(201)
      .json({ message: "User created successfully", createdUser });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const loginUser = async (req, res) => {
  try {
    //getting the data from request ex email and password
    // validate the data that we get from req
    //then we compair the req -> Data from our mongodb data if (true)-> login Access -> (false) -> Login Denied
    //then we generate access and refresh token
    //send cookies access and refresh

    const { username, email, password } = await req.body;
    const userLoginData = { email, password, username };

    if (!(username || !email)) {
      return res.status(500).json({
        error: "Username or email is required",
      });
    }

    const data = loginSchema.safeParse(userLoginData);

    if (!data.success) {
      return res.status(500).json({
        error: "Email and Password is required",
      });
    }

    const user = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (!user) {
      return res.status(404).json({
        error: "User does not exist",
      });
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: "Password Incorrect",
      });
    }

    console.log(user);

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user._id
    );

    const loggedInUser = await User.findById(user._id).select(
      -password - refreshToken
    );

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(201)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json({
        message: "User Logged In Successfully",
        user: {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
      });
  } catch (error) {
    console.log(error);
  }
};

const logoutUser = async (req, res) => {
  try {
    //removie cookies
    //reset refresh token
    const UserLogout = await User.findByIdAndUpdate(req.user._id, {
      $set: { refreshToken: "" },
    });

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json({ message: "Logged Out Successfully", UserLogout });
  } catch (error) {
    console.log(error);
  }
};

const refreshAccessToken = async (req, res) => {
  try {
    const incomingRefreshToken =
      req.cookies?.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
      return res.status(401).json({ error: "Unauthorized Access" });
    }

    const decodeToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodeToken?._id);

    if (!user) {
      return res.status(401).json("User Not Found");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      return res.status(401).json({ error: "Refresh Token is expired", user });
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user._id
    );

    return res
      .status(200)
      .cookie("acccessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json({ accessToken, refreshToken, user });
  } catch (error) {
    console.log(error);
  }
};

export { registerUser, loginUser, logoutUser, refreshAccessToken };
