import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import styles from './AdminDashboard.module.css';

interface AdminChartsProps {
  members: any[];
  events: any[];
}

const COLORS = ['#8B1A1A', '#C8956C', '#2D5F8B', '#4A7C59', '#7B5EA7'];

export function MemberGrowthChart({ members }: { members: any[] }) {
  const data = useMemo(() => {
    // Generate mock last 6 months data combined with actual members 
    const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
    let baseCount = Math.max(members.length - 30, 0);
    return months.map((month, i) => {
      baseCount += Math.floor(Math.random() * 8) + 2;
      return {
        name: month,
        members: i === months.length - 1 ? members.length : baseCount,
      };
    });
  }, [members]);

  return (
    <div style={{ height: 300, width: '100%', marginTop: '1rem' }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorMembers" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8B1A1A" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#8B1A1A" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
          />
          <Area type="monotone" dataKey="members" stroke="#8B1A1A" strokeWidth={3} fillOpacity={1} fill="url(#colorMembers)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function OverviewRingChart({ active, pending }: { active: number, pending: number }) {
  const data = [
    { name: 'Active', value: active },
    { name: 'Pending', value: pending },
  ];

  return (
    <div style={{ height: 200, width: '100%', position: 'relative' }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={index === 0 ? '#16a34a' : '#f1f5f9'} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
        </PieChart>
      </ResponsiveContainer>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>{Math.round((active / (active + pending || 1)) * 100)}%</div>
        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Verified</div>
      </div>
    </div>
  );
}

export function EventParticipationChart({ events }: { events: any[] }) {
  const data = useMemo(() => {
    return [
      { name: 'Gala', attendees: 120 },
      { name: 'Meetup', attendees: 80 },
      { name: 'Workshop', attendees: 45 },
      { name: 'Festival', attendees: 250 },
    ].slice(0, Math.max(events.length, 3));
  }, [events]);

  return (
    <div style={{ height: 300, width: '100%', marginTop: '1rem' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={32}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
          <Tooltip 
            cursor={{ fill: '#f8fafc' }}
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
          />
          <Bar dataKey="attendees" fill="#2D5F8B" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
