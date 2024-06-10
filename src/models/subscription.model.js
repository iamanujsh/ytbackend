// import mongoose from "mongoose"
import { Schema, model } from "mongoose";

const subscriptionSchema = new Schema(
  {
    subscriber: { type: Schema.Types.ObjectId, ref: "User" }, //One Who is subscribing
    channel: { type: Schema.Types.ObjectId, ref: "User" }, //one to whom "subscriber" is subscribing
  },
  { timestamps }
);

export const Subscription = model("Subscription", subscriptionSchema);
