import React from 'react';

export function StatCard({ title, value, subtitle, icon: Icon, color = 'emerald', alert = false, onClick }) {
  const colorStyles = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    navy: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const badgeStyle = colorStyles[color] || colorStyles.emerald;

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm hover:shadow transition-all ${
        onClick ? 'cursor-pointer' : ''
      } ${alert ? 'ring-2 ring-rose-400/30' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">{value ?? '—'}</h3>
        </div>
        <div className={`p-3 rounded-xl border ${badgeStyle}`}>
          {Icon && <Icon className="w-5 h-5" />}
        </div>
      </div>
      {subtitle && (
        <p className={`text-xs mt-3 flex items-center font-medium ${alert ? 'text-rose-600' : 'text-slate-500'}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
