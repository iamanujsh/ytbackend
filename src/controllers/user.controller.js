import { asyncHandler } from "../utils/asynchHandler.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

import z from "zod";

const userSchema = z.object({
  fullname: z.string().min(1, "fullname is required"),
  email: z.string().min(1, "email is required"),
  username: z.string().min(1, "username is required"),
  password: z.string().min(1, "password is required"),
});

const registerUser = async (req, res) => {
  try {
    //we get the data from req (frontend)
    //validation
    //check if use already exist: username , email
    //check for images -> avatar and cover
    //upload them to cloudinary
    //get the imageUrl from clodinary
    //send the data that we get from req to mongodb
    //remove password and refresh token filed from response
    // check for user creation if true return res

    const { fullname, email, username, password } = req.body;
    const userData = { fullname, email, username, password };
    const reqData = userSchema.safeParse(userData);

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
    const coverImageLocalPath = req.files?.avatar[0]?.path;

    if (!avatarLocalPath) {
      return res.status(409).json({
        error: "Avatar file is required",
      });
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatar) {
      return res.status(409).json({
        error: "Avatar file is required",
      });
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
        error: "Something Went Wrong while registring a user",
      });
    }

    return res
      .status(200)
      .json({ message: "User Created Successfully" }, { createdUser });
  } catch (error) {
    console.log(error);
  }
};

export { registerUser };
