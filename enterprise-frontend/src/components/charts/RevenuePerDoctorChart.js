import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import ChartCard from './ChartCard';

export default function RevenuePerDoctorChart({ data }) {
  return (
    <ChartCard title="Revenue per Doctor" subtitle="Top performing doctors">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <XAxis dataKey="doctor" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="revenue" fill="#16a34a" />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}