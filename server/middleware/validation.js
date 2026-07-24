const validateRequestBody = (req, res, next) => {
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({
            status: 'error',
            message: 'Request body is required'
        });
    }
    next();
};

module.exports = {
    validateRequestBody
};
