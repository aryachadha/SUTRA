import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, MapPin, LogOut, User, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function TopBar({ onGlobalSearch }) {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      if (onGlobalSearch) {
        onGlobalSearch(searchTerm.trim());
      } else {
        navigate(`/projects?search=${encodeURIComponent(searchTerm.trim())}`);
      }
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between z-20 shrink-0">
      {/* Global Search Bar */}
      <form onSubmit={handleSearchSubmit} className="relative w-80 max-w-sm">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search projects, departments, locations..."
          className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-700 placeholder:text-slate-400"
        />
      </form>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* City Selector Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 border border-slate-200/80">
          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
          <span>Jaipur, Rajasthan</span>
        </div>

        {/* Conflict Notifications Button */}
        <button
          onClick={() => navigate('/map')}
          title="View Active Project Conflicts"
          className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
        </button>

        <div className="h-6 w-px bg-slate-200" />

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-slate-100 transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-full bg-navy-900 text-white flex items-center justify-center font-bold text-xs shadow-sm">
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <div className="hidden md:block">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-900">{user?.name || 'Authorized Officer'}</span>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                    isAdmin ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {user?.role === 'ADMIN' ? 'Admin' : 'Dept'}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 truncate max-w-[140px]">
                {user?.designation || user?.department?.name || user?.email}
              </p>
            </div>
          </button>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200/80 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-800">{user?.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                {user?.department && (
                  <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                    {user.department.name}
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  navigate('/settings');
                }}
                className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <Shield className="w-3.5 h-3.5 text-slate-400" />
                <span>Account & Configuration</span>
              </button>
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  logout();
                }}
                className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-500" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
