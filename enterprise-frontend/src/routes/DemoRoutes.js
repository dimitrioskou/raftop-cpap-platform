import React from 'react';
import { Route } from 'react-router-dom';

import ClientDemoStartPage from '../pages/ClientDemoStartPage';

export default function DemoRoutes() {
  return (
    <>
      <Route path="/demo/raftopoulos/start" element={<ClientDemoStartPage mode="snapshot" />} />
      <Route path="/demo/raftopoulos/pilot" element={<ClientDemoStartPage mode="pilot" />} />
      <Route path="/demo/raftopoulos/decision-room" element={<ClientDemoStartPage mode="decision-room" />} />
    </>
  );
}