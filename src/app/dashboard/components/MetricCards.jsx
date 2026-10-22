'use client';

import { FiTrendingUp, FiTrendingDown, FiDollarSign, FiShoppingBag } from 'react-icons/fi';

const formatIDR = (value) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0);
};

export default function MetricCards({ metrics }) {
  const cards = [
    {
      title: 'Total Penjualan',
      value: metrics.totalPenjualan,
      icon: <FiShoppingBag size={20} />,
      iconColor: 'text-blue-700',
      iconBg: 'bg-blue-200',
      accent: 'from-blue-500 to-blue-400',
      gradient: 'from-white to-blue-100',
      border: 'border-blue-200',
    },
    {
      title: 'Total Pengeluaran',
      value: metrics.totalPengeluaran,
      icon: <FiTrendingDown size={20} />,
      iconColor: 'text-red-600',
      iconBg: 'bg-red-100',
      accent: 'from-red-500 to-red-400',
      gradient: 'from-white to-red-50',
      border: 'border-red-200',
    },
    {
      title: 'Laba Kotor',
      value: metrics.labaKotor,
      icon: <FiDollarSign size={20} />,
      iconColor: 'text-blue-700',
      iconBg: 'bg-blue-200',
      accent: 'from-blue-600 to-blue-500',
      gradient: 'from-white to-blue-100',
      border: 'border-blue-200',
    },
    {
      title: 'Laba Bersih',
      value: metrics.labaBersih,
      icon: <FiTrendingUp size={20} />,
      iconColor: 'text-emerald-700',
      iconBg: 'bg-emerald-100',
      accent: 'from-emerald-500 to-emerald-400',
      gradient: 'from-white to-emerald-50',
      border: 'border-emerald-200',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, index) => (
        <div
          key={index}
          className={`relative overflow-hidden bg-gradient-to-br ${card.gradient} p-5 rounded-xl border ${card.border} shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200`}
        >
          {/* Top accent bar */}
          <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.accent}`} />

          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-700 text-sm font-semibold">{card.title}</span>
            <div className={`p-2 rounded-lg ${card.iconBg} ${card.iconColor}`}>
              {card.icon}
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900">{formatIDR(card.value)}</h3>
        </div>
      ))}
    </div>
  );
}