// require("dotenv").config({ path: "./env" });
import dotenv from "dotenv";
import { connectDb } from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
  path: "./.env",
});

connectDb()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Express Listing at port ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("Mongo db coneection failed ", err);
  });

/*
import express from "express";
const app = express();
(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
    app.on("error", (error) => {
      console.log("ERRR: ", error);
      throw error;
    });
    app.listen(process.env.PORT, () => {
      console.log(`App Listing At Port ${process.env.PORT}`);
    });
  } catch (error) {
    console.log(error);
  }
})();
*/
