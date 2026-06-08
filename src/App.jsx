import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import PortalSelection from "./pages/PortalSelection";
import RecruiterLogin from "./pages/RecruiterLogin";
import CandidateLogin from "./pages/CandidateLogin";
import RecruiterLayout from "./components/layout/RecruiterLayout";
import Dashboard from "./pages/recruiter/Dashboard";
import CandidateDatabase from "./pages/recruiter/CandidateDatabase";
import CandidateProfile from "./pages/recruiter/CandidateProfile";
import Analytics from "./pages/recruiter/Analytics";
import ResumeUpload from "./pages/candidate/ResumeUpload";
import ProfileReview from "./pages/candidate/ProfileReview";

function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#111827",
            color: "#F9FAFB",
            fontSize: "13.5px",
            fontFamily: "Inter, sans-serif",
            borderRadius: "10px",
            padding: "12px 16px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
          },
          success: { iconTheme: { primary: "#16A34A", secondary: "#fff" } },
          error: { iconTheme: { primary: "#DC2626", secondary: "#fff" } },
        }}
      />
      <Routes>
        {/* Entry */}
        <Route path="/" element={<PortalSelection />} />

        {/* Auth */}
        <Route path="/login/recruiter" element={<RecruiterLogin />} />
        <Route path="/login/candidate" element={<CandidateLogin />} />

        {/* Recruiter Portal */}
        <Route path="/recruiter" element={<RecruiterLayout />}>
          <Route index element={<Navigate to="/recruiter/dashboard" replace />} />
          <Route path="dashboard"  element={<Dashboard />} />
          <Route path="candidates" element={<CandidateDatabase />} />
          <Route path="candidates/:id" element={<CandidateProfile />} />
          <Route path="analytics"  element={<Analytics />} />
        </Route>

        {/* Candidate Portal */}
        <Route path="/candidate/upload"  element={<ResumeUpload />} />
        <Route path="/candidate/profile" element={<ProfileReview />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;