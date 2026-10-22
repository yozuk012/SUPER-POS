'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const formatIDR = (value) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0);
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border-2 border-blue-300 rounded-lg shadow-xl shadow-blue-200/50 text-sm">
        <p className="font-bold text-blue-800 mb-2">{label}</p>
        {payload.map((pld, index) => (
          <p key={index} style={{ color: pld.color }} className="flex justify-between gap-4 mb-1 last:mb-0 font-medium">
            <span>{pld.name}:</span>
            <span className="font-bold">{formatIDR(pld.value)}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function MonthlyPerformanceChart({ data, title = 'Performa Keuangan' }) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-white via-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200 shadow-sm mb-6">
      {/* Accent bar atas */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400" />

      <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
        <span className="w-1.5 h-5 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full" />
        {title}
      </h2>
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#bfdbfe" />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#1e40af', fontSize: 12, fontWeight: 600 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#1e40af', fontSize: 12, fontWeight: 600 }} tickFormatter={(value) => `Rp ${(value / 1000000).toFixed(1)}jt`} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#dbeafe' }} />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px', fontWeight: 600 }} />
            <Bar dataKey="sales" name="Penjualan" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={30} />
            <Bar dataKey="expenses" name="Pengeluaran" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={30} />
            <Bar dataKey="profit" name="Laba Bersih" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}