import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  FolderGit2,
  MapPin,
  Wrench,
  MessagesSquare,
  Settings,
  ShieldAlert,
} from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/departments', label: 'Departments', icon: Building2 },
  { path: '/projects', label: 'Projects', icon: FolderGit2 },
  { path: '/map', label: 'Project Map', icon: MapPin },
  { path: '/resources', label: 'Resources', icon: Wrench },
  { path: '/discussions', label: 'Discussion Forum', icon: MessagesSquare },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  return (
    <aside className="w-64 bg-navy-950 text-slate-300 flex flex-col shrink-0 border-r border-navy-850 select-none">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center gap-3 border-b border-navy-900 bg-navy-950">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white shadow-lg shadow-emerald-900/30 font-extrabold text-lg tracking-wider">
          S
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="font-extrabold text-base tracking-wider text-white">SUTRA</h1>
            <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold rounded border border-emerald-500/30">
              MVP
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium truncate max-w-[150px]">
            Smart Urban Taskforce
          </p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Core Modules
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-navy-900'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Municipal Context Footer */}
      <div className="p-4 border-t border-navy-900 bg-navy-950/70 text-xs">
        <div className="flex items-center gap-2 text-emerald-400 font-medium">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Jaipur Coordination Hub</span>
        </div>
        <p className="text-[11px] text-slate-400 mt-1">
          MoHUA Civic Alliance Standard
        </p>
      </div>
    </aside>
  );
}
