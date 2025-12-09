const seatModel = require('../models/seatModel');

// Create seat map and seats for event
exports.createSeatMap = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { mapJson, seats } = req.body;

    if (!mapJson) {
      return res.status(400).json({ message: 'Map JSON is required' });
    }

    // Create seat map
    const seatMapId = await seatModel.createSeatMap(eventId, mapJson);

    // Create seats if provided
    if (seats && seats.length > 0) {
      await seatModel.createSeats(seatMapId, seats);
    }

    res.status(201).json({ 
      message: 'Seat map created successfully', 
      seatMapId 
    });
  } catch (error) {
    console.error('Error creating seat map:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get seat map for event
exports.getSeatMap = async (req, res) => {
  try {
    const { eventId } = req.params;

    const seatMap = await seatModel.getSeatMapByEvent(eventId);

    if (!seatMap) {
      return res.status(404).json({ message: 'Seat map not found' });
    }

    res.json(seatMap);
  } catch (error) {
    console.error('Error fetching seat map:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add seats to existing seat map
exports.addSeats = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { seats } = req.body;

    if (!seats || seats.length === 0) {
      return res.status(400).json({ message: 'Seats array is required' });
    }

    const seatMap = await seatModel.getSeatMapByEvent(eventId);
    if (!seatMap) {
      return res.status(404).json({ message: 'Seat map not found for this event' });
    }

    await seatModel.createSeats(seatMap.seat_map_id, seats);

    res.status(201).json({ message: 'Seats added successfully' });
  } catch (error) {
    console.error('Error adding seats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all seats for event
exports.getSeats = async (req, res) => {
  try {
    const { eventId } = req.params;

    const seats = await seatModel.getSeatsByEvent(eventId);

    res.json(seats);
  } catch (error) {
    console.error('Error fetching seats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get available seats for event
exports.getAvailableSeats = async (req, res) => {
  try {
    const { eventId } = req.params;

    const seats = await seatModel.getAvailableSeats(eventId);

    res.json(seats);
  } catch (error) {
    console.error('Error fetching available seats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Reserve seats
exports.reserveSeats = async (req, res) => {
  try {
    const { seatIds } = req.body;

    if (!seatIds || seatIds.length === 0) {
      return res.status(400).json({ message: 'Seat IDs are required' });
    }

    await seatModel.reserveSeats(seatIds);

    res.json({ message: 'Seats reserved successfully' });
  } catch (error) {
    console.error('Error reserving seats:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// Release seats
exports.releaseSeats = async (req, res) => {
  try {
    const { seatIds } = req.body;

    if (!seatIds || seatIds.length === 0) {
      return res.status(400).json({ message: 'Seat IDs are required' });
    }

    await seatModel.releaseSeats(seatIds);

    res.json({ message: 'Seats released successfully' });
  } catch (error) {
    console.error('Error releasing seats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update seat
exports.updateSeat = async (req, res) => {
  try {
    const { seatId } = req.params;
    const updates = req.body;

    const seat = await seatModel.getSeatById(seatId);
    if (!seat) {
      return res.status(404).json({ message: 'Seat not found' });
    }

    await seatModel.updateSeat(seatId, updates);

    res.json({ message: 'Seat updated successfully' });
  } catch (error) {
    console.error('Error updating seat:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete seat
exports.deleteSeat = async (req, res) => {
  try {
    const { seatId } = req.params;

    const seat = await seatModel.getSeatById(seatId);
    if (!seat) {
      return res.status(404).json({ message: 'Seat not found' });
    }

    await seatModel.deleteSeat(seatId);

    res.json({ message: 'Seat deleted successfully' });
  } catch (error) {
    console.error('Error deleting seat:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = exports;
