import React, { createContext, useContext, useState } from "react";

const ResumeContext = createContext();

export function ResumeProvider({ children }) {
  const [resumeStatus, setResumeStatus] = useState("missing"); // "missing" or "uploaded"
  return (
    <ResumeContext.Provider value={{ resumeStatus, setResumeStatus }}>
      {children}
    </ResumeContext.Provider>
  );
}

export function useResume() {
  return useContext(ResumeContext);
}
