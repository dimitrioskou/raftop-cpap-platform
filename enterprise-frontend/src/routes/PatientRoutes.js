import React from 'react';
import { Route } from 'react-router-dom';

import PatientDashboardPage from '../pages/patient/PatientDashboardPage';
import PatientTherapyPage from '../pages/patient/PatientTherapyPage';
import PatientNightlyAnalysisPage from '../pages/patient/PatientNightlyAnalysisPage';
import PatientNightComparePage from '../pages/patient/PatientNightComparePage';

export default function PatientRoutes() {
  return (
    <>
      <Route path="/patient/dashboard" element={<PatientDashboardPage />} />
      <Route path="/patient/therapy" element={<PatientTherapyPage />} />
      <Route path="/patient/nightly-analysis" element={<PatientNightlyAnalysisPage />} />
      <Route path="/patient/night-compare" element={<PatientNightComparePage />} />
    </>
  );
}