const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            status: 'error',
            message: 'No token provided. Please login first.'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // This sets { userId, email, role } on req.user
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                status: 'error',
                message: 'Token expired. Please login again.'
            });
        }
        return res.status(401).json({
            status: 'error',
            message: 'Invalid token. Please login again.'
        });
    }
};

module.exports = authenticate;