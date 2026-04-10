import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import { createServer } from "http";
import mongoose from "mongoose";
import dotenv from "dotenv";

// ⚠️ Yahan apne Auction model ka path sahi daalna agar alag folder mein hai
import Auction from "./models/Auction.js"; 

dotenv.config();
const port = 3000;
const app = express();
const server = createServer(app);

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Atlas Connected Successfully!"))
  .catch((err) => console.log("❌ MongoDB Connection Error: ", err));

const io = new Server(server, {
  cors: {
    origin: "*",
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
          bidHistory: [] // 🔥 Naya item hai toh history khali hogi
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
      const auctionItem = await Auction.findOne({ roomName: room });

      if (auctionItem) {
        if (new Date() > new Date(auctionItem.endTime)) {
          socket.emit("bid-error", "Auction has ended!");
          return; 
        }

        if (newBid > auctionItem.highestBid) {
          auctionItem.highestBid = newBid;
          auctionItem.highestBidder = userName;
          // 🔥 DB mein naya bid history push kar rahe hain
          auctionItem.bidHistory.push({ userName, bidAmount: newBid, timestamp: new Date() });
          await auctionItem.save();

          // 🔥 Yahan bhi bidHistory frontend ko bhej rahe hain sabko dikhane ke liye
          io.to(room).emit("auction-update", {
            highestBid: auctionItem.highestBid,
            highestBidder: auctionItem.highestBidder,
            endTime: auctionItem.endTime,
            bidHistory: auctionItem.bidHistory,
          });

          io.to(room).emit("receive-message", `🔥 ${userName} placed a new highest bid of ₹${newBid}!`);
        } else {
          socket.emit("bid-error", "Your bid must be higher than the current highest bid.");
        }
      }
    } catch (error) {
      console.log("DB Error:", error);
    }
  });

  socket.on("disconnect", () => console.log("User disconnected", socket.id));
});

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});