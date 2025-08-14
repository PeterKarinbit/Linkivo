import React from "react";
import LogoSlider from "../components/Home/LogoSlider";
import JobSeekers from "../components/Home/JobSeekers";
import Hero from "../components/Home/Hero";
import HomeStats from "../components/Home/HomeStats";
import HomeRecruiters from "../components/Home/HomeRecruiters";
import Footer from "../components/Home/Footer";

function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 via-blue-50 to-blue-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Main Content Container */}
      <div className="font-Poppins">
        {/* Hero Section - Full viewport height */}
        <section className="relative">
          <Hero />
        </section>

        {/* Statistics Section */}
        <section className="py-12 md:py-16 lg:py-20 bg-white dark:bg-gray-800 dark:text-gray-100">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <HomeStats />
          </div>
        </section>

        {/* Logo Slider Section */}
        <section className="py-8 md:py-12 bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <LogoSlider />
          </div>
        </section>

        {/* Job Seekers Section */}
        <section className="py-12 md:py-16 lg:py-20 bg-white dark:bg-gray-800 dark:text-gray-100">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <JobSeekers />
          </div>
        </section>

        {/* Recruiters Section */}
        <section className="py-12 md:py-16 lg:py-20 bg-blue-50 dark:bg-gray-900 dark:text-gray-100">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <HomeRecruiters />
          </div>
        </section>

        {/* Footer Section */}
        <footer className="bg-gray-900 text-white dark:bg-gray-950 dark:text-gray-100">
          <Footer />
        </footer>
      </div>
    </div>
  );
}

export default Home;