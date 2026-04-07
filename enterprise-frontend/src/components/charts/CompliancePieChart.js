import React from 'react';
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import ChartCard from './ChartCard';

const COLORS = ['#16a34a', '#f59e0b', '#dc2626'];

export default function CompliancePieChart({ data, onClickSegment }) {
  return (
    <ChartCard
      title="Compliance Distribution"
      subtitle="Click to drill-down patients"
      height={320}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            innerRadius={70}
            outerRadius={105}
            paddingAngle={3}
            onClick={(entry) => {
              if (onClickSegment) {
                onClickSegment(entry.payload);
              }
            }}
          >
            {data.map((entry, index) => (
              <Cell key={entry.label} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>

          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}