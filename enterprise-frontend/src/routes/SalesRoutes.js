import React from 'react';
import { Route } from 'react-router-dom';

import RaftopoulosSalesSnapshotPage from '../pages/RaftopoulosSalesSnapshotPage';
import RaftopoulosPilotProposalPage from '../pages/RaftopoulosPilotProposalPage';
import RaftopoulosDecisionRoomPage from '../pages/RaftopoulosDecisionRoomPage';
import RaftopoulosObjectionHandlingPage from '../pages/RaftopoulosObjectionHandlingPage';
import RaftopoulosPilotSuccessCriteriaPage from '../pages/RaftopoulosPilotSuccessCriteriaPage';
import RaftopoulosPilotOperatingPlaybookPage from '../pages/RaftopoulosPilotOperatingPlaybookPage';
import RaftopoulosRolloutRoadmapPage from '../pages/RaftopoulosRolloutRoadmapPage';
import RaftopoulosClientPresentationFlowPage from '../pages/RaftopoulosClientPresentationFlowPage';
import RaftopoulosFinalClientDemoScriptPage from '../pages/RaftopoulosFinalClientDemoScriptPage';
import RaftopoulosPilotApprovalDecisionPage from '../pages/RaftopoulosPilotApprovalDecisionPage';
import RaftopoulosExecutivePilotClosePage from '../pages/RaftopoulosExecutivePilotClosePage';
import RaftopoulosExecutiveLeaveBehindPage from '../pages/RaftopoulosExecutiveLeaveBehindPage';
import RaftopoulosExecutiveDemoScriptPage from '../pages/RaftopoulosExecutiveDemoScriptPage';
import RaftopoulosPilotWalkthroughScenarioPage from '../pages/RaftopoulosPilotWalkthroughScenarioPage';
import RaftopoulosExecutiveDemoHomePage from '../pages/RaftopoulosExecutiveDemoHomePage';

export default function SalesRoutes() {
  return (
    <>
      <Route path="/sales/raftopoulos/executive-demo-home" element={<RaftopoulosExecutiveDemoHomePage />} />
      <Route path="/sales/raftopoulos/executive-demo-script" element={<RaftopoulosExecutiveDemoScriptPage />} />
      <Route path="/sales/raftopoulos/pilot-walkthrough" element={<RaftopoulosPilotWalkthroughScenarioPage />} />
      <Route path="/sales/raftopoulos" element={<RaftopoulosSalesSnapshotPage />} />
      <Route path="/sales/raftopoulos/pilot" element={<RaftopoulosPilotProposalPage />} />
      <Route path="/sales/raftopoulos/decision-room" element={<RaftopoulosDecisionRoomPage />} />
      <Route path="/sales/raftopoulos/objections" element={<RaftopoulosObjectionHandlingPage />} />
      <Route path="/sales/raftopoulos/pilot-success" element={<RaftopoulosPilotSuccessCriteriaPage />} />
      <Route path="/sales/raftopoulos/pilot-playbook" element={<RaftopoulosPilotOperatingPlaybookPage />} />
      <Route path="/sales/raftopoulos/rollout-roadmap" element={<RaftopoulosRolloutRoadmapPage />} />
      <Route path="/sales/raftopoulos/presentation-flow" element={<RaftopoulosClientPresentationFlowPage />} />
      <Route path="/sales/raftopoulos/final-demo-script" element={<RaftopoulosFinalClientDemoScriptPage />} />
      <Route path="/sales/raftopoulos/pilot-approval-decision" element={<RaftopoulosPilotApprovalDecisionPage />} />
      <Route path="/sales/raftopoulos/executive-pilot-close" element={<RaftopoulosExecutivePilotClosePage />} />
      <Route path="/sales/raftopoulos/executive-leave-behind" element={<RaftopoulosExecutiveLeaveBehindPage />} />
    </>
  );
}