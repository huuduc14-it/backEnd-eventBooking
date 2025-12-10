const db = require("../config/db");

class TicketTypeModel {
  static async getByEventId(eventId) {
    const [rows] = await db.execute(
      "SELECT * FROM ticket_types WHERE event_id = ?",
      [eventId]
    );

    return rows;
  }
  // CRUD

  //   static async add(eventId, data) {
  //     const sql = `
  //       INSERT INTO ticket_types (event_id, name, price, total_quantity, remaining, description)
  //       VALUES (?, ?, ?, ?, ?, ?)
  //     `;
  //     const [res] = await db
  //       .promise()
  //       .execute(sql, [
  //         eventId,
  //         data.name,
  //         data.price,
  //         data.total_quantity,
  //         data.total_quantity,
  //         data.description,
  //       ]);
  //     return res.insertId;
  //   }
  //   static async update(ticketTypeId, data) {
  //     const conn = db.promise();

  //     const [rows] = await conn.execute(
  //       `SELECT total_quantity, remaining FROM ticket_types WHERE ticket_type_id = ?`,
  //       [ticketTypeId]
  //     );
  //     if (rows.length === 0) throw new Error("Ticket Type not found");

  //     const current = rows[0];
  //     const soldCount = current.total_quantity - current.remaining;

  //     if (data.total_quantity < soldCount) {
  //       throw new Error(`Cannot reduce quantity to ${data.total_quantity}`);
  //     }

  //     const newRemaining = data.total_quantity - soldCount;

  //     // update part
  //     const sql = `
  //     UPDATE ticket_types
  //       SET name = ?, price = ?, description = ?, total_quantity = ?, remaining = ?
  //       WHERE ticket_type_id = ?
  //     `;
  //     await conn.execute(sql, [
  //       data.name,
  //       data.price,
  //       data.description,
  //       data.total_quantity,
  //       newRemaining,
  //       ticketTypeId,
  //     ]);
  //     return true;
  //   }
  //   static async delete(ticketTypeId) {
  //     try {
  //       await db
  //         .promise()
  //         .execute(`DELETE FROM ticket_types WHERE ticket_type_id = ?`, [
  //           ticketTypeId,
  //         ]);
  //       return true;
  //     } catch (err) {
  //       if (err.code === "ER_ROW_IS_REFERENCED_2") {
  //         throw new Error("Cannott delete this ticket types");
  //       }
  //       throw Error;
  //     }
  //   }
  static async add(eventId, data) {
    const sql = `
      INSERT INTO ticket_types (event_id, name, price, total_quantity, remaining, description)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const [res] = await db.execute(sql, [
      eventId,
      data.name,
      data.price,
      data.total_quantity,
      data.total_quantity,
      data.description,
    ]);
    return res.insertId;
  }

  // static async update(ticketTypeId, data) {
  //   const [rows] = await db.execute(
  //     `SELECT total_quantity, remaining FROM ticket_types WHERE ticket_type_id = ?`,
  //     [ticketTypeId]
  //   );
  //   if (rows.length === 0) throw new Error("Ticket Type not found");

  //   const current = rows[0];
  //   const soldCount = current.total_quantity - current.remaining;

  //   if (data.total_quantity < soldCount) {
  //     throw new Error(`Cannot reduce quantity to ${data.total_quantity}`);
  //   }

  //   const newRemaining = data.total_quantity - soldCount;

  //   const sql = `
  //     UPDATE ticket_types
  //     SET name = ?, price = ?, total_quantity = ?, remaining = ?
  //     WHERE ticket_type_id = ?
  //   `;
  //   await db.execute(sql, [
  //     data.name,
  //     data.price,
  //     data.total_quantity,
  //     newRemaining,
  //     ticketTypeId,
  //   ]);
  //   return true;
  // }
  static async update(ticketTypeId, data) {
    const [rows] = await db.execute(
      `SELECT name, price, total_quantity, remaining 
     FROM ticket_types WHERE ticket_type_id = ?`,
      [ticketTypeId]
    );

    if (rows.length === 0) throw new Error("Ticket Type not found");

    const current = rows[0];
    const soldCount = current.total_quantity - current.remaining;

    let newTotalQuantity = current.total_quantity;
    let newRemaining = current.remaining;

    if (data.total_quantity !== undefined) {
      if (data.total_quantity < soldCount) {
        throw new Error(
          `Cannot reduce quantity to ${data.total_quantity}, already sold ${soldCount}`
        );
      }
      newTotalQuantity = data.total_quantity;
      newRemaining = data.total_quantity - soldCount;
    }

    const updated = {
      name: data.name !== undefined ? data.name : current.name,
      price: data.price !== undefined ? data.price : current.price,
      total_quantity: newTotalQuantity,
      remaining: newRemaining,
    };

    const sql = `
    UPDATE ticket_types 
    SET name = ?, price = ?, total_quantity = ?, remaining = ?
    WHERE ticket_type_id = ?
  `;

    await db.execute(sql, [
      updated.name,
      updated.price,
      updated.total_quantity,
      updated.remaining,
      ticketTypeId,
    ]);

    return true;
  }

  static async delete(ticketTypeId) {
    try {
      await db.execute(`DELETE FROM ticket_types WHERE ticket_type_id = ?`, [
        ticketTypeId,
      ]);
      return true;
    } catch (err) {
      if (err.code === "ER_ROW_IS_REFERENCED_2") {
        throw new Error("Cannot delete this ticket type");
      }
      throw err;
    }
  }
}
module.exports = TicketTypeModel;
