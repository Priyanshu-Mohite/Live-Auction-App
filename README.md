# LiveBids 🔨 - Real-Time Auction Platform

LiveBids is a real-time full-stack auction application built using the MERN stack and Socket.io. Users can join specific auction rooms, place live bids, track the highest bidder, watch a live countdown timer, and view the complete bid history in real-time.

---

## ✨ Features

- **Real-Time Bidding:** Instantly place bids and see updates without refreshing the page using WebSockets.  
- **Auction Rooms:** Join dedicated rooms for specific items (e.g., "Rolex Watch").  
- **Live Countdown Timer:** Each auction room has an automated countdown timer (default 5 minutes). Bidding is disabled once the timer runs out.  
- **Live Bid History:** View a real-time updating table of all bids placed in the room, showing the bidder's name, amount, and timestamp.  
- **Modern UI:** Clean, responsive, and intuitive user interface built with React and Material-UI (MUI).  
- **Persistent Data:** All auction data and bid histories are securely saved in a MongoDB database.  

---

## 🛠️ Tech Stack

### Frontend
- React.js  
- Material-UI (MUI)  
- Socket.io-client  

### Backend
- Node.js  
- Express.js  
- Socket.io  
- MongoDB & Mongoose  

---

## 🚀 Getting Started

Follow these instructions to get the project up and running on your local machine.

---

### 📌 Prerequisites

- Node.js installed  
- MongoDB Atlas account (or local MongoDB instance)  

---

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/your-username/LiveBids.git
cd LiveBids
