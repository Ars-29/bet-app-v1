import mongoose from "mongoose";
import betService from "../services/bet.service.js";
const connectDB = async () => {
  mongoose.connect("mongodb://localhost:27017/bet-app").then(async () => {
    console.log("Connected to MongoDB");
    // Recover missed bets on startup
    try {
      await betService.recoverMissedBets();
      console.log("Missed bets recovery completed");
    } catch (error) {
      console.error("Error recovering missed bets:", error);
    }
  }).catch((error) => {
    console.error("MongoDB connection error:", error);
  });
};

export default connectDB;




