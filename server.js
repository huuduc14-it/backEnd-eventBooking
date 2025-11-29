const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const bookingRoutes = require('./routes/bookingRoutes')
const artistRoutes = require("./routes/artistRoutes")
const authRoutes = require("./routes/authRoutes");
const ticketTypeRoutes = require("./routes/ticketRoutes")
const eventRoutes = require("./routes/eventRoutes");
const authMiddleware = require("./middlewares/authMiddleware");


const app = express();
const PORT = 3000;

app.use('/public', express.static('thumbnails'));
app.use(bodyParser.json());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/booking", bookingRoutes)
app.use("/api/artists", artistRoutes)
app.use("/api/auth", authRoutes);
app.use("/api/event", authMiddleware ,eventRoutes)
app.use("/api/tickets", authMiddleware, ticketTypeRoutes)

app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: "Endpoint not found. Check your URL and Method."
    });
});

app.listen(PORT, "0.0.0.0", () =>
  console.log(`Server running on port ${PORT}`)
);
