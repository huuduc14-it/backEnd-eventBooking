const express = require("express");
const router = express.Router();
const ticketController = require("../controllers/ticket_type_controller");

router.post("/add", ticketController.addTicket);
router.delete("/:ticketTypeId", ticketController.deleteTicket);
router.patch("/:ticketTypeId", ticketController.updateTicket);

module.exports = router;
