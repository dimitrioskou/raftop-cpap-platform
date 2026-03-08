import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import DoctorLogin from "./pages/DoctorLogin";
import DoctorDashboard from "./pages/DoctorDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLogin from "./pages/AdminLogin";
import PatientDetail from "./pages/PatientDetail";
import AdminBillingDashboard from "./pages/AdminBillingDashboard";
import PatientPortal from "./pages/PatientPortal"
import PatientLogin from "./pages/PatientLogin"
import ClinicalAnalytics from "./pages/ClinicalAnalytics"
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/doctor-login" element={<DoctorLogin />} />
        <Route path="/doctor" element={<DoctorDashboard />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin-billing" element={<AdminBillingDashboard />} />
        <Route path="/patient/:id" element={<PatientDetail />} />
        <Route path="/patient" element={<PatientPortal />} />
        <Route path="/patient-login" element={<PatientLogin />} />
        <Route path="/clinical" element={<ClinicalAnalytics />} />
      </Routes>
    </Router>
  );
}

export default App;