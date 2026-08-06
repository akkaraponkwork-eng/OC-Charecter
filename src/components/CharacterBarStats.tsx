'use client';
import { BarChart2 } from 'lucide-react';

interface Stat {
  label: string;
  value: number;
  breakLimit: boolean;
}

interface CharacterBarStatsProps {
  stats: Stat[];
  color?: string;
  title?: string;
}

export default function CharacterBarStats({ stats, color = '#0ea5e9', title = 'Parameter Stats' }: CharacterBarStatsProps) {
  if (!stats || stats.length === 0) return null;

  return (
    <div className="glass" style={{ padding: '1.5rem' }}>
      <h2 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '1rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <BarChart2 size={16} /> {title}
      </h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {stats.map((stat, idx) => {
          // In breakLimit mode, value can be over 100, but we cap visual width at 100%
          const widthPercent = stat.breakLimit ? Math.min(stat.value, 100) : stat.value;
          const displayValue = stat.value;
          
          return (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{stat.label || 'Unknown'}</span>
                <span style={{ fontWeight: 700, color: stat.breakLimit && stat.value > 100 ? '#ec4899' : color }}>
                  {displayValue}
                </span>
              </div>
              <div style={{ width: '100%', height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 99, overflow: 'hidden' }}>
                <div 
                  style={{ 
                    width: `${widthPercent}%`, 
                    height: '100%', 
                    background: stat.breakLimit && stat.value > 100 ? 'linear-gradient(90deg, #ec4899, #8b5cf6)' : color,
                    borderRadius: 99,
                    transition: 'width 1s ease-out'
                  }} 
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
