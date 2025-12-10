const db = require("../config/db");

class EventModel {
  static async createFullEvent(data) {
    const conn = await db.getConnection(); // Lấy connection từ pool
    try {
      await conn.beginTransaction();

      // 1. Insert event
      const eventQuery = `
        INSERT INTO events 
        (user_id, category_id, title, description, location_name, address, start_time, end_time, thumbnail_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
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

      // 2. Insert tickets
      if (data.tickets?.length > 0) {
        const ticketQuery = `
          INSERT INTO ticket_types 
          (event_id, name, price, total_quantity, remaining, description)
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

      // 3. Insert artists
      if (data.artist_ids?.length > 0) {
        const artistQuery = `
          INSERT INTO event_artists (event_id, artist_id)
          VALUES (?, ?)
        `;
        for (const artistId of data.artist_ids) {
          await conn.execute(artistQuery, [newEventId, artistId]);
        }
      }

      await conn.commit();
      conn.release(); // Trả connection về pool

      return newEventId;
    } catch (err) {
      await conn.rollback();
      conn.release();
      throw err;
    }
  }
}

module.exports = EventModel;
