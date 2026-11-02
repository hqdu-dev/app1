const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
    try {
        // Lấy token từ Header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Bạn chưa đăng nhập"
            });
        }

        const token = authHeader.split(" ")[1];

        // Kiểm tra token
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Gắn user ID vào request
        req.user = decoded;

        next();

    } catch (error) {
        return res.status(401).json({
            message: "Token không hợp lệ hoặc đã hết hạn"
        });
    }
};

module.exports = verifyToken;