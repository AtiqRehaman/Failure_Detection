import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FormInput from '../components/FormInput';
import FormSelect from '../components/FormSelect';
import FormTextarea from '../components/FormTextarea';
import LoadingSpinner from '../components/LoadingSpinner';
import Toast from '../components/Toast';
import { submitProject } from '../services/api';
import { validateProjectForm } from '../utils/validation';
import axios from 'axios';

const ProjectSubmission = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    projectName: '',
    industry: '',
    businessModel: '',
    targetMarketSize: '',
    budget: '',
    employeesCount: '',
    founderExperienceYears: '',
    description: ''
  });

  const [touched, setTouched] = useState({
    projectName: false,
    industry: false,
    businessModel: false,
    targetMarketSize: false,
    budget: false,
    employeesCount: false,
    founderExperienceYears: false,
    description: false
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const token = localStorage.getItem('token');

  const industryOptions = [
    { value: 'Technology', label: 'Technology' },
    { value: 'Healthcare', label: 'Healthcare' },
    { value: 'Finance', label: 'Finance' },
    { value: 'Education', label: 'Education' },
    { value: 'Retail', label: 'Retail' },
    { value: 'Manufacturing', label: 'Manufacturing' },
    { value: 'Real Estate', label: 'Real Estate' },
    { value: 'Transportation', label: 'Transportation' },
    { value: 'Energy', label: 'Energy' },
    { value: 'Agriculture', label: 'Agriculture' },
    { value: 'Entertainment', label: 'Entertainment' },
    { value: 'Food & Beverage', label: 'Food & Beverage' },
    { value: 'E-commerce', label: 'E-commerce' },
    { value: 'SaaS', label: 'SaaS' },
    { value: 'Other', label: 'Other' }
  ];

  const businessModelOptions = [
    { value: 'B2B', label: 'B2B (Business to Business)' },
    { value: 'B2C', label: 'B2C (Business to Consumer)' },
    { value: 'B2G', label: 'B2G (Business to Government)' },
    { value: 'C2C', label: 'C2C (Consumer to Consumer)' },
    { value: 'SaaS', label: 'SaaS (Software as a Service)' },
    { value: 'Subscription', label: 'Subscription' },
    { value: 'Freemium', label: 'Freemium' },
    { value: 'Marketplace', label: 'Marketplace' },
    { value: 'Advertising', label: 'Advertising' },
    { value: 'Direct Sales', label: 'Direct Sales' },
    { value: 'Franchise', label: 'Franchise' },
    { value: 'Other', label: 'Other' }
  ];

  const targetMarketSizeOptions = [
    { value: 'Small', label: 'Small' },
    { value: 'Medium', label: 'Medium' },
    { value: 'Large', label: 'Large' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    
    const validationErrors = validateProjectForm(formData);
    if (validationErrors[name]) {
      setErrors(prev => ({ ...prev, [name]: validationErrors[name] }));
    }
  };

  const validateProjectForm = (data) => {
    const errors = {};

    if (!data.projectName || data.projectName.trim().length < 3) {
      errors.projectName = 'Project name must be at least 3 characters';
    }

    if (!data.industry) {
      errors.industry = 'Please select an industry';
    }

    if (!data.businessModel) {
      errors.businessModel = 'Please select a business model';
    }

    if (!data.targetMarketSize) {
      errors.targetMarketSize = 'Please select target market size';
    }

    if (!data.budget) {
      errors.budget = 'Budget is required';
    } else if (parseFloat(data.budget) <= 0) {
      errors.budget = 'Budget must be greater than 0';
    }

    if (!data.employeesCount) {
      errors.employeesCount = 'Number of employees is required';
    } else if (parseInt(data.employeesCount) < 1) {
      errors.employeesCount = 'Must have at least 1 employee';
    }

    if (data.founderExperienceYears === '') {
      errors.founderExperienceYears = 'Founder experience is required';
    } else if (parseInt(data.founderExperienceYears) < 0) {
      errors.founderExperienceYears = 'Experience cannot be negative';
    }

    if (!data.description || data.description.trim().length < 20) {
      errors.description = 'Description must be at least 20 characters';
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Mark all fields as touched
    const allTouched = Object.keys(touched).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setTouched(allTouched);

    // Validate form
    const validationErrors = validateProjectForm(formData);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setToast({
        message: 'Please fix the errors before submitting',
        type: 'error'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Step 1: Submit the project
      const payload = {
        projectName: formData.projectName,
        industry: formData.industry,
        businessModel: formData.businessModel,
        targetMarketSize: formData.targetMarketSize,
        budget: parseFloat(formData.budget),
        employeesCount: parseInt(formData.employeesCount),
        founderExperienceYears: parseInt(formData.founderExperienceYears),
        description: formData.description
      };

      console.log('📤 Submitting project:', payload);

      const response = await submitProject(payload);
      
      const projectId = response.data?.project_id || response.data?.id;
      
      if (!projectId) {
        throw new Error('Project created but no ID returned');
      }

      // Step 2: Auto-generate analysis
      setToast({
        message: 'Project submitted! Generating ML-powered analysis...',
        type: 'info'
      });

      try {
        const generateResponse = await axios.post(
          `${API_URL}/assessment/${projectId}/generate`,
          {},
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );

        if (generateResponse.data.status === 'success') {
          setToast({
            message: '✅ Project submitted and ML analysis generated successfully!',
            type: 'success'
          });
        }
      } catch (genError) {
        console.error('Auto-generation error:', genError);
        // Continue to navigation even if generation fails
        setToast({
          message: 'Project submitted! You can generate analysis manually from the project page.',
          type: 'warning'
        });
      }
      
      // Reset form
      setFormData({
        projectName: '',
        industry: '',
        businessModel: '',
        targetMarketSize: '',
        budget: '',
        employeesCount: '',
        founderExperienceYears: '',
        description: ''
      });
      setTouched({
        projectName: false,
        industry: false,
        businessModel: false,
        targetMarketSize: false,
        budget: false,
        employeesCount: false,
        founderExperienceYears: false,
        description: false
      });
      setErrors({});

      // Navigate to analysis page after a short delay
      setTimeout(() => {
        navigate(`/analysis/${projectId}`);
      }, 1500);
      
    } catch (error) {
      console.error('❌ Submission error:', error);
      setToast({
        message: error.message || 'Failed to submit project. Please try again.',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Submit Your Project
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Provide detailed information about your startup or project for ML-powered analysis and intelligence insights.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <form onSubmit={handleSubmit}>
            {/* Project Name */}
            <FormInput
              id="projectName"
              name="projectName"
              label="Startup / Project Name"
              value={formData.projectName}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.projectName}
              touched={touched.projectName}
              required
              placeholder="e.g., EcoTech Solutions"
            />

            {/* Industry */}
            <FormSelect
              id="industry"
              name="industry"
              label="Industry / Sector"
              value={formData.industry}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.industry}
              touched={touched.industry}
              options={industryOptions}
              required
              placeholder="Select industry"
            />

            {/* Business Model */}
            <FormSelect
              id="businessModel"
              name="businessModel"
              label="Business Model"
              value={formData.businessModel}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.businessModel}
              touched={touched.businessModel}
              options={businessModelOptions}
              required
              placeholder="Select business model"
            />

            {/* Target Market Size */}
            <FormSelect
              id="targetMarketSize"
              name="targetMarketSize"
              label="Target Market Size"
              value={formData.targetMarketSize}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.targetMarketSize}
              touched={touched.targetMarketSize}
              options={targetMarketSizeOptions}
              required
              placeholder="Select target market size"
            />

            {/* Budget */}
            <FormInput
              id="budget"
              name="budget"
              label="Budget (INR)"
              type="number"
              value={formData.budget}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.budget}
              touched={touched.budget}
              required
              placeholder="e.g., 500000"
              step="any"
              min="0"
            />

            {/* Number of Employees */}
            <FormInput
              id="employeesCount"
              name="employeesCount"
              label="Number of Employees"
              type="number"
              value={formData.employeesCount}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.employeesCount}
              touched={touched.employeesCount}
              required
              placeholder="e.g., 20"
              min="1"
              step="1"
            />

            {/* Founder Experience */}
            <FormInput
              id="founderExperienceYears"
              name="founderExperienceYears"
              label="Founder Experience (Years)"
              type="number"
              value={formData.founderExperienceYears}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.founderExperienceYears}
              touched={touched.founderExperienceYears}
              required
              placeholder="e.g., 8"
              min="0"
              step="1"
            />

            {/* Description */}
            <FormTextarea
              id="description"
              name="description"
              label="Project Description"
              value={formData.description}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.description}
              touched={touched.description}
              required
              rows={6}
              placeholder="Describe your project in detail. Include objectives, target audience, unique value proposition, and any other relevant information..."
            />

            <div className="mt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-6 py-3 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" color="white" />
                    <span>Submitting & Generating Analysis...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Project</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="mt-6 bg-slate-50 border border-slate-200 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 text-slate-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-800">ML-Powered Analysis</h4>
              <p className="text-sm text-slate-600 mt-0.5">
                Your project will be automatically analyzed using trained CatBoost ML models 
                for risk assessment and success prediction. The analysis will be ready when you 
                view the project details.
              </p>
            </div>
          </div>
        </div>

        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </div>
  );
};

export default ProjectSubmission;