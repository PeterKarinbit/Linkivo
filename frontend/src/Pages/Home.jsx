import { useEffect } from "react";

function Home() {
  useEffect(() => {
    // Redirect to the static landing page
    window.location.href = "/landing.html";
  }, []);

  // Show a brief loading state while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-white text-lg">Loading...</div>
    </div>
  );
}

export default Home;