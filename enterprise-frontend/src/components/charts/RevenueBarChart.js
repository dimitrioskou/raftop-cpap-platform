import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import ChartCard from './ChartCard';

export default function RevenueBarChart({ data, title = 'Revenue Analytics', subtitle = 'Current and projected value' }) {
  return (
    <ChartCard title={title} subtitle={subtitle} height={320}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <YAxis />
          <Tooltip formatter={(value) => `€${value}`} />
          <Legend />
          <Bar dataKey="value" name="Revenue" fill="#16a34a" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}