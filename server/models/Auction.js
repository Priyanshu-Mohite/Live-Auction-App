import mongoose from "mongoose";

const auctionSchema = new mongoose.Schema({
  roomName: { type: String, required: true, unique: true },
  highestBid: { type: Number, default: 0 },
  highestBidder: { type: String, default: "No one yet" },
  endTime: { type: Date, required: true }, // 🔥 Naya field: Timer track karne ke liye
  bidHistory: [
    {
      userName: String,
      bidAmount: Number,
      timestamp: { type: Date, default: Date.now }
    }
  ]
});

export default mongoose.model("Auction", auctionSchema);