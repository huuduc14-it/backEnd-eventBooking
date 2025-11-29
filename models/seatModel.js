const db = require('../config/db');

class SeatModel {
    
    static async createMapWithSeats(eventId, mapJson, seatsArray) {
        const conn = db.promise();
        try {
            await conn.beginTransaction();

            // A. Save the Visual Map JSON (for Android to draw later)
            const [mapResult] = await conn.execute(
                `INSERT INTO seat_maps (event_id, map_json) VALUES (?, ?)`,
                [eventId, JSON.stringify(mapJson)]
            );
            const seatMapId = mapResult.insertId;

            if (seatsArray.length > 0) {
                const values = [];
                const placeholders = seatsArray.map(() => '(?, ?, ?, ?, ?, ?)').join(', ');
                
                seatsArray.forEach(seat => {
                    values.push(seatMapId, seat.section, seat.row_label, seat.seat_number, seat.ticket_type_id, true); // true = is_available
                });

                const sql = `INSERT INTO seats (seat_map_id, section, row_label, seat_number, ticket_type_id, is_available) VALUES ${placeholders}`;
                await conn.execute(sql, values);
            }

            await conn.commit();
        } catch (err) {
            await conn.rollback();
            throw err;
        }
    }

    static async updateTicketQuantities(eventId) {
        const conn = db.promise();
        
        const sql = `
            UPDATE ticket_types tt
            JOIN (
                SELECT ticket_type_id, COUNT(*) as actual_count 
                FROM seats s
                JOIN seat_maps sm ON s.seat_map_id = sm.seat_map_id
                WHERE sm.event_id = ?
                GROUP BY ticket_type_id
            ) as counts ON tt.ticket_type_id = counts.ticket_type_id
            SET tt.total_quantity = counts.actual_count,
                tt.remaining = counts.actual_count
            WHERE tt.event_id = ?
        `;
        await conn.execute(sql, [eventId, eventId]);
    }
    static async getSeatsByEvent(eventId){
        const sql = 
        `
            SELECT 
            s.seat_id, s.row_label, s.seat_number, s.is_available, 
            tt.name as class_name, tt.price
        FROM seats s
        JOIN ticket_types tt ON s.ticket_type_id = tt.ticket_type_id
        WHERE s.seat_map_id IN (SELECT seat_map_id FROM seat_maps WHERE event_id = ?)
        ORDER BY s.row_label ASC, CAST(s.seat_number AS UNSIGNED) ASC
        `
    }
}

module.exports = SeatModel;