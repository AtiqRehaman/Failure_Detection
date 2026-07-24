const { body, validationResult } = require('express-validator');
const { VALID_INDUSTRIES, VALID_BUSINESS_MODELS, BUDGET_MIN, BUDGET_MAX } = require('../config/constants');

const validateProject = [
    body('projectName')
        .trim()
        .notEmpty().withMessage('Project name is required')
        .isLength({ min: 3, max: 255 }).withMessage('Project name must be between 3 and 255 characters')
        .escape(),

    body('industry')
        .trim()
        .notEmpty().withMessage('Industry is required')
        .isIn(VALID_INDUSTRIES).withMessage(`Industry must be one of: ${VALID_INDUSTRIES.join(', ')}`)
        .escape(),

    body('businessModel')
        .trim()
        .notEmpty().withMessage('Business model is required')
        .isIn(VALID_BUSINESS_MODELS).withMessage(`Business model must be one of: ${VALID_BUSINESS_MODELS.join(', ')}`)
        .escape(),

    body('targetMarket')
        .trim()
        .notEmpty().withMessage('Target market is required')
        .isLength({ min: 3, max: 255 }).withMessage('Target market must be between 3 and 255 characters')
        .escape(),

    body('budget')
        .optional()
        .isFloat({ min: BUDGET_MIN, max: BUDGET_MAX }).withMessage(`Budget must be between ${BUDGET_MIN} and ${BUDGET_MAX}`),

    body('description')
        .trim()
        .notEmpty().withMessage('Project description is required')
        .isLength({ min: 20, max: 5000 }).withMessage('Description must be between 20 and 5000 characters')
        .escape()
];

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            status: 'error',
            message: 'Validation failed',
            errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg
            }))
        });
    }
    next();
};

module.exports = {
    validateProject,
    handleValidationErrors
};
