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
const PORT = 3000;
const authMiddleware = require("./middlewares/authMiddleware");
app.use(bodyParser.json());
app.use(cors());
app.use("/public", express.static("public"));

app.use("/api/auth", authRoutes);
app.use("/api/event", eventRoutes);
app.use("/api/review", authMiddleware, reviewRoutes);
const profileRoute = require("./routes/profileRoute");
app.use("/api/profile", profileRoute);
const ticketRoutes = require("./routes/ticketRoutes");
app.use("/api/tickets", ticketRoutes);
const organizerRoutes = require("./routes/organizerRoutes");
app.use("/api/organizer", organizerRoutes);
const bookingRoutes = require("./routes/bookingRoutes");
app.use("/api", bookingRoutes);
const seatRoutes = require("./routes/seatRoutes");
app.use("/api", seatRoutes);
const promotionRoutes = require("./routes/promotionRoutes");
app.use("/api", promotionRoutes);
const paymentRoutes = require("./routes/paymentRoutes");
app.use("/api", paymentRoutes);
const categoryRoutes = require("./routes/categoryRoutes");
app.use("/api/categories", categoryRoutes);

app.listen(PORT, "0.0.0.0", () =>
  console.log(`Server running on port ${PORT}`)
);
