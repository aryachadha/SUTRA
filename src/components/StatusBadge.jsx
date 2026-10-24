import React from 'react';

export function StatusBadge({ status, type = 'status' }) {
  if (!status) return null;

  const normalized = status.toUpperCase();

  const configs = {
    // Project & general status
    PROPOSED: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', label: 'Proposed' },
    PLANNED: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'Planned' },
    IN_PROGRESS: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'In Progress' },
    ON_HOLD: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', label: 'On Hold' },
    COMPLETED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Completed' },

    // Priority
    LOW: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200', label: 'Low' },
    MEDIUM: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'Medium' },
    HIGH: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', label: 'High' },
    CRITICAL: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-300 font-semibold', label: 'Critical' },

    // Conflict Status
    DETECTED: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-300', label: 'Conflict Detected' },
    UNDER_REVIEW: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-300', label: 'Under Review' },
    RESOLVED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-300', label: 'Resolved' },
    DISMISSED: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', label: 'Dismissed' },

    // Resource Availability
    AVAILABLE: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Available' },
    IN_USE: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'In Use' },
    MAINTENANCE: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', label: 'Maintenance' },

    // Request Status
    PENDING: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Pending Review' },
    APPROVED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Approved' },
    REJECTED: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', label: 'Rejected' },
    CANCELLED: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', label: 'Cancelled' },
  };

  const config = configs[normalized] || {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    label: status,
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}
    >
      {config.label}
    </span>
  );
}
