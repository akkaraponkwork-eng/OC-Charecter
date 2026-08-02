'use client';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface Props {
  stats: Record<string, number | { value: number; breakLimit?: boolean }>;
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
  const data = Object.entries(stats).map(([key, val]) => {
    const isObj = typeof val === 'object' && val !== null;
    const actualValue = isObj ? (val as any).value : val;
    const isBreak = isObj ? (val as any).breakLimit : false;
    
    return { 
      subject: key, 
      value: isBreak ? 130 : actualValue, 
      displayValue: actualValue,
      fullMark: 100 
    };
  });

  if (data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={size}>
      <RadarChart data={data}>
        <PolarGrid stroke="rgba(255,255,255,0.1)" />
        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
        <Radar
          name="Stats"
          dataKey="value"
          stroke={color}
          fill={color}
          fillOpacity={0.3}
          strokeWidth={2}
        />
        <PolarAngleAxis
          dataKey="subject"
          tick={<CustomTick />}
        />
        <Tooltip
          contentStyle={{
            background: '#13131a', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8, color: '#f1f5f9', fontSize: 12,
          }}
          formatter={(val: any, name: any, props: any) => [`${props.payload.displayValue}`, '']}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
