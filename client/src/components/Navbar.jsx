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
      ? "bg-[#00F5A0] text-[#080d19] shadow-[0_8px_25px_rgba(0,245,160,0.2)]"
      : "text-[#8ea0b7] hover:text-white hover:bg-[#101b2d]";
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <nav className="bg-[#070b14]/90 backdrop-blur-xl border-b border-[#162032] sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between gap-4">
          <Link
            to="/"
            className="group flex items-center gap-3 focus:outline-none"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#21304a] bg-[#0e1526] text-[#00F5A0] shadow-[0_0_20px_rgba(0,245,160,0.13)] transition-all group-hover:border-[#2b3d5d] group-hover:text-[#7ef7c8]">
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 18V6" />
                <path d="M10 18V10" />
                <path d="M16 18V4" />
                <path d="M22 18V8" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-black tracking-[0.06em] text-white leading-none">
                SENKEN<span className="text-[#00F5A0]">_</span>
              </h1>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#6a7b95]">
                Anticipate Risk. Enable Success
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            {token ? (
              <>
                <div className="flex items-center gap-1 rounded-full border border-[#1d2c47] bg-[#0d1424] p-1">
                  <Link
                    to="/dashboard"
                    className={`rounded-full px-4 py-2 text-[11px] font-semibold tracking-wide transition-all ${isActive("/dashboard")}`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/submit"
                    className={`rounded-full px-4 py-2 text-[11px] font-semibold tracking-wide transition-all ${isActive("/submit")}`}
                  >
                    Project Input
                  </Link>
                </div>

                <div className="ml-1 flex items-center gap-3 rounded-full border border-[#182338] bg-[#0d1424] px-2 py-1.5">
                  <div className="flex items-center gap-2 rounded-full bg-[#111a2c] px-2.5 py-1.5">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#00F5A0] text-[10px] font-bold text-[#080d19]">
                      <FaUser size={10} />
                    </div>
                    <span className="hidden text-[11px] font-semibold text-white sm:inline">
                      {user.name || "User"}
                    </span>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-[#1d2c47] bg-[#101726] text-[#9bb0cb] transition-colors hover:border-[#2a3d5a] hover:text-[#00F5A0]"
                    title="Sign Out"
                  >
                    <FaSignOutAlt size={12} />
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-full border border-[#1d2c47] bg-[#101726] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c7d4e4] transition-colors hover:border-[#2a3d5a] hover:text-white"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="rounded-full bg-[#00F5A0] px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#080d19] shadow-[0_8px_25px_rgba(0,245,160,0.25)] transition-all hover:bg-[#00dc8f]"
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
