const EventModel = require("../models/eventModel")

exports.requestCreateEvent = async (req, res) => {
    try{
        const {
      title, description, location_name, address,
      start_time, end_time, thumbnail_url,
      category_id, artist_ids, tickets
    } = req.body;

    if (!title || !start_time || !category_id || !tickets || tickets.length === 0) {
      return res.status(400).json({ message: "Missing required fields (Title, Time, Category, or Tickets)" });
    }
    const userId = req.user.id

    const newEventId = await EventModel.createFullEvent({
      userId, category_id, title, description, location_name, 
      address, start_time, end_time, thumbnail_url, 
      artist_ids, tickets
    });

    return res.status(201).json({
        msg: "Event Created",
        newEventId: newEventId
    })
    }
    catch(err){
        console.error(err)
        return res.status(500).json({ message: "Database transaction failed", error: err.message });
    }
}