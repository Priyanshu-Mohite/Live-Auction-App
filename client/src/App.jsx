import React, { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import { 
  Container, Typography, TextField, Button, Box, Stack, Paper, Chip, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow 
} from "@mui/material";

const App = () => {
  const socket = useMemo(() => io("http://localhost:3000"), []);

  const [userName, setUserName] = useState("");
  const [roomName, setRoomName] = useState("");
  const [joinedRoom, setJoinedRoom] = useState("");
  const [bidAmount, setBidAmount] = useState("");

  const [highestBid, setHighestBid] = useState(0);
  const [highestBidder, setHighestBidder] = useState("No one yet");
  const [bidHistory, setBidHistory] = useState([]); // 🔥 History Store karne ke liye State
  const [messages, setMessages] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");
  
  const [endTime, setEndTime] = useState(null);
  const [timeLeft, setTimeLeft] = useState("");
  const [isAuctionEnded, setIsAuctionEnded] = useState(false);

  useEffect(() => {
    socket.on("connect", () => console.log("Connected", socket.id));

    socket.on("auction-update", (data) => {
      setHighestBid(data.highestBid);
      setHighestBidder(data.highestBidder);
      setEndTime(data.endTime);
      setBidHistory(data.bidHistory || []); // 🔥 Backend se History update ho rahi hai
      setErrorMsg(""); 
    });

    socket.on("receive-message", (m) => setMessages((prev) => [m, ...prev]));
    socket.on("bid-error", (err) => setErrorMsg(err));

    return () => socket.disconnect();
  }, [socket]);

  useEffect(() => {
    if (!endTime) return;
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = new Date(endTime).getTime() - now;
      if (distance <= 0) {
        clearInterval(interval);
        setTimeLeft("Auction Ended");
        setIsAuctionEnded(true);
      } else {
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeLeft(`${minutes}m ${seconds}s`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  const joinRoomHandler = (e) => {
    e.preventDefault();
    if (userName && roomName) {
      socket.emit("join-room", roomName);
      setJoinedRoom(roomName);
    }
  };

  const handleBidSubmit = (e) => {
    e.preventDefault();
    if (bidAmount && joinedRoom && !isAuctionEnded) {
      socket.emit("place-bid", { room: joinedRoom, bidAmount, userName });
      setBidAmount("");
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 5 }}>
      <Typography variant="h3" gutterBottom fontWeight="bold" color="primary" textAlign="center">
        LiveBids 🔨
      </Typography>

      {!joinedRoom ? (
        <Paper elevation={3} sx={{ p: 4, mt: 4, maxWidth: "500px", mx: "auto" }}>
          <form onSubmit={joinRoomHandler}>
            <Stack spacing={3}>
              <TextField value={userName} label="Your Name" onChange={(e) => setUserName(e.target.value)} required />
              <TextField value={roomName} label="Auction Item Name" onChange={(e) => setRoomName(e.target.value)} placeholder="e.g., Rolex Watch" required />
              <Button type="submit" variant="contained" size="large"> Join Auction </Button>
            </Stack>
          </form>
        </Paper>
      ) : (
        <Box sx={{ mt: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h5">Auction Room: <b>{joinedRoom}</b></Typography>
            <Chip label={timeLeft} color={isAuctionEnded ? "error" : "warning"} sx={{ fontWeight: "bold", fontSize: "1.1rem", px: 2 }} />
          </Stack>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
            {/* Left Side: Bidding Area */}
            <Box flex={1}>
              <Paper elevation={4} sx={{ p: 4, textAlign: "center", bgcolor: isAuctionEnded ? "#ffebee" : "#fdf8e3", mb: 3 }}>
                <Typography variant="h6" color={isAuctionEnded ? "error" : "text.secondary"}>
                  {isAuctionEnded ? "🏆 Winning Bid" : "Current Highest Bid"}
                </Typography>
                <Typography variant="h2" color={isAuctionEnded ? "error.main" : "success.main"} fontWeight="bold">
                  ₹{highestBid}
                </Typography>
                <Typography variant="subtitle1" color="text.secondary" mt={1}>
                  {isAuctionEnded ? "Winner:" : "Highest Bidder:"} <b>{highestBidder}</b>
                </Typography>
              </Paper>

              <form onSubmit={handleBidSubmit}>
                <Stack direction="row" spacing={2} sx={{ mb: 1 }}>
                  <TextField type="number" value={bidAmount} label={`Enter amount > ${highestBid}`} onChange={(e) => setBidAmount(e.target.value)} fullWidth required disabled={isAuctionEnded} />
                  <Button type="submit" variant="contained" disabled={isAuctionEnded}> Place Bid </Button>
                </Stack>
                {errorMsg && <Typography color="error" variant="body2" fontWeight="bold">{errorMsg}</Typography>}
              </form>
            </Box>

            {/* Right Side: Bid History Table 🔥 */}
            <Box flex={1}>
              <TableContainer component={Paper} elevation={3} sx={{ maxHeight: 300 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: "bold", bgcolor: "#f5f5f5" }}>Bidder Name</TableCell>
                      <TableCell align="right" sx={{ fontWeight: "bold", bgcolor: "#f5f5f5" }}>Amount</TableCell>
                      <TableCell align="right" sx={{ fontWeight: "bold", bgcolor: "#f5f5f5" }}>Time</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {/* Latest bid upar dikhane ke liye reverse() use kiya hai */}
                    {[...bidHistory].reverse().map((row, index) => (
                      <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        <TableCell component="th" scope="row">{row.userName}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: "bold", color: "green" }}>₹{row.bidAmount}</TableCell>
                        <TableCell align="right" sx={{ color: "text.secondary" }}>
                          {new Date(row.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </TableCell>
                      </TableRow>
                    ))}
                    {bidHistory.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} align="center" sx={{ py: 3, color: "gray" }}>No bids placed yet.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Stack>
        </Box>
      )}
    </Container>
  );
};

export default App;