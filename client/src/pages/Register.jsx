import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { FaEnvelope, FaLock, FaUser, FaEye, FaEyeSlash } from "react-icons/fa";
import LoadingSpinner from "../components/LoadingSpinner";
import Toast from "../components/Toast";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [errors, setErrors] = useState({});
  const API_URL = import.meta.env.VITE_API_URL;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = "Name is required";
    else if (formData.name.length < 2)
      newErrors.name = "Name must be at least 2 characters";

    if (!formData.email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Email is invalid";

    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 8)
      newErrors.password = "Password must be at least 8 characters";

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });

      setToast({
        message:
          response.data.message || "Registration successful! Please login.",
        type: "success",
      });

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error) {
      setToast({
        message:
          error.response?.data?.message ||
          "Registration failed. Please try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-white py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        {toast && (
          <div className="fixed right-4 top-20 z-[9999] w-full max-w-md transition-all sm:right-6">
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => setToast(null)}
            />
          </div>
        )}

        <div className="relative w-full max-w-lg overflow-hidden rounded-[32px] border border-[#162032] bg-[#080d19] p-8 shadow-[0_30px_90px_rgba(0,0,0,0.35)] sm:p-10">
          <div className="pointer-events-none absolute -left-10 top-0 h-52 w-52 rounded-full bg-[#00F5A0]/10 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 right-0 h-52 w-52 rounded-full bg-[#00F5A0]/5 blur-3xl" />

          <div className="relative text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#21304a] bg-[#141d2e] shadow-[0_0_20px_rgba(0,245,160,0.1)]">
              <span className="h-5 w-5 rounded-full bg-[#00F5A0] shadow-[0_0_12px_#00F5A0]" />
            </div>
            <h2 className="mt-5 text-2xl font-black tracking-[0.08em] text-white sm:text-3xl">
              SENKEN<span className="text-[#00F5A0]">_</span>
            </h2>
            <p className="mt-1.5 text-xs text-[#7e8ca0] sm:text-sm">
              Anticipate Risk. Enable Success.
            </p>
          </div>

          <form className="relative mt-8 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8d9cb2]">
                Full Name
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#51627b]">
                  <FaUser size={15} />
                </div>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full rounded-2xl border bg-[#101726] py-3 pl-10 pr-3.5 text-sm text-white placeholder:text-[#455368] transition-all focus:outline-none ${
                    errors.name
                      ? "border-red-500/80 focus:ring-red-500"
                      : "border-[#1c273c] focus:border-[#00F5A0] focus:ring-1 focus:ring-[#00F5A0]"
                  }`}
                  placeholder="John Doe"
                />
              </div>
              {errors.name && (
                <p className="mt-1.5 text-xs font-medium text-red-400">
                  {errors.name}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8d9cb2]">
                Email Address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#51627b]">
                  <FaEnvelope size={15} />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full rounded-2xl border bg-[#101726] py-3 pl-10 pr-3.5 text-sm text-white placeholder:text-[#455368] transition-all focus:outline-none ${
                    errors.email
                      ? "border-red-500/80 focus:ring-red-500"
                      : "border-[#1c273c] focus:border-[#00F5A0] focus:ring-1 focus:ring-[#00F5A0]"
                  }`}
                  placeholder="name@company.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs font-medium text-red-400">
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8d9cb2]">
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#51627b]">
                  <FaLock size={15} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full rounded-2xl border bg-[#101726] py-3 pl-10 pr-10 text-sm text-white placeholder:text-[#455368] transition-all focus:outline-none ${
                    errors.password
                      ? "border-red-500/80 focus:ring-red-500"
                      : "border-[#1c273c] focus:border-[#00F5A0] focus:ring-1 focus:ring-[#00F5A0]"
                  }`}
                  placeholder="Minimum 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#51627b] transition-colors hover:text-[#00F5A0]"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <FaEyeSlash size={15} />
                  ) : (
                    <FaEye size={15} />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs font-medium text-red-400">
                  {errors.password}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8d9cb2]">
                Confirm Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#51627b]">
                  <FaLock size={15} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full rounded-2xl border bg-[#101726] py-3 pl-10 pr-3.5 text-sm text-white placeholder:text-[#455368] transition-all focus:outline-none ${
                    errors.confirmPassword
                      ? "border-red-500/80 focus:ring-red-500"
                      : "border-[#1c273c] focus:border-[#00F5A0] focus:ring-1 focus:ring-[#00F5A0]"
                  }`}
                  placeholder="Re-enter password"
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-1.5 text-xs font-medium text-red-400">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#00F5A0] px-4 py-3.5 text-sm font-extrabold text-[#080d19] shadow-[0_8px_25px_rgba(0,245,160,0.25)] transition-all duration-200 hover:bg-[#00dc8f] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" color="black" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <span>Create Account</span>
                )}
              </button>
            </div>

            <div className="pt-1 text-center">
              <p className="text-xs text-[#7e8ca0]">
                Already registered?{" "}
                <Link
                  to="/login"
                  className="font-semibold text-[#00F5A0] hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
