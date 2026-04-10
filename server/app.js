import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import { createServer } from "http";
import mongoose from "mongoose";
import dotenv from "dotenv";

// ⚠️ Yahan apne Auction model ka path sahi daalna agar alag folder mein hai
import Auction from "./models/Auction.js";

dotenv.config();
const port = process.env.PORT || 3000;
const app = express();
const server = createServer(app);

app.use(express.json());

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Atlas Connected Successfully!"))
  .catch((err) => console.log("❌ MongoDB Connection Error: ", err));

const io = new Server(server, {
  cors: {
    origin: "https://your-frontend-url.onrender.com",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(cors());

app.get("/", (req, res) => {
  res.json({ message: "Auction Server is Running!" });
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // 1. JOIN ROOM
  socket.on("join-room", async (room) => {
    socket.join(room);

    try {
      let auctionItem = await Auction.findOne({ roomName: room });

      if (!auctionItem) {
        const auctionEndTime = new Date(Date.now() + 5 * 60 * 1000);
        auctionItem = await Auction.create({
          roomName: room,
          highestBid: 0,
          highestBidder: "No one yet",
          endTime: auctionEndTime,
          bidHistory: [], // 🔥 Naya item hai toh history khali hogi
        });
      }

      // 🔥 Yahan bidHistory frontend ko bhej rahe hain
      socket.emit("auction-update", {
        highestBid: auctionItem.highestBid,
        highestBidder: auctionItem.highestBidder,
        endTime: auctionItem.endTime,
        bidHistory: auctionItem.bidHistory,
      });

      socket.to(room).emit("receive-message", `A new bidder joined the room!`);
    } catch (error) {
      console.log("DB Error:", error);
    }
  });

  // 2. PLACE BID
  socket.on("place-bid", async ({ room, bidAmount, userName }) => {
    const newBid = Number(bidAmount);

    try {
      // 🔥 ATOMIC UPDATE: Check aur Update ek saath DB level pe
      const updatedAuction = await Auction.findOneAndUpdate(
        {
          roomName: room,
          highestBid: { $lt: newBid }, // 👈 Sirf tabhi update kar jab current bid newBid se CHOTI ho
          endTime: { $gt: new Date() }, // 👈 Auction khatam nahi hona chahiye
        },
        {
          $set: { highestBid: newBid, highestBidder: userName },
          $push: {
            bidHistory: { userName, bidAmount: newBid, timestamp: new Date() },
          },
        },
        { new: true }, // Naya data return karega
      );

      if (updatedAuction) {
        // Success! Sabko update bhej do
        io.to(room).emit("auction-update", {
          highestBid: updatedAuction.highestBid,
          highestBidder: updatedAuction.highestBidder,
          endTime: updatedAuction.endTime,
          bidHistory: updatedAuction.bidHistory,
        });
        io.to(room).emit(
          "receive-message",
          `🔥 ${userName} placed a new highest bid of ₹${newBid}!`,
        );
      } else {
        // Agar update nahi hua, iska matlab kisi aur ne pehle badi bid maar di ya time khatam ho gaya
        socket.emit("bid-error", "Bid too low or auction ended!");
      }
    } catch (error) {
      console.log("Concurrency Error:", error);
    }
  });
  socket.on("disconnect", () => console.log("User disconnected", socket.id));
});

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
