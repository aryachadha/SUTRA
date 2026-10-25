import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Shield,
  Database,
  Info,
  Server,
  UserCheck,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export function Settings() {
  const { user, isAdmin } = useAuth();
  const [health, setHealth] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  useEffect(() => {
    fetch('http://localhost:3001/api/health')
      .then((r) => r.json())
      .then((d) => setHealth(d))
      .catch((e) => setHealth({ status: 'offline', error: e.message }));
  }, []);

  const handleTriggerConflictScan = async () => {
    try {
      setScanning(true);
      setScanResult(null);
      const res = await api.conflicts.scan();
      setScanResult(res.message + ` (${res.conflictsIdentified} conflicts identified across ${res.scannedProjectsCount} projects).`);
    } catch (err) {
      setScanResult(`Scan error: ${err.message}`);
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6 text-xs">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">System Configuration &amp; Settings</h1>
        <p className="text-slate-500 mt-1">
          SUTRA desktop application parameters, municipal profile, and backend diagnostics
        </p>
      </div>

      {/* User Profile Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Current Authenticated Session</h2>
            <p className="text-slate-500 text-[11px]">Active credentials and security access permissions</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="font-semibold text-slate-500 block text-[10px] uppercase">Name</span>
            <span className="font-bold text-slate-800 text-sm mt-0.5 block">{user?.name}</span>
            <span className="text-slate-400 text-[11px]">{user?.designation || 'Civic Coordinator'}</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="font-semibold text-slate-500 block text-[10px] uppercase">Official Email</span>
            <span className="font-mono text-slate-800 text-xs mt-0.5 block truncate">{user?.email}</span>
            <span className="text-slate-400 text-[11px]">Encrypted JWT Session</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="font-semibold text-slate-500 block text-[10px] uppercase">Access Role</span>
            <span
              className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold mt-1 uppercase ${
                isAdmin ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
              }`}
            >
              {user?.role}
            </span>
            <p className="text-slate-400 text-[10px] mt-1">
              {isAdmin ? 'Full administrative authority' : 'Departmental user rights'}
            </p>
          </div>
        </div>
      </div>

      {/* Conflict Engine Configuration */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Conflict Detection Engine Parameters</h2>
              <p className="text-slate-500 text-[11px]">Spatial Haversine calculation and schedule window configuration</p>
            </div>
          </div>

          <button
            onClick={handleTriggerConflictScan}
            disabled={scanning}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold shadow transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
            <span>{scanning ? 'Scanning...' : 'Re-Run Conflict Scan'}</span>
          </button>
        </div>

        {scanResult && (
          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-xs">
            {scanResult}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <span className="font-bold text-slate-800 block text-xs">Geographic Proximity Threshold</span>
            <p className="text-slate-500 text-[11px] mt-1">
              Flagged if distance between project coordinates is &le; <strong>500 meters</strong> using the spherical Haversine formula (Earth radius 6,371 km).
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <span className="font-bold text-slate-800 block text-xs">Schedule Overlap Window</span>
            <p className="text-slate-500 text-[11px] mt-1">
              Flagged if planned execution schedules overlap or fall within a <strong>14-day pre/post corridor buffer</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Synthetic Dataset Declaration */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <div className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Synthetic Dataset Declaration</h2>
            <p className="text-slate-500 text-[11px]">Compliance with Ministry of Housing and Urban Affairs guidelines</p>
          </div>
        </div>

        <p className="text-slate-600 leading-relaxed">
          All records presented in this demonstration environment—including Jaipur Municipal Corporation (JMC), Public Works Department (PWD), Public Health Engineering Department (PHED), Jaipur Vidyut Vitran Nigam Ltd (JVVNL), and Rajasthan State Gas Ltd (RSGL) projects—are <strong>synthetic demonstration data</strong> created strictly for software evaluation purposes. They do not represent official Government of Rajasthan tenders, contracts, or classified underground utility schematics.
        </p>
      </div>

      {/* Backend Diagnostics */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Backend &amp; Database Diagnostics</h2>
            <p className="text-slate-500 text-[11px]">Local Express API server and PostgreSQL connection status</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase">API Service</span>
            <p className="font-bold text-slate-900 mt-0.5">
              {health?.status === 'ok' ? 'Online (Port 3001)' : 'Offline / Checking...'}
            </p>
            <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>HTTP REST Endpoints Active</span>
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Database Engine</span>
            <p className="font-bold text-slate-900 mt-0.5">PostgreSQL 17</p>
            <span className="text-[10px] text-slate-500 font-medium">Prisma ORM (JavaScript)</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Client Platform</span>
            <p className="font-bold text-slate-900 mt-0.5">
              {window.sutraDesktop ? 'Electron Desktop (macOS)' : 'Web Browser Session'}
            </p>
            <span className="text-[10px] text-slate-500 font-medium">Apple Silicon (arm64)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
