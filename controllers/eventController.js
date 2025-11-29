const EventModel = require("../models/eventModel");
const SeatModel = require("../models/seatModel");
const TicketTypeModel = require("../models/ticket_type_Model")
exports.requestCreateEvent = async (req, res) => {
  try {
    // 1. EXTRACT DATA FIRST
    const {
      title,
      description,
      location_name,
      address,
      start_time,
      end_time,
      category_id,
    } = req.body;

    // 2. HANDLE THUMBNAIL (File vs String)
    let finalThumbnailUrl = req.body.thumbnail_url; 
    
    if (req.file) {
      // If file uploaded, override with generated URL
      finalThumbnailUrl = `${req.protocol}://${req.get("host")}/public/thumbnails/${req.file.filename}`;
    }

    // 3. PARSE JSON FIELDS 
    let tickets = req.body.tickets;
    let artist_ids = req.body.artist_ids;

    // Parse Tickets
    if (tickets && typeof tickets === "string") {
      try {
        tickets = JSON.parse(tickets);
      } catch (e) {
        return res.status(400).json({ message: "Invalid JSON format for tickets" });
      }
    }

    // Parse Artists (Fixing the variable name mismatch: artist_ids)
    if (artist_ids && typeof artist_ids === "string") {
      try {
        artist_ids = JSON.parse(artist_ids);
      } catch (e) {
        artist_ids = []; // Default to empty if parsing fails
      }
    }

    // 4. VALIDATION (Now safe to do because variables exist)
    if (
      !title ||
      !start_time ||
      !category_id ||
      !tickets ||
      tickets.length === 0
    ) {
      return res.status(400).json({
        message: "Missing required fields (Title, Time, Category, or Tickets)",
      });
    }

    const userId = req.user.id;

    // 5. CALL MODEL
    const newEventId = await EventModel.createFullEvent({
      userId,
      category_id,
      title,
      description,
      location_name,
      address,
      start_time,
      end_time,
      thumbnail_url: finalThumbnailUrl, // <--- FIX: Use the calculated URL
      artist_ids,
      tickets,
    });

    return res.status(201).json({
      msg: "Event Created",
      newEventId: newEventId,
    });

  } catch (err) {
    console.error("Create Event Error:", err);
    return res.status(500).json({ 
        message: "Database transaction failed", 
        error: err.message 
    });
  }
};
exports.getEventSeats = async (req, res) => {
  try {
    const { id } = req.params;
    const seats = await SeatModel.getEventSeats(id);

    return res.json({ success: true, data: seats });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
exports.getEventTickets = async (req, res) => {
    try {
        const eventId = req.params.id;
        const tickets = await TicketTypeModel.getByEventId(eventId);
        
        return res.json({
            success: true,
            data: tickets
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
