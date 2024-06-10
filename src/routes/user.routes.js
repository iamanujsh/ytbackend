import { Router } from "express";
import {
  changeCurrentPassword,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  updateAccountDetails,
  updateUserAvatar,
} from "../controllers/user.controller.js";
import { upload } from "../middleware/multer.middleware.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

//secured routes

router.route("/logout").post(verifyJWT, logoutUser);

router.route("/refresh").post(refreshAccessToken);

router.route("/reset-password").post(verifyJWT, changeCurrentPassword);

router.route("/update-detail").put(verifyJWT, updateAccountDetails);

router
  .route("/update-avatar")
  .post(upload.single("avatar"), verifyJWT, updateUserAvatar);

export default router;
