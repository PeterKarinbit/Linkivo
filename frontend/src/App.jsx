import { Navigate, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import AllRoutes from "./Routes/AllRoutes";
import useUpdateUserData from "./hooks/useUpdateUserData";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { DarkModeProvider } from "./context/DarkModeContext";
import { ResumeProvider } from "./context/ResumeContext";

function App() {
  const { status, userData } = useSelector((store) => store.auth);

  const location = useLocation();
  const hideOnRoutes = ["/login", "/signup"];
  const updateUser = useUpdateUserData();

  useEffect(() => {
    // Avoid calling updateUser on public auth pages to prevent unnecessary
    // network requests that could block initial render when the backend is
    // unavailable or the user is not logged in yet.
    if (!hideOnRoutes.includes(location.pathname)) {
      updateUser();
    }
  }, [location.pathname]);

  return (
    <ResumeProvider>
      <DarkModeProvider>
        <div className="font-Poppins pt-20">
          {!(
            location.pathname.startsWith("/dashboard") ||
            hideOnRoutes.includes(location.pathname)
          ) && <Navbar />}
          <AllRoutes />
        </div>
      </DarkModeProvider>
    </ResumeProvider>
  );
}

export default App;
