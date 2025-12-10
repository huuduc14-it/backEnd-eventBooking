const SeatModel = require("../models/seat.model");
const TicketTypeModel = require("../models/ticketType.model");

exports.saveSeatMap = async (req, res) => {
  try {
    const { event_id, map_json, seat_list } = req.body;

    // 1. Get all ticket types for this event to map names to IDs
    // Output: [ { id: 5, name: 'VIP' }, { id: 6, name: 'Standard' } ]
    const ticketTypes = await TicketTypeModel.getByEventId(event_id);

    // Helper to find ID by Name
    const findTypeId = (name) =>
      ticketTypes.find((t) => t.name === name)?.ticket_type_id;

    // 2. Prepare data for insertion
    const seatsToInsert = seat_list.map((seat) => ({
      section: seat.section,
      row_label: seat.row,
      seat_number: seat.number,
      ticket_type_id: findTypeId(seat.ticket_type_name), // Connects Map to Ticket
    }));

    // 3. Save Map & Seats
    await SeatModel.createMapWithSeats(event_id, map_json, seatsToInsert);

    // 4. AUTO-UPDATE QUANTITIES
    // Count how many VIP seats we just created and update ticket_types table
    await SeatModel.updateTicketQuantities(event_id);

    return res.json({
      success: true,
      message: "Map saved and quantities updated",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
