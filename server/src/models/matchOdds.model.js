import mongoose from "mongoose";

const matchOddsSchema = new mongoose.Schema(
  {
    matchId: {
      type: String,
      required: [true, "Match ID is required"],
      index: true,
    },
    starting_at: {
      type: Date,
      required: [true, "Match start time is required"],
    },
    odds: [
      {
        oddId: { type: String, required: true },
        marketId: { type: String, required: true },
        name: { type: String, required: true },
        value: { type: Number, required: true },
      },
    ],
    participants: [
      {
        id: { type: String },
        name: { type: String },
        image_path: { type: String },
      },
    ],
    state: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Expire records after 7 days
matchOddsSchema.index(
  { updatedAt: 1 },
  { expireAfterSeconds: 1 * 24 * 60 * 60 }
);

const MatchOdds = mongoose.model("MatchOdds", matchOddsSchema);

export default MatchOdds;
