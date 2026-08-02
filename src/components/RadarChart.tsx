'use client';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface Props {
  stats: Record<string, number | { value: number; breakLimit?: boolean }>;
  size?: number;
  color?: string;
}

const CustomTick = ({ payload, x, y, textAnchor, opacity = 1 }: any) => {
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
    <g opacity={opacity}>
      <text x={x} y={y} textAnchor={textAnchor} fill="#f1f5f9" fontSize={11} fontWeight={600}>
        {lines.map((line: string, index: number) => (
          <tspan x={x} dy={index === 0 ? 0 : 14} key={`text-${index}`}>
            {line}
          </tspan>
        ))}
      </text>
    </g>
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
    <div style={{ position: 'relative', width: '100%', height: size }}>
      {/* Background layer: Grid, Polygon, Tooltip */}
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="78%" data={data}>
          <PolarGrid stroke="rgba(255,255,255,0.1)" />
          <PolarRadiusAxis angle={30} domain={[0, 130]} ticks={[20, 40, 60, 80, 100]} tick={false} axisLine={false} />
          <PolarAngleAxis
            dataKey="subject"
            tick={<CustomTick opacity={0} />}
          />
          <Radar
            name="Stats"
            dataKey="value"
            stroke="none"
            fill={color}
            fillOpacity={0.6}
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

      {/* Foreground layer: Labels only (so they sit on top of the polygon) */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="60%" data={data}>
            <PolarRadiusAxis angle={30} domain={[0, 100]} ticks={[20, 40, 60, 80, 100]} tick={false} axisLine={false} />
            <PolarAngleAxis
              dataKey="subject"
              tick={<CustomTick opacity={1} />}
            />
            <Radar
              name="Stats"
              dataKey="value"
              stroke="transparent"
              fill="transparent"
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
