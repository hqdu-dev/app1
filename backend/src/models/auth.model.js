const pool = require("../config/db");

const findUserByEmail = async (email) => {
    const result = await pool.query(
        `SELECT id, name, email, password_hash
         FROM users
         WHERE email = $1`,
        [email]
    );

    return result.rows[0];
};

const findUserAccessById = async (userId) => {
    const result = await pool.query(
        `SELECT
            u.id,
            u.name,
            u.email,
            COALESCE(
                array_agg(DISTINCT r.name)
                FILTER (WHERE r.name IS NOT NULL),
                ARRAY[]::text[]
            ) AS roles,
            COALESCE(
                array_agg(DISTINCT p.name)
                FILTER (WHERE p.name IS NOT NULL),
                ARRAY[]::text[]
            ) AS permissions
         FROM users u
         LEFT JOIN user_roles ur ON ur.user_id = u.id
         LEFT JOIN roles r ON r.id = ur.role_id
         LEFT JOIN role_permissions rp ON rp.role_id = r.id
         LEFT JOIN permissions p ON p.id = rp.permission_id
         WHERE u.id = $1
         GROUP BY u.id, u.name, u.email`,
        [userId]
    );

    return result.rows[0];
};

module.exports = {
    findUserByEmail,
    findUserAccessById
};