const { body, validationResult } = require('express-validator');
const { VALID_INDUSTRIES, VALID_BUSINESS_MODELS } = require('../config/constants');

// Updated validation rules for Milestone 3
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

    // Updated: targetMarketSize (replaces targetMarket)
    body('targetMarketSize')
        .trim()
        .notEmpty().withMessage('Target market size is required')
        .isIn(['Small', 'Medium', 'Large']).withMessage('Target market size must be Small, Medium, or Large')
        .escape(),

    body('budget')
        .notEmpty().withMessage('Budget is required')
        .isFloat({ min: 0 }).withMessage('Budget must be a positive number'),

    // New: employeesCount validation
    body('employeesCount')
        .notEmpty().withMessage('Number of employees is required')
        .isInt({ min: 1 }).withMessage('Number of employees must be at least 1'),

    // New: founderExperienceYears validation
    body('founderExperienceYears')
        .notEmpty().withMessage('Founder experience is required')
        .isInt({ min: 0 }).withMessage('Founder experience must be 0 or more'),

    body('description')
        .trim()
        .notEmpty().withMessage('Project description is required')
        .isLength({ min: 20, max: 5000 }).withMessage('Description must be between 20 and 5000 characters')
        .escape()
];

// Check validation results
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