import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import FormInput from "../components/FormInput";
import FormSelect from "../components/FormSelect";
import FormTextarea from "../components/FormTextarea";
import LoadingSpinner from "../components/LoadingSpinner";
import Toast from "../components/Toast";
import { submitProject } from "../services/api";
import { validateProjectForm } from "../utils/validation";
import axios from "axios";

const ProjectSubmission = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    projectName: "",
    industry: "",
    businessModel: "",
    targetMarketSize: "",
    budget: "",
    employeesCount: "",
    founderExperienceYears: "",
    description: "",
  });

  const [touched, setTouched] = useState({
    projectName: false,
    industry: false,
    businessModel: false,
    targetMarketSize: false,
    budget: false,
    employeesCount: false,
    founderExperienceYears: false,
    description: false,
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("token");

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

  const targetMarketSizeOptions = [
    { value: "Small", label: "Small" },
    { value: "Medium", label: "Medium" },
    { value: "Large", label: "Large" },
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

  const validateProjectForm = (data) => {
    const errors = {};

    if (!data.projectName || data.projectName.trim().length < 3) {
      errors.projectName = "Project name must be at least 3 characters";
    }

    if (!data.industry) {
      errors.industry = "Please select an industry";
    }

    if (!data.businessModel) {
      errors.businessModel = "Please select a business model";
    }

    if (!data.targetMarketSize) {
      errors.targetMarketSize = "Please select target market size";
    }

    if (!data.budget) {
      errors.budget = "Budget is required";
    } else if (parseFloat(data.budget) <= 0) {
      errors.budget = "Budget must be greater than 0";
    }

    if (!data.employeesCount) {
      errors.employeesCount = "Number of employees is required";
    } else if (parseInt(data.employeesCount) < 1) {
      errors.employeesCount = "Must have at least 1 employee";
    }

    if (data.founderExperienceYears === "") {
      errors.founderExperienceYears = "Founder experience is required";
    } else if (parseInt(data.founderExperienceYears) < 0) {
      errors.founderExperienceYears = "Experience cannot be negative";
    }

    if (!data.description || data.description.trim().length < 20) {
      errors.description = "Description must be at least 20 characters";
    }

    return errors;
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
      const payload = {
        projectName: formData.projectName,
        industry: formData.industry,
        businessModel: formData.businessModel,
        targetMarketSize: formData.targetMarketSize,
        budget: parseFloat(formData.budget),
        employeesCount: parseInt(formData.employeesCount),
        founderExperienceYears: parseInt(formData.founderExperienceYears),
        description: formData.description,
      };

      const response = await submitProject(payload);
      const projectId = response.data?.project_id || response.data?.id;

      if (!projectId) {
        throw new Error("Project created but no ID returned");
      }

      setToast({
        message: "Project submitted! Generating ML-powered analysis...",
        type: "info",
      });

      try {
        const generateResponse = await axios.post(
          `${API_URL}/assessment/${projectId}/generate`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (generateResponse.data.status === "success") {
          setToast({
            message:
              "✅ Project submitted and ML analysis generated successfully!",
            type: "success",
          });
        }
      } catch (genError) {
        console.error("Auto-generation error:", genError);
        setToast({
          message:
            "Project submitted! You can generate analysis manually from the project page.",
          type: "warning",
        });
      }

      setFormData({
        projectName: "",
        industry: "",
        businessModel: "",
        targetMarketSize: "",
        budget: "",
        employeesCount: "",
        founderExperienceYears: "",
        description: "",
      });
      setTouched({
        projectName: false,
        industry: false,
        businessModel: false,
        targetMarketSize: false,
        budget: false,
        employeesCount: false,
        founderExperienceYears: false,
        description: false,
      });
      setErrors({});

      setTimeout(() => {
        navigate(`/analysis/${projectId}`);
      }, 1500);
    } catch (error) {
      console.error("❌ Submission error:", error);
      setToast({
        message: error.message || "Failed to submit project. Please try again.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-white py-10 px-4 sm:px-6 lg:px-8 font-sans selection:bg-[#00F5A0] selection:text-black">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#162032] pb-6">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#1d2c47] bg-[#111a2c] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#00F5A0]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00F5A0] animate-pulse" />
              SENKEN Signal Intake
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Submit Project Telemetry
            </h2>
            <p className="mt-2 text-sm text-[#7e8ca0] max-w-xl leading-relaxed">
              Feed your project metrics into the SENKEN ML engine for automated
              risk scoring, failure probability, and SWOT synthesis.
            </p>
          </div>
        </div>

        {/* Main Form Container Card */}
        <div className="relative rounded-[32px] border border-[#162032] bg-[#080d19] p-6 sm:p-10 shadow-[0_30px_90px_rgba(0,0,0,0.4)] overflow-hidden">
          {/* Subtle Ambient Radial Glows */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#00F5A0]/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-[#00F5A0]/5 rounded-full blur-3xl pointer-events-none" />

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            {/* Project Name */}
            <div>
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
                placeholder="e.g., Nexus AI Health Matrix"
              />
            </div>

            {/* Row 1: Industry & Business Model */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                placeholder="Select primary industry"
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
                placeholder="Select monetization model"
              />
            </div>

            {/* Row 2: Target Market, Budget, & Employees */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
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
                placeholder="Select size"
              />
              <FormInput
                id="budget"
                name="budget"
                label="Budget Allocation (INR)"
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
              <FormInput
                id="employeesCount"
                name="employeesCount"
                label="Team Headcount"
                type="number"
                value={formData.employeesCount}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.employeesCount}
                touched={touched.employeesCount}
                required
                placeholder="e.g., 12"
                min="1"
                step="1"
              />
            </div>

            {/* Row 3: Founder Experience */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInput
                id="founderExperienceYears"
                name="founderExperienceYears"
                label="Founder Track Record (Years)"
                type="number"
                value={formData.founderExperienceYears}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.founderExperienceYears}
                touched={touched.founderExperienceYears}
                required
                placeholder="e.g., 6"
                min="0"
                step="1"
              />
            </div>

            {/* Row 4: Narrative Description */}
            <div>
              <FormTextarea
                id="description"
                name="description"
                label="Executive Project Description"
                value={formData.description}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.description}
                touched={touched.description}
                required
                rows={5}
                placeholder="Detail the core value proposition, unfair technical advantage, go-to-market timeline, and target customer profile..."
              />
            </div>

            {/* Submit Action Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-[#00F5A0] hover:bg-[#00dc8f] active:scale-[0.99] text-[#080d19] rounded-2xl text-sm font-extrabold shadow-[0_10px_30px_rgba(0,245,160,0.25)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" color="black" />
                    <span>
                      Transmitting Telemetry & Running ML Assessment...
                    </span>
                  </>
                ) : (
                  <>
                    <span>Submit & Run AI Assessment</span>
                    <svg
                      className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                      />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Floating Toast Alert */}
        {toast && (
          <div className="fixed top-6 right-4 sm:right-6 z-[9999] max-w-md w-full transition-all">
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => setToast(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectSubmission;
