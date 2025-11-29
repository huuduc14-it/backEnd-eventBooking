const db = require("../config/db");

class TicketTypeModel {
static async getByEventId(eventId) {
    const [rows] = await db.promise().execute(
        `SELECT ticket_type_id, name, price, total_quantity, remaining, description 
         FROM ticket_types 
         WHERE event_id = ?`, 
        [eventId]
    );
    return rows;
}
  // CRUD

  static async add(eventId, data) {
    const sql = `
      INSERT INTO ticket_types (event_id, name, price, total_quantity, remaining, description)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const [res] = await db
      .promise()
      .execute(sql, [
        eventId,
        data.name,
        data.price,
        data.total_quantity,
        data.total_quantity,
        data.description,
      ]);
    return res.insertId;
  }
static async update(ticketTypeId, data) {
    const conn = db.promise();

    // 1. FETCH OLD DATA FIRST
    const [rows] = await conn.execute(
      `SELECT name, price, total_quantity, remaining, description 
       FROM ticket_types 
       WHERE ticket_type_id = ?`,
      [ticketTypeId]
    );

    if (rows.length === 0) throw new Error("Ticket Type not found");
    const oldData = rows[0];

    // 2. MERGE DATA (The Safety Check)
    // Logic: Is the new value undefined? 
    // YES -> Keep old value. 
    // NO -> Use new value.
    const name = data.name !== undefined ? data.name : oldData.name;
    const price = data.price !== undefined ? data.price : oldData.price;
    const description = data.description !== undefined ? data.description : oldData.description;
    
    // Logic for Quantity (Calculated)
    let totalQty = oldData.total_quantity;
    let remaining = oldData.remaining;

    if (data.total_quantity !== undefined) {
        // If they changed quantity, ensure we don't break "Sold" logic
        const soldCount = oldData.total_quantity - oldData.remaining;
        if (data.total_quantity < soldCount) {
            throw new Error(`Cannot reduce quantity to ${data.total_quantity}. Already sold ${soldCount}.`);
        }
        totalQty = data.total_quantity;
        // Recalculate remaining based on new total
        remaining = data.total_quantity - soldCount;
    }

    // 3. UPDATE WITH MERGED DATA
    // Now we are safe to run the SQL because we know 'description' is not undefined.
    const sql = `
      UPDATE ticket_types 
      SET name = ?, price = ?, total_quantity = ?, remaining = ?, description = ?
      WHERE ticket_type_id = ?
    `;
    
    await conn.execute(sql, [
      name, price, totalQty, remaining, description, ticketTypeId
    ]);
    
    return true;
  }
  static async delete(ticketTypeId){
    try{
        await db.promise().execute(`DELETE FROM ticket_types WHERE ticket_type_id = ?`, [ticketTypeId]);
        return true
    }
    catch(err){
        if(err.code === 'ER_ROW_IS_REFERENCED_2'){
            throw new Error("Cannott delete this ticket types")
        }
        throw Error
    }
  }
}
module.exports = TicketTypeModel