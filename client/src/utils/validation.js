const VALID_INDUSTRIES = [
    'Technology', 'Healthcare', 'Finance', 'Education', 'Retail',
    'Manufacturing', 'Real Estate', 'Transportation', 'Energy',
    'Agriculture', 'Entertainment', 'Food & Beverage', 'E-commerce',
    'SaaS', 'Other'
];

const VALID_BUSINESS_MODELS = [
    'B2B', 'B2C', 'B2G', 'C2C', 'SaaS', 'Subscription',
    'Freemium', 'Marketplace', 'Advertising', 'Direct Sales',
    'Franchise', 'Other'
];

export const validateProjectForm = (formData) => {
  const errors = {};

  if (!formData.projectName || formData.projectName.trim().length < 3) {
    errors.projectName = 'Project name must be at least 3 characters';
  } else if (formData.projectName.length > 255) {
    errors.projectName = 'Project name must be less than 255 characters';
  }

  if (!formData.industry) {
    errors.industry = 'Please select an industry';
  } else if (!VALID_INDUSTRIES.includes(formData.industry)) {
    errors.industry = 'Please select a valid industry';
  }

  if (!formData.businessModel) {
    errors.businessModel = 'Please select a business model';
  } else if (!VALID_BUSINESS_MODELS.includes(formData.businessModel)) {
    errors.businessModel = 'Please select a valid business model';
  }

  if (!formData.targetMarket || formData.targetMarket.trim().length < 3) {
    errors.targetMarket = 'Target market must be at least 3 characters';
  } else if (formData.targetMarket.length > 255) {
    errors.targetMarket = 'Target market must be less than 255 characters';
  }

  if (formData.budget) {
    const budgetNum = parseFloat(formData.budget);
    if (isNaN(budgetNum) || budgetNum < 0) {
      errors.budget = 'Budget must be a positive number';
    } else if (budgetNum > 1000000000) {
      errors.budget = 'Budget cannot exceed 1,000,000,000 USD';
    }
  }

  if (!formData.description || formData.description.trim().length < 20) {
    errors.description = 'Description must be at least 20 characters';
  } else if (formData.description.length > 5000) {
    errors.description = 'Description must be less than 5000 characters';
  }

  return errors;
};

export const hasError = (errors, field) => {
  return errors && errors[field] !== undefined && errors[field] !== '';
};

export const getErrorMessage = (errors, field) => {
  return errors && errors[field] ? errors[field] : null;
};

export const validateField = (formData, field, value) => {
  const tempFormData = { ...formData, [field]: value };
  const errors = validateProjectForm(tempFormData);
  return errors[field] || null;
};
