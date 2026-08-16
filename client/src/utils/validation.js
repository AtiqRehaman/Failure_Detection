export const validateProjectForm = (formData) => {
  const errors = {};

  if (!formData.projectName || formData.projectName.trim().length < 3) {
    errors.projectName = 'Project name must be at least 3 characters';
  }

  if (!formData.industry) {
    errors.industry = 'Please select an industry';
  }

  if (!formData.businessModel) {
    errors.businessModel = 'Please select a business model';
  }

  if (!formData.targetMarketSize) {
    errors.targetMarketSize = 'Please select target market size';
  }

  if (!formData.budget) {
    errors.budget = 'Budget is required';
  } else if (parseFloat(formData.budget) <= 0) {
    errors.budget = 'Budget must be greater than 0';
  }

  if (!formData.employeesCount) {
    errors.employeesCount = 'Number of employees is required';
  } else if (parseInt(formData.employeesCount) < 1) {
    errors.employeesCount = 'Must have at least 1 employee';
  }

  if (formData.founderExperienceYears === '') {
    errors.founderExperienceYears = 'Founder experience is required';
  } else if (parseInt(formData.founderExperienceYears) < 0) {
    errors.founderExperienceYears = 'Experience cannot be negative';
  }

  if (!formData.description || formData.description.trim().length < 20) {
    errors.description = 'Description must be at least 20 characters';
  }

  return errors;
};