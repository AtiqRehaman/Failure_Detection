import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import LoadingSpinner from "../components/LoadingSpinner";
import Toast from "../components/Toast";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Email is invalid";
    if (!formData.password) newErrors.password = "Password is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/login",
        formData,
      );
      const { token, user } = response.data.data;

      // Store token and user info
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      // Set authorization header for future requests
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      setToast({
        message: "Login successful! Redirecting...",
        type: "success",
      });

      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    } catch (error) {
      setToast({
        message:
          error.response?.data?.message || "Login failed. Please try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 text-slate-900 relative selection:bg-slate-900 selection:text-white">
      {/* Toast Alert Container */}
      {toast && (
        <div className="fixed top-20 right-4 sm:right-6 z-[9999] max-w-md w-full transition-all">
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        </div>
      )}

      <div className="max-w-md w-full space-y-8 bg-white rounded-2xl border border-slate-200 p-8 sm:p-10 shadow-sm">
        {/* Logo / Branding Header */}
        <div className="text-center">
          <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto text-white shadow-sm">
            <svg
              className="w-7 h-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <h2 className="mt-5 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Product<span className="font-extrabold text-slate-900">Intel</span>
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-500">
            Sign in to access your projects and market intelligence
          </p>
        </div>

        {/* Login Form */}
        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          {/* Email Address */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <FaEnvelope size={15} />
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full pl-10 pr-3.5 py-2.5 bg-white border ${
                  errors.email
                    ? "border-red-500 focus:ring-red-500"
                    : "border-slate-300 focus:border-slate-900 focus:ring-slate-900"
                } rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 transition-colors`}
                placeholder="name@company.com"
              />
            </div>
            {errors.email && (
              <p className="mt-1.5 text-xs text-red-600 font-medium">
                {errors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <FaLock size={15} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full pl-10 pr-10 py-2.5 bg-white border ${
                  errors.password
                    ? "border-red-500 focus:ring-red-500"
                    : "border-slate-300 focus:border-slate-900 focus:ring-slate-900"
                } rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 transition-colors`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition-colors"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FaEyeSlash size={15} /> : <FaEye size={15} />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1.5 text-xs text-red-600 font-medium">
                {errors.password}
              </p>
            )}
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-slate-900 focus:ring-slate-900 border-slate-300 rounded accent-slate-900 cursor-pointer"
              />
              <label
                htmlFor="remember-me"
                className="ml-2 block text-xs font-medium text-slate-700 cursor-pointer"
              >
                Remember me
              </label>
            </div>
            <div className="text-xs">
              <a
                href="#"
                className="font-semibold text-slate-900 hover:underline"
              >
                Forgot password?
              </a>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" color="white" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </div>

          {/* Register Link */}
          <div className="text-center pt-3 border-t border-slate-100">
            <p className="text-xs text-slate-600">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-bold text-slate-900 hover:underline"
              >
                Register here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
