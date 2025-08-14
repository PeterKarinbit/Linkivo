import React, { useEffect, useState, useContext } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import logo from "./assets/media/JobHunter.png";
import { useDispatch, useSelector } from "react-redux";
import { userService } from "../services/userService";
import { logout } from "../store/authSlice";
import { contentService } from "../services/contentService";
import { useDarkMode } from "../context/DarkModeContext";

function Navbar() {
  const navLinks = [
    {
      title: "Home",
      path: "/HomeLoggedIn",
    },
    {
      title: "Upload",
      path: "/upload",
    },
    {
      title: "Job Searcher",
      path: "/jobs",
    },
    {
      title: "Community",
      path: "/companies",
    },
    {
      title: "Refer a Friend",
      path: "/refer-friend",
    },
    {
      title: "Settings",
      path: "/settings",
    },
    {
      title: "Upgrade",
      path: "/upgrade",
    },
  ];
  const dispatch = useDispatch();
  const { status, userData } = useSelector((store) => store.auth);
  const [open, setOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [profilePicture, setProfilePicture] = useState(
    "https://upload.wikimedia.org/wikipedia/commons/2/2c/Default_pfp.svg"
  );
  const { darkMode, setDarkMode } = useDarkMode();
  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  useEffect(() => {
    const profilePicture =
      userData?.userProfile?.profilePicture ||
      userData?.userProfile?.companyLogo;
    setProfilePicture(profilePicture);
  }, [userData]);
  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleLogout = () => {
    userService
      .logout()
      .then(() => {
        dispatch(logout());
        window.location.href = "/login";
      })
      .catch((error) => {
        // Fallback: clear state and redirect even if API fails (e.g., token expired)
        dispatch(logout());
        window.location.href = "/login";
      });
  };

  const navigate = useNavigate();

  const activeStyle = "text-green-700 pb-4 border-b-2 border-green-700";

  return (
    <div className="border-b w-full fixed top-0 left-0 font-Nunito z-50 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow">
      <div className="lg:flex items-center justify-between bg-white dark:bg-gray-900 py-2.5 lg:px-10 px-7">
        <div className="font-bold text-2xl cursor-pointer flex items-center text-gray-900 dark:text-gray-100">
          <Link to="/" className="flex items-center font-Poppins">
            <img
              src={logo}
              className="w-10 rounded-lg mr-3"
              alt="Linkivo Logo"
            />
            <span className="font-bold">Linkivo</span>
          </Link>
        </div>

        <div
          onClick={() => setOpen((pre) => !pre)}
          className="text-3xl absolute right-8 top-3 cursor-pointer lg:hidden"
        >
          <i
            className={open ? "fa-solid fa-x" : "fa-solid fa-bars"}
            style={{ color: "#3fb337" }}
          ></i>
        </div>
        <ul
          className={`lg:flex lg:items-center lg:pb-0 pb-12 absolute lg:static bg-white dark:bg-gray-900 lg:z-auto z-[-1] left-0 w-full lg:w-auto lg:pl-0 pl-9 transition-all duration-500 ease-in ${
            open ? "top-20 " : "top-[-490px]"
          }`}
        >
          {/* Always show Home as the first link */}
          <li className="lg:ml-8 text-base font-semibold lg:my-0 my-7">
            <NavLink
              to="/"
              className={({ isActive }) =>
                isActive
                  ? activeStyle
                  : "text-gray-600 dark:text-gray-200 hover:text-green-700 dark:hover:text-green-400 font-medium"
              }
            >
              Home
            </NavLink>
          </li>
          {/* Only show Login and Sign Up when not logged in */}
          {!status ? (
            <>
              <div className=" lg:flex ">
                <Link to="/login">
                  <button className="border border-gray-300 dark:border-gray-600 text-black dark:text-gray-100 font-bold py-1.5 px-5 rounded-md lg:ml-32 lg:ml-7 lg:shadow xl:ml-36 hover:bg-green-300 hover:border-green-500 duration-500 mr-5 lg:hover:scale-105">
                    Login
                  </button>
                </Link>
                <Link to="/signup">
                  <button className="bg-black text-white font-bold py-1.5 px-5 rounded-md lg:ml hover:bg-green-700 duration-500 lg:hover:scale-105 lg:shadow">
                    Sign Up
                  </button>
                </Link>
              </div>
            </>
          ) : (
            // Show all navLinks except Home, Login, and Sign Up when logged in
            <>
          {navLinks.map((link, index) => {
                if (link.title === "Home") return null;
            return (
              <li
                key={index}
                className="lg:ml-8 text-base font-semibold lg:my-0 my-7"
              >
                <NavLink
                  to={link.path}
                  className={({ isActive }) =>
                    isActive
                      ? activeStyle
                      : "text-gray-600 dark:text-gray-200 hover:text-green-700 dark:hover:text-green-400 font-medium"
                  }
                >
                  {link.title}
                </NavLink>
              </li>
            );
          })}
              <div className="px-20 flex gap-8 items-center justify-center">
                <div>
                  <span>
                    <i className="fa-solid fa-bell text-xl text-gray-600 dark:text-gray-300"></i>
                  </span>
                </div>
                <div className="relative shado">
                  <div
                    className="rounded-full h-9 w-9 hover:cursor-pointer overflow-hidden flex justify-center items-center border border-gray-300 dark:border-gray-600"
                    onClick={() => {
                      if (userData.role !== "employer") {
                        toggleDropdown();
                      } else {
                        navigate("/dashboard/home");
                      }
                    }}
                  >
                    <img src={profilePicture} className="object-cover" />
                  </div>
                  {isOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 border border-gray-200 dark:border-gray-700">
                      <div
                        className="py-1"
                        role="menu"
                        aria-orientation="vertical"
                        aria-labelledby="options-menu"
                      >
                        <Link
                          to="/profile"
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-900"
                          role="menuitem"
                          onClick={toggleDropdown}
                        >
                          Edit Profile
                        </Link>
                        <Link
                          to="/saved-jobs"
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-900"
                          role="menuitem"
                          onClick={toggleDropdown}
                        >
                          Saved Jobs
                        </Link>
                        <p
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-900 hover:cursor-pointer"
                          role="menuitem"
                          onClick={() => {
                            handleLogout();
                            toggleDropdown();
                          }}
                        >
                          Logout
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
          {/* Custom Dark Mode Toggle Switch - always visible */}
          <li className="flex items-center lg:ml-4 mt-2 lg:mt-0">
            <button
              onClick={toggleDarkMode}
              aria-label="Toggle dark mode"
              className="relative w-12 h-6 flex items-center bg-gray-300 dark:bg-gray-700 rounded-full p-1 transition-colors duration-300 focus:outline-none ml-2"
            >
              <span
                className={`absolute left-1 top-1 w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${darkMode ? "translate-x-6 bg-green-500" : "translate-x-0 bg-white"}`}
              />
              {/* Sun/Moon icons for accessibility */}
              <span className="absolute left-1.5 top-1.5 text-xs text-yellow-400">{!darkMode ? "☀️" : ""}</span>
              <span className="absolute right-1.5 top-1.5 text-xs text-gray-300">{darkMode ? "🌙" : ""}</span>
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default Navbar;
