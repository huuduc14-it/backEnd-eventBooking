const TicketTypeModel = require("../models/ticket_type_Model")
const db = require("../config/db")

async function checkOwner(userId, ticketTypeId){
    const sql = `
    SELECT e.user_id
    FROM ticket_types tt
    JOIN events e ON tt.event_id = e.event_id
    WHERE tt.ticket_type_id = ?
    `
    const [rows] = await db.promise().execute(sql, [ticketTypeId])
    if(rows.length === 0) return false;
    return rows[0].user_id === userId;
}
exports.updateTicket = async (req,res) => {
    try{
        const {ticketTypeId} = req.params;
        const {name, price, total_quantity, description} = req.body;
        
        const isOwner = await checkOwner(req.user.id, ticketTypeId);

        if(!isOwner) {
            res.status(403).json({success: false, msg: "Not Authorized "})
        }
        await TicketTypeModel.update(ticketTypeId, {name, price, total_quantity, description})

        return res.json({success: true, msg: "Update Succcess "})
    }
    catch(error){
        return res.status(400).json({success: false, msg: error.message})
    }
}
exports.deleteTicket = async (req,res) => {
    try{
        const {ticketTypeId} = req.params;
        
        const isOwner = await checkOwner(req.user.id, ticketTypeId);

        if(!isOwner) {
            res.status(403).json({success: false, msg: "Not Authorized "})
        }
        await TicketTypeModel.delete(ticketTypeId)
        return res.json({success: true, msg: "Delete Succcess "})
    }
    catch(error){
        return res.status(400).json({success: false, msg: error.message})
    }
}
exports.addTicket = async (req, res) => {
    try {
        const { event_id, name, price, total_quantity, description } = req.body;
        
        const [events] = await db.promise().execute('SELECT user_id FROM events WHERE event_id = ?', [event_id]);
        if(events.length === 0 || events[0].user_id !== req.user.id) {
            return res.status(403).json({ success: false, message: "Not Authorized" });
        }

        const newId = await TicketTypeModel.add(event_id, { name, price, total_quantity, description });
        return res.status(201).json({ success: true, ticketTypeId: newId });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}