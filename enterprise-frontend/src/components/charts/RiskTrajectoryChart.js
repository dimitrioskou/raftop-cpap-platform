import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import ChartCard from './ChartCard';

export default function RiskTrajectoryChart({ data }) {
  return (
    <ChartCard title="Risk Score Trajectory" subtitle="AI compliance prediction over time">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="risk" stroke="#dc2626" strokeWidth={3} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}