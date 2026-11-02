const pool = require("../config/db");

const findUserByEmail = async (email) => {
    const result = await pool.query(
        `SELECT
            id,
            name,
            email,
            password_hash
         FROM users
         WHERE email = $1`,
        [email]
    );

    return result.rows[0];
};

module.exports = {
    findUserByEmail
};