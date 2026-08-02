'use client';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface Props {
  stats: Record<string, number>;
  size?: number;
  color?: string;
}

const CustomTick = ({ payload, x, y, textAnchor }: any) => {
  let lines = [payload.value];
  if (typeof payload.value === 'string') {
    if (payload.value.includes('\n')) {
      lines = payload.value.split('\n');
    } else if (payload.value.includes(' (')) {
      const parts = payload.value.split(' (');
      lines = [parts[0], '(' + parts[1]];
    }
  }

  return (
    <text x={x} y={y} textAnchor={textAnchor} fill="#94a3b8" fontSize={11} fontWeight={500}>
      {lines.map((line: string, index: number) => (
        <tspan x={x} dy={index === 0 ? 0 : 14} key={index}>
          {line}
        </tspan>
      ))}
    </text>
  );
};

export default function CharacterRadarChart({ stats, size = 280, color = '#7c3aed' }: Props) {
  const data = Object.entries(stats).map(([key, value]) => ({ subject: key, value, fullMark: 100 }));
  if (data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={size}>
      <RadarChart data={data}>
        <PolarGrid stroke="rgba(255,255,255,0.1)" />
        <PolarAngleAxis
          dataKey="subject"
          tick={<CustomTick />}
        />
        <Radar
          name="Stats"
          dataKey="value"
          stroke={color}
          fill={color}
          fillOpacity={0.3}
          strokeWidth={2}
        />
        <Tooltip
          contentStyle={{
            background: '#13131a', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8, color: '#f1f5f9', fontSize: 12,
          }}
          formatter={(val: any) => [`${val}`, '']}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
