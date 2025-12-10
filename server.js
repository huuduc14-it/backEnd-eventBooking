const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const authRoutes = require("./routes/authRoutes");
const eventRoutes = require("./routes/eventRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const artistRoutes = require("./routes/artistRoutes");
const PORT = 3000;
const authMiddleware = require("./middlewares/authMiddleware");
app.use(bodyParser.json());
app.use(cors());
app.use("/public", express.static("thumbnails"));

app.use("/api/auth", authRoutes);
app.use("/api/event", eventRoutes);
app.use("/api/review", authMiddleware, reviewRoutes);
const profileRoute = require("./routes/profileRoute");
app.use("/api/profile", profileRoute);
const ticketRoutes = require("./routes/ticketRoutes");
app.use("/api/tickets", ticketRoutes);

const ticketTypeRoutes = require("./routes/ticket_type_Routes");
app.use("/api/tickets_type", authMiddleware, ticketTypeRoutes);

app.use("/api/booking", bookingRoutes);
app.use("/api/artists", artistRoutes);

const bookingRoutesNew = require("./routes/bookingRoutesNew");
app.use("/api", bookingRoutesNew);

const organizerRoutes = require("./routes/organizerRoutes");
app.use("/api/organizer", organizerRoutes);

app.listen(PORT, "0.0.0.0", () =>
  console.log(`Server running on port ${PORT}`)
);
