const pool = require("../config/db");

const checkPermission = (permissionName) => {
    return async (req, res, next) => {
        try {
            const userId = req.user.id;

            const result = await pool.query(
                `SELECT EXISTS (
                    SELECT 1
                    FROM user_roles ur
                    JOIN role_permissions rp
                        ON ur.role_id = rp.role_id
                    JOIN permissions p
                        ON rp.permission_id = p.id
                    WHERE ur.user_id = $1
                    AND p.name = $2
                ) AS allowed`,
                [userId, permissionName]
            );

            if (!result.rows[0].allowed) {
                return res.status(403).json({
                    message: "Bạn không có quyền thực hiện hành động này"
                });
            }

            next();

        } catch (error) {
            console.error("Permission error:", error.message);

            res.status(500).json({
                message: "Lỗi kiểm tra quyền"
            });
        }
    };
};

module.exports = checkPermission;