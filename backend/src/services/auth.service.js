const authModel = require("../models/auth.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const login = async ({ email, password }) => {
    // 1. Tìm tài khoản
    const user = await authModel.findUserByEmail(email);

    if (!user) {
        throw new Error("Email hoặc mật khẩu không đúng");
    }

    // 2. Kiểm tra mật khẩu
    const isMatch = await bcrypt.compare(
        password,
        user.password_hash
    );

    if (!isMatch) {
        throw new Error("Email hoặc mật khẩu không đúng");
    }

    // 3. Tạo JWT
    const token = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // 4. Trả kết quả
    return {
        message: "Đăng nhập thành công",
        token
    };
};

module.exports = {
    login
};