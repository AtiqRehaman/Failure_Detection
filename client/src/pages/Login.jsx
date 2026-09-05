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
      const response = await axios.post(`${API_URL}/auth/login`, formData);
      const { token, user } = response.data.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      setToast({
        message: "Login successful. Redirecting...",
        type: "success",
      });

      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    } catch (error) {
      setToast({
        message: error.response?.data?.message || "Unable to sign in.",
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
          <div className="fixed right-4 top-6 z-[9999] w-full max-w-md transition-all sm:right-6">
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => setToast(null)}
            />
          </div>
        )}

        <div className="relative w-full max-w-md overflow-hidden rounded-[32px] border border-[#162032] bg-[#080d19] p-8 shadow-[0_30px_90px_rgba(0,0,0,0.35)] sm:p-10">
          <div className="pointer-events-none absolute -right-8 top-0 h-48 w-48 rounded-full bg-[#00F5A0]/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-8 left-0 h-48 w-48 rounded-full bg-[#00F5A0]/5 blur-3xl" />

          <div className="relative mb-8 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#21304a] bg-[#141d2e]">
                <span className="h-2.5 w-2.5 rounded-full bg-[#00F5A0] shadow-[0_0_12px_#00F5A0]" />
              </div>
              <h1 className="text-xl font-black tracking-[0.08em] text-white">
                SENKEN<span className="text-[#00F5A0]">_</span>
              </h1>
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#1d2c47] bg-[#111a2c] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#00F5A0]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#00F5A0]" />
              <span>AI Risk Engine</span>
            </div>
          </div>

          <div className="relative mb-7">
            <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Sign In
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-[#7e8ca0]">
              Anticipate Risk. Enable Success.
            </p>
          </div>

          <form className="relative space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-xs font-medium text-[#8d9cb2]">
                Email Address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[#51627b]">
                  <FaEnvelope size={14} />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full rounded-2xl border bg-[#101726] py-3.5 pl-11 pr-4 text-sm text-white placeholder:text-[#455368] transition-all focus:outline-none ${
                    errors.email
                      ? "border-red-500/80 focus:ring-red-500"
                      : "border-[#1c273c] focus:border-[#00F5A0] focus:ring-1 focus:ring-[#00F5A0]"
                  }`}
                  placeholder="name@company.com"
                />
              </div>
              {errors.email && (
                <p className="ml-1 mt-1.5 text-xs font-medium text-red-400">
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium text-[#8d9cb2]">
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[#51627b]">
                  <FaLock size={14} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full rounded-2xl border bg-[#101726] py-3.5 pl-11 pr-11 text-sm text-white placeholder:text-[#455368] transition-all focus:outline-none ${
                    errors.password
                      ? "border-red-500/80 focus:ring-red-500"
                      : "border-[#1c273c] focus:border-[#00F5A0] focus:ring-1 focus:ring-[#00F5A0]"
                  }`}
                  placeholder="••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-[#51627b] transition-colors hover:text-[#00F5A0]"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <FaEyeSlash size={14} />
                  ) : (
                    <FaEye size={14} />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="ml-1 mt-1.5 text-xs font-medium text-red-400">
                  {errors.password}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex cursor-pointer select-none items-center gap-2 text-xs text-[#8d9cb2]">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 cursor-pointer rounded-md border-[#1c273c] bg-[#101726] text-[#00F5A0] accent-[#00F5A0] focus:ring-0 focus:ring-offset-0"
                />
                <span>Remember me</span>
              </label>

              <a
                href="#"
                className="text-xs font-semibold text-[#8d9cb2] transition-colors hover:text-[#00F5A0]"
              >
                Forgot password?
              </a>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#00F5A0] px-5 py-3.5 text-sm font-extrabold text-[#080d19] shadow-[0_8px_25px_rgba(0,245,160,0.25)] transition-all duration-200 hover:bg-[#00dc8f] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" color="black" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign in to Dashboard</span>
                )}
              </button>
            </div>

            <div className="mt-6 border-t border-[#141c2c] pt-5 text-center">
              <p className="text-xs text-[#6e7d95]">
                Don’t have an account?{" "}
                <Link
                  to="/register"
                  className="font-bold text-[#00F5A0] hover:underline"
                >
                  Register here
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
