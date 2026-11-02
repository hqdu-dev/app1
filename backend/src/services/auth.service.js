const authModel = require("../models/auth.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const login = async ({ email, password }) => {
    const user = await authModel.findUserByEmail(email);

    if (!user) {
        throw new Error("Email hoặc mật khẩu không đúng");
    }

    const isMatch = await bcrypt.compare(
        password,
        user.password_hash
    );

    if (!isMatch) {
        throw new Error("Email hoặc mật khẩu không đúng");
    }

    const token = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    const userAccess = await authModel.findUserAccessById(user.id);

    if (!userAccess) {
        throw new Error("Không tìm thấy thông tin người dùng");
    }

    return {
        message: "Đăng nhập thành công",
        token,
        user: userAccess
    };
};

module.exports = {
    login
};