const authService = require("../services/auth.service");

const login = async (req, res) => {
    try {
        const result = await authService.login(req.body);

        res.json(result);
    } catch (error) {
        res.status(401).json({
            message: error.message
        });
    }
};

module.exports = {
    login
};