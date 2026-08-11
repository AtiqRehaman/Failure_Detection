import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaUser, FaSignOutAlt } from "react-icons/fa";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  const isActive = (path) => {
    return location.pathname === path
      ? "bg-slate-900 border-slate-900 text-white"
      : "border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100";
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <nav className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Branding */}
          <Link
            to="/"
            className="flex items-center space-x-3 group focus:outline-none"
          >
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white transition-colors group-hover:bg-slate-800">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://w3.org"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 6h7M3 12h4M3 18h10"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-none">
                Failure
                <span className="font-extrabold text-slate-900">
                  Detection-AI
                </span>
              </h1>
              <p className="text-[11px] font-medium text-slate-500 mt-1 tracking-wide">
                StartUp & Project Risk Analyzer
              </p>
            </div>
          </Link>

          {/* Right Navigation & Profile */}
          <div className="flex items-center space-x-2">
            {token ? (
              <>
                <Link
                  to="/dashboard"
                  className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors border ${isActive("/dashboard")}`}
                >
                  <div className="flex items-center space-x-2">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                      />
                    </svg>
                    <span>Dashboard</span>
                  </div>
                </Link>

                <Link
                  to="/submit"
                  className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors border ${isActive("/submit")}`}
                >
                  <div className="flex items-center space-x-2">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    <span>Project Input</span>
                  </div>
                </Link>

                {/* User Profile Badge & Logout Button */}
                <div className="border-l border-slate-200 pl-3 ml-2">
                  <div className="flex items-center space-x-2.5">
                    <div className="flex items-center space-x-2 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg">
                      <div className="w-6 h-6 bg-slate-900 rounded-full flex items-center justify-center text-white">
                        <FaUser size={11} />
                      </div>
                      <span className="text-xs font-bold text-slate-800 hidden sm:inline">
                        {user.name || "User"}
                      </span>
                    </div>

                    <button
                      onClick={handleLogout}
                      className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                      title="Sign Out"
                    >
                      <FaSignOutAlt size={15} />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
