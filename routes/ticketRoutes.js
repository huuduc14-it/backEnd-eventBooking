const express = require("express");
const router = express.Router();
const ticketController = require("../controllers/ticket_type_Controller");


router.post("/", ticketController.addTicket);
router.delete("/:ticketTypeId", ticketController.deleteTicket);
router.put("/:ticketTypeId", ticketController.updateTicket);

module.exports = router