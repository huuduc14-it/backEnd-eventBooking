const db = require('../config/db');

exports.getAllArtists = async (req, res) => {
    try {
        const [rows] = await db.promise().execute(
            'SELECT artist_id, name, image_url FROM artists ORDER BY name ASC'
        );
        return res.json({ success: true, data: rows });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};