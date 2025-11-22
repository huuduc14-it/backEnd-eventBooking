const db = require("../config/db");

class EventModel {
  static async createFullEvent(data) {
    const conn = db.promise();
    try {
      await conn.beginTransaction();

      const eventQuery = `
            INSERT INTO events 
            (user_id, category_id, title, description, location_name, address, start_time, end_time, thumbnail_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
            `;
      const [eventResult] = await conn.execute(eventQuery, [
        data.userId,
        data.category_id,
        data.title,
        data.description,
        data.location_name,
        data.address,
        data.start_time,
        data.end_time,
        data.thumbnail_url,
      ]);
      const newEventId = eventResult.insertId;
      if (data.tickets && data.tickets.length > 0) {
        const ticketQuery = `
            INSERT INTO ticket_types (event_id, name, price, total_quantity, remaining, description)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        for (const ticket of data.tickets) {
          await conn.execute(ticketQuery, [
            newEventId,
            ticket.name,
            ticket.price,
            ticket.total_quantity,
            ticket.total_quantity,
            ticket.description,
          ]);
        }
      }

      if (data.artist_ids && data.artist_ids.length > 0) {
        const artistQuery = `INSERT INTO event_artists (event_id, artist_id) VALUES (?, ?)`;
        for (const artistId of data.artist_ids) {
          await conn.execute(artistQuery, [newEventId, artistId]);
        }
      }
      await conn.commit();
      return newEventId;
    } catch (err) {
      await conn.rollback();
      throw err;
    }
  }
}
module.exports = EventModel;
