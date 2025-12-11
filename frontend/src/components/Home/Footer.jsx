import React from "react";
import logo from "../assets/media/JobHunter.png";
function Footer() {
  return (
    <div className="md:flex justify-between py-12 border-t border-gray-300  ">
      <div className="md:w-2/5 ml-6 md:ml-20 flex flex-col gap-2 py-4 md:py-0">
        {/* <img src={logo} className="w-3/5 md:w-3/6" /> */}
        <div className="font-semibold text-xl cursor-pointer flex items-center text-light-800">
          <p className="flex items-center font-Poppins">
            <img
              src={logo}
              className="w-10 rounded-lg mr-3"
              alt="JobHunter Logo"
            />
            Linkivo
          </p>
        </div>
        <div className=" flex gap-4 text-2xl ml-3.5 text-light-800">
          <a href="https://instagram.com/linkivo_ai" target="_blank" rel="noreferrer" aria-label="Instagram @linkivo.ai" className="hover:text-green-600">
            <i className="fa-brands fa-instagram"></i>
          </a>
          <span title="Discord coming soon" className="text-gray-400 cursor-not-allowed">
            <i className="fa-brands fa-discord"></i>
          </span>
          <span title="Facebook coming soon" className="text-gray-400 cursor-not-allowed">
            <i className="fa-brands fa-facebook"></i>
          </span>
        </div>
      </div>
      <div className="md:flex justify-between md:w-3/5 px-10 md:px-0">
        <div className="flex flex-col gap-2.5 py-5 md:py-0">
          <h3 className="font-semibold md:text-base text-xl">For Candidates</h3>
          <a className="text-lg md:text-base hover:underline hover:text-green-600" href="/login">Overview</a>
          <span className="text-lg md:text-base text-gray-400" title="Coming soon">Startup Jobs</span>
          <span className="text-lg md:text-base text-gray-400" title="Coming soon">Web3 Jobs</span>
          <span className="text-lg md:text-base text-gray-400" title="Coming soon">Featured</span>
          <span className="text-lg md:text-base text-gray-400" title="Coming soon">Startup Hiring Data</span>
          <span className="text-lg md:text-base text-gray-400" title="Coming soon">Tech Startups</span>
          <span className="text-lg md:text-base text-gray-400" title="Coming soon">Remote</span>
        </div>
        <div className="flex flex-col gap-2.5 py-5 md:py-0">
          <h3 className="font-semibold md:text-base text-xl    ">
            For Recruiters
          </h3>
          <a className="text-lg md:text-base hover:underline hover:text-green-600" href="/login">Overview</a>
          <span className="text-lg md:text-base text-gray-400" title="Coming soon">Recruit Pro</span>
          <span className="text-lg md:text-base text-gray-400" title="Coming soon">Curated</span>
          <span className="text-lg md:text-base text-gray-400" title="Coming soon">RecruiterCloud</span>
          <span className="text-lg md:text-base text-gray-400" title="Coming soon">Hire Developers</span>
          <a className="text-lg md:text-base hover:underline hover:text-green-600" href="/upgrade">Pricing</a>
        </div>
        <div className="flex flex-col gap-2.5 py-5 md:py-0">
          <h3 className="font-semibold md:text-base text-xl">Company</h3>
          <a className="text-lg md:text-base hover:underline hover:text-green-600" href="/login">About</a>
          <span className="text-lg md:text-base text-gray-400" title="Not applicable">AngelList Venture</span>
          <span className="text-lg md:text-base text-gray-400" title="Coming soon">Blog</span>
          <a className="text-lg md:text-base hover:underline hover:text-green-600" href="/terms">Terms & Risks</a>
          <a className="text-lg md:text-base hover:underline hover:text-green-600" href="/privacy">Privacy & Cookies</a>
        </div>
        <div></div>
      </div>
    </div>
  );
}

export default Footer;
