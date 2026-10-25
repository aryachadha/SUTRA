import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, ArrowRight, UserCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Initial bootstrap admin modal toggle
  const [showBootstrap, setShowBootstrap] = useState(false);
  const [bootstrapData, setBootstrapData] = useState({
    name: 'Administrator',
    email: 'admin@jaipur.sutra.gov.in',
    password: 'Admin@Sutra2026',
    designation: 'Chief Municipal Coordinator',
  });
  const [bootstrapSuccess, setBootstrapSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setErrorMsg(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (userEmail, userPassword) => {
    setEmail(userEmail);
    setPassword(userPassword);
    setErrorMsg(null);
  };

  const handleBootstrapSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      await api.auth.bootstrapAdmin(bootstrapData);
      setBootstrapSuccess('Administrator created successfully! You can now log in.');
      setShowBootstrap(false);
      setEmail(bootstrapData.email);
      setPassword(bootstrapData.password);
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-950 via-navy-900 to-slate-900 flex items-center justify-center p-6 text-slate-800">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-600 to-emerald-400 text-white flex items-center justify-center font-extrabold text-3xl shadow-xl shadow-emerald-950/50">
            S
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-wider">SUTRA</h1>
          <p className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">
            Smart Urban Taskforce & Resource Alliance
          </p>
          <p className="text-xs text-slate-400">
            Jaipur Municipal Infrastructure Coordination Platform
          </p>
        </div>

        {/* Login Box */}
        <div className="bg-white rounded-3xl p-8 shadow-2xl border border-slate-200/80 space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">Official Portal Login</h2>
            <p className="text-xs text-slate-500">Enter authorized government or utility credentials</p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 text-rose-700 rounded-xl border border-rose-200 text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {bootstrapSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-xs font-medium">
              {bootstrapSuccess}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Official Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="officer@department.gov.in"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Account Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to SUTRA'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credentials Assistant */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Quick Demo Fill (Jaipur Synthetic Dataset):
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => handleQuickFill('admin@jaipur.sutra.gov.in', 'Admin@Sutra2026')}
                className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-left border border-slate-200 transition-colors"
              >
                <strong className="text-slate-800 block">Administrator</strong>
                <span className="text-slate-500 text-[10px]">Chief Coordinator</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('engineer.pwd@jaipur.sutra.gov.in', 'User@Sutra2026')}
                className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-left border border-slate-200 transition-colors"
              >
                <strong className="text-slate-800 block">PWD Engineer</strong>
                <span className="text-slate-500 text-[10px]">Roads Division</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('engineer.phed@jaipur.sutra.gov.in', 'User@Sutra2026')}
                className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-left border border-slate-200 transition-colors"
              >
                <strong className="text-slate-800 block">PHED Engineer</strong>
                <span className="text-slate-500 text-[10px]">Water Trunk Line</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('officer.gas@jaipur.sutra.gov.in', 'User@Sutra2026')}
                className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-left border border-slate-200 transition-colors"
              >
                <strong className="text-slate-800 block">RSGL Gas Lead</strong>
                <span className="text-slate-500 text-[10px]">City Gas Grid</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-slate-400">
          Smart Urban Taskforce & Resource Alliance • MoHUA Standard Architecture
        </p>
      </div>
    </div>
  );
}
