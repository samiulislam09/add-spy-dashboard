"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const palette = ["#0e7490", "#155e75", "#0f766e", "#1d4ed8", "#0f766e", "#164e63"];

export function SparkLineChart({
  data,
  xKey,
  yKey,
}: {
  data: Array<Record<string, string | number>>;
  xKey: string;
  yKey: string;
}) {
  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#bae6fd" />
          <XAxis dataKey={xKey} tick={{ fill: "#0e7490", fontSize: 12 }} />
          <YAxis tick={{ fill: "#0e7490", fontSize: 12 }} />
          <Tooltip />
          <Line type="monotone" dataKey={yKey} stroke="#0e7490" strokeWidth={2.25} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DistributionBarChart({
  data,
  xKey,
  yKey,
}: {
  data: Array<Record<string, string | number>>;
  xKey: string;
  yKey: string;
}) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#bae6fd" vertical={false} />
          <XAxis dataKey={xKey} tick={{ fill: "#0e7490", fontSize: 12 }} />
          <YAxis tick={{ fill: "#0e7490", fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey={yKey} radius={[10, 10, 0, 0]} fill="#155e75" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DistributionDonutChart({
  data,
  nameKey,
  valueKey,
}: {
  data: Array<Record<string, string | number>>;
  nameKey: string;
  valueKey: string;
}) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey={valueKey} nameKey={nameKey} innerRadius={52} outerRadius={82} paddingAngle={3}>
            {data.map((_, index) => (
              <Cell key={`slice-${index}`} fill={palette[index % palette.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
