import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import FormInput from "../components/FormInput";
import FormSelect from "../components/FormSelect";
import FormTextarea from "../components/FormTextarea";
import LoadingSpinner from "../components/LoadingSpinner";
import Toast from "../components/Toast";
import { submitProject } from "../services/api";
import { validateProjectForm } from "../utils/validation";

const INPUT_STYLES =
  "text-slate-900 placeholder:text-slate-400 bg-white border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors";

const ProjectSubmission = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    projectName: "",
    industry: "",
    businessModel: "",
    targetMarket: "",
    budget: "",
    description: "",
  });

  const [touched, setTouched] = useState({
    projectName: false,
    industry: false,
    businessModel: false,
    targetMarket: false,
    budget: false,
    description: false,
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const industryOptions = [
    { value: "Technology", label: "Technology" },
    { value: "Healthcare", label: "Healthcare" },
    { value: "Finance", label: "Finance" },
    { value: "Education", label: "Education" },
    { value: "Retail", label: "Retail" },
    { value: "Manufacturing", label: "Manufacturing" },
    { value: "Real Estate", label: "Real Estate" },
    { value: "Transportation", label: "Transportation" },
    { value: "Energy", label: "Energy" },
    { value: "Agriculture", label: "Agriculture" },
    { value: "Entertainment", label: "Entertainment" },
    { value: "Food & Beverage", label: "Food & Beverage" },
    { value: "E-commerce", label: "E-commerce" },
    { value: "SaaS", label: "SaaS" },
    { value: "Other", label: "Other" },
  ];

  const businessModelOptions = [
    { value: "B2B", label: "B2B (Business to Business)" },
    { value: "B2C", label: "B2C (Business to Consumer)" },
    { value: "B2G", label: "B2G (Business to Government)" },
    { value: "C2C", label: "C2C (Consumer to Consumer)" },
    { value: "SaaS", label: "SaaS (Software as a Service)" },
    { value: "Subscription", label: "Subscription" },
    { value: "Freemium", label: "Freemium" },
    { value: "Marketplace", label: "Marketplace" },
    { value: "Advertising", label: "Advertising" },
    { value: "Direct Sales", label: "Direct Sales" },
    { value: "Franchise", label: "Franchise" },
    { value: "Other", label: "Other" },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));

    const validationErrors = validateProjectForm(formData);
    if (validationErrors[name]) {
      setErrors((prev) => ({ ...prev, [name]: validationErrors[name] }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const allTouched = Object.keys(touched).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setTouched(allTouched);

    const validationErrors = validateProjectForm(formData);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setToast({
        message: "Please fix the errors before submitting",
        type: "error",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await submitProject(formData);

      // Reset form
      setFormData({
        projectName: "",
        industry: "",
        businessModel: "",
        targetMarket: "",
        budget: "",
        description: "",
      });
      setTouched({
        projectName: false,
        industry: false,
        businessModel: false,
        targetMarket: false,
        budget: false,
        description: false,
      });
      setErrors({});

      // Navigate to analysis page with the project ID
      if (response.data && response.data.id) {
        navigate(`/analysis/${response.data.id}`);
      } else {
        // Fallback: if no ID in response, go to dashboard
        navigate("/dashboard");
      }
    } catch (error) {
      setToast({
        message: error.message || "Failed to submit project. Please try again.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-12 px-4 sm:px-6 lg:px-8 relative selection:bg-slate-900 selection:text-white">
      {/* Toast Notification Container */}
      {toast && (
        <div className="fixed top-20 right-4 sm:right-6 z-[9999] max-w-md w-full transition-all">
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        </div>
      )}

      <div className="max-w-3xl mx-auto">
        {/* Header Section */}
        <div className="mb-8 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-200/80 border border-slate-300 text-slate-800 text-xs font-semibold tracking-wider uppercase mb-4">
            <span className="w-2 h-2 rounded-full bg-slate-900" />
            Project Onboarding
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Submit Your Project
          </h2>
          <p className="mt-2 text-base text-slate-600 max-w-2xl leading-relaxed">
            Provide detailed information about your startup or project for
            intelligent analysis and recommendations.
          </p>
        </div>

        {/* Form Container Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
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
              className={INPUT_STYLES}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                className={INPUT_STYLES}
              />

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
                className={INPUT_STYLES}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <FormInput
                id="targetMarket"
                name="targetMarket"
                label="Target Market"
                value={formData.targetMarket}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.targetMarket}
                touched={touched.targetMarket}
                required
                placeholder="e.g., Small businesses in Andhra Pradesh"
                className={INPUT_STYLES}
              />

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
                placeholder="e.g., 500000"
                step="any"
                min="0"
                className={INPUT_STYLES}
              />
            </div>

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
              className={INPUT_STYLES}
            />

            {/* Submit Action Area */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-semibold text-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 focus:ring-offset-slate-100 active:scale-[0.99]"
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" color="white" />
                    <span className="tracking-wide">Submitting...</span>
                  </>
                ) : (
                  <>
                    <span className="tracking-wide">Submit Project</span>
                    <svg
                      className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                      />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* AI Analysis Information Banner */}
        
      </div>
    </div>
  );
};

export default ProjectSubmission;
