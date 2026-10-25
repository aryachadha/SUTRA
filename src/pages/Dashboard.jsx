import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  FolderGit2,
  Network,
  AlertTriangle,
  Clock,
  Plus,
  RefreshCw,
  ArrowRight,
  ShieldAlert,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';

export function Dashboard() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState(null);

  // Quick Action Modals
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showCreateDept, setShowCreateDept] = useState(false);

  // Form states
  const [departments, setDepartments] = useState([]);
  const [newProject, setNewProject] = useState({
    title: '',
    code: '',
    description: '',
    owningDepartmentId: '',
    locationName: '',
    latitude: 26.9124,
    longitude: 75.7873,
    startDate: '',
    endDate: '',
    responsibleOfficer: '',
    priority: 'MEDIUM',
    status: 'PLANNED',
    budget: '',
  });

  const [newDept, setNewDept] = useState({
    name: '',
    code: '',
    category: '',
    city: 'Jaipur',
    contactPerson: '',
    email: '',
    phone: '',
    description: '',
  });

  const [errorMsg, setErrorMsg] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await api.dashboard.getStats();
      setStats(data);
      const depts = await api.departments.getAll();
      setDepartments(depts);
      if (depts.length > 0 && !newProject.owningDepartmentId) {
        setNewProject((prev) => ({ ...prev, owningDepartmentId: depts[0].id }));
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRunScan = async () => {
    try {
      setScanning(true);
      setScanMessage(null);
      const res = await api.conflicts.scan();
      setScanMessage(`Scan finished: ${res.conflictsIdentified} potential conflicts evaluated.`);
      fetchDashboardData();
    } catch (err) {
      setScanMessage(`Scan error: ${err.message}`);
    } finally {
      setScanning(false);
    }
  };

  const handleCreateProjectSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      await api.projects.create(newProject);
      setShowCreateProject(false);
      setNewProject({
        title: '',
        code: '',
        description: '',
        owningDepartmentId: departments[0]?.id || '',
        locationName: '',
        latitude: 26.9124,
        longitude: 75.7873,
        startDate: '',
        endDate: '',
        responsibleOfficer: '',
        priority: 'MEDIUM',
        status: 'PLANNED',
        budget: '',
      });
      fetchDashboardData();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleCreateDeptSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      await api.departments.create(newDept);
      setShowCreateDept(false);
      setNewDept({
        name: '',
        code: '',
        category: '',
        city: 'Jaipur',
        contactPerson: '',
        email: '',
        phone: '',
        description: '',
      });
      fetchDashboardData();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
          <p className="text-sm font-semibold text-slate-600">Loading civic coordination metrics...</p>
        </div>
      </div>
    );
  }

  const { summary, statusDistribution, recentProjects, projectsRequiringAttention, upcomingMilestones } = stats || {};

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Synthetic Demonstration Dataset Banner */}
      <div className="bg-gradient-to-r from-navy-900 to-navy-950 text-white rounded-2xl p-6 shadow-md border border-navy-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Synthetic Demo Dataset
            </span>
            <span className="text-xs text-slate-400">Jaipur Smart Urban Corridor (Rajasthan)</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            Smart Urban Taskforce & Resource Alliance (SUTRA)
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Coordinating municipal excavations, road pavements, water distribution pipelines, and power utilities across Jaipur to prevent duplicated expenditures and infrastructure damage.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={() => setShowCreateProject(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Project</span>
          </button>
          {isAdmin && (
            <button
              onClick={() => setShowCreateDept(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-navy-800 hover:bg-navy-700 text-slate-200 rounded-xl text-xs font-semibold border border-navy-700 transition-all"
            >
              <Building2 className="w-4 h-4" />
              <span>Register Department</span>
            </button>
          )}
          <button
            onClick={handleRunScan}
            disabled={scanning}
            className="flex items-center gap-2 px-3.5 py-2 bg-navy-800 hover:bg-navy-700 text-slate-200 rounded-xl text-xs font-semibold border border-navy-700 transition-all disabled:opacity-50"
            title="Scan spatial & scheduling conflicts"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin text-emerald-400' : ''}`} />
            <span>{scanning ? 'Scanning...' : 'Detect Conflicts'}</span>
          </button>
        </div>
      </div>

      {scanMessage && (
        <div className="px-4 py-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs flex items-center justify-between">
          <span>{scanMessage}</span>
          <button onClick={() => setScanMessage(null)} className="text-emerald-700 font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        <StatCard
          title="Total Departments"
          value={summary?.totalDepartments}
          subtitle="Registered city agencies"
          icon={Building2}
          color="navy"
          onClick={() => navigate('/departments')}
        />
        <StatCard
          title="Active Projects"
          value={summary?.activeProjects}
          subtitle={`Out of ${summary?.totalProjects} total projects`}
          icon={FolderGit2}
          color="blue"
          onClick={() => navigate('/projects')}
        />
        <StatCard
          title="Interdepartmental"
          value={summary?.interdepartmentalProjects}
          subtitle="Multi-agency collaboration"
          icon={Network}
          color="emerald"
          onClick={() => navigate('/projects')}
        />
        <StatCard
          title="Coordination Issues"
          value={summary?.pendingConflicts}
          subtitle="Spatial/schedule overlaps"
          icon={AlertTriangle}
          color="rose"
          alert={summary?.pendingConflicts > 0}
          onClick={() => navigate('/map')}
        />
        <StatCard
          title="Upcoming Deadlines"
          value={summary?.upcomingDeadlines}
          subtitle="Targeting next 30 days"
          icon={Clock}
          color="amber"
          onClick={() => navigate('/projects')}
        />
      </div>

      {/* Two Column Layout: Attention Needed & Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projects Requiring Immediate Attention */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Projects Requiring Attention</h3>
                  <p className="text-xs text-slate-500">Detected spatial overlaps or critical priority tasks</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/map')}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                <span>Interactive Map</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {projectsRequiringAttention && projectsRequiringAttention.length > 0 ? (
                projectsRequiringAttention.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => navigate(`/projects/${p.id}`)}
                    className="py-3.5 flex items-center justify-between hover:bg-slate-50/80 px-2 rounded-xl transition-colors cursor-pointer group"
                  >
                    <div className="space-y-1 min-w-0 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-slate-500">{p.code}</span>
                        <StatusBadge status={p.priority} />
                        {p.conflictsCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                            {p.conflictsCount} Conflict{p.conflictsCount > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors truncate">
                        {p.title}
                      </h4>
                      <p className="text-xs text-slate-500 truncate">{p.location}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <StatusBadge status={p.status} />
                      <p className="text-[11px] text-slate-400 mt-1">
                        Due: {new Date(p.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-slate-400 text-sm">
                  No critical coordination conflicts detected at present.
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 text-right">
            <button
              onClick={() => navigate('/projects')}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 ml-auto"
            >
              <span>View all projects</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Project Status Distribution Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Project Status Overview</h3>
            <p className="text-xs text-slate-500 mt-0.5">Municipal infrastructure lifecycle stage</p>

            <div className="space-y-3.5 mt-6">
              {[
                { label: 'Proposed', key: 'PROPOSED', color: 'bg-purple-500' },
                { label: 'Planned', key: 'PLANNED', color: 'bg-blue-500' },
                { label: 'In Progress', key: 'IN_PROGRESS', color: 'bg-amber-500' },
                { label: 'On Hold', key: 'ON_HOLD', color: 'bg-rose-500' },
                { label: 'Completed', key: 'COMPLETED', color: 'bg-emerald-500' },
              ].map((item) => {
                const count = statusDistribution?.[item.key] || 0;
                const total = summary?.totalProjects || 1;
                const pct = Math.round((count / total) * 100);

                return (
                  <div key={item.key} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-slate-700">
                      <span>{item.label}</span>
                      <span className="font-bold">
                        {count} <span className="text-slate-400 font-normal">({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Info Box */}
          <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600">
            <span className="font-bold text-slate-800">Jaipur Urban Protocol:</span> Excavation permissions automatically flag within 500m radius of existing pipelines.
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Projects & Upcoming Milestones */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Projects Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Recent Projects</h3>
              <p className="text-xs text-slate-500">Latest recorded municipal and utility undertakings</p>
            </div>
            <button
              onClick={() => navigate('/projects')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              <span>Explore All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto mt-2">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-2">Project</th>
                  <th className="py-3 px-2">Department</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-2">Priority</th>
                  <th className="py-3 px-2">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentProjects && recentProjects.length > 0 ? (
                  recentProjects.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => navigate(`/projects/${p.id}`)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-2 max-w-[200px]">
                        <p className="font-semibold text-slate-900 truncate">{p.title}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{p.code}</p>
                      </td>
                      <td className="py-3 px-2 text-slate-600 max-w-[150px] truncate">
                        {p.department}
                      </td>
                      <td className="py-3 px-2">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="py-3 px-2">
                        <StatusBadge status={p.priority} />
                      </td>
                      <td className="py-3 px-2 w-24">
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${p.progress}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-mono text-slate-500">{p.progress}%</span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-6 text-center text-slate-400">
                      No project records available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Upcoming Milestones */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
            <Calendar className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="text-base font-bold text-slate-900">Upcoming Milestones</h3>
              <p className="text-xs text-slate-500">Scheduled project completion targets</p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 mt-3">
            {upcomingMilestones && upcomingMilestones.length > 0 ? (
              upcomingMilestones.map((m) => (
                <div key={m.id} className="py-3 space-y-1">
                  <div className="flex justify-between items-start text-xs">
                    <span className="font-semibold text-slate-900 max-w-[160px] truncate">
                      {m.title}
                    </span>
                    <span className="font-mono text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      {new Date(m.targetDate).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">{m.department}</p>
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-slate-400 text-xs">No upcoming milestones in 30 days.</p>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Create Project */}
      <Modal isOpen={showCreateProject} onClose={() => setShowCreateProject(false)} title="Create Infrastructure Project">
        <form onSubmit={handleCreateProjectSubmit} className="space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 text-rose-700 rounded-xl border border-rose-200 font-medium">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Project Code *</label>
              <input
                type="text"
                required
                placeholder="e.g. PWD-2026-004"
                value={newProject.code}
                onChange={(e) => setNewProject({ ...newProject, code: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Owning Department *</label>
              <select
                required
                value={newProject.owningDepartmentId}
                onChange={(e) => setNewProject({ ...newProject, owningDepartmentId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Project Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Tonk Road Drainage Channel Expansion"
              value={newProject.title}
              onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Location Name & Extent *</label>
            <input
              type="text"
              required
              placeholder="e.g. Tonk Road, Gopalpura Bypass to Gandhi Nagar"
              value={newProject.locationName}
              onChange={(e) => setNewProject({ ...newProject, locationName: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Latitude</label>
              <input
                type="number"
                step="any"
                value={newProject.latitude}
                onChange={(e) => setNewProject({ ...newProject, latitude: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Longitude</label>
              <input
                type="number"
                step="any"
                value={newProject.longitude}
                onChange={(e) => setNewProject({ ...newProject, longitude: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Start Date *</label>
              <input
                type="date"
                required
                value={newProject.startDate}
                onChange={(e) => setNewProject({ ...newProject, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">End Date *</label>
              <input
                type="date"
                required
                value={newProject.endDate}
                onChange={(e) => setNewProject({ ...newProject, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Responsible Officer *</label>
              <input
                type="text"
                required
                placeholder="e.g. Er. K. Sharma"
                value={newProject.responsibleOfficer}
                onChange={(e) => setNewProject({ ...newProject, responsibleOfficer: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Priority</label>
              <select
                value={newProject.priority}
                onChange={(e) => setNewProject({ ...newProject, priority: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={newProject.status}
                onChange={(e) => setNewProject({ ...newProject, status: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
              >
                <option value="PROPOSED">Proposed</option>
                <option value="PLANNED">Planned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Estimated Budget (₹ in Lakhs)</label>
            <input
              type="number"
              step="0.01"
              placeholder="e.g. 150.00"
              value={newProject.budget}
              onChange={(e) => setNewProject({ ...newProject, budget: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Scope & Description</label>
            <textarea
              rows="3"
              placeholder="Detail trenching depth, pavement restoration, or utility relocation requirements..."
              value={newProject.description}
              onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowCreateProject(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold shadow"
            >
              Save Project
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Register Department */}
      <Modal isOpen={showCreateDept} onClose={() => setShowCreateDept(false)} title="Register Municipal Department">
        <form onSubmit={handleCreateDeptSubmit} className="space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 text-rose-700 rounded-xl border border-rose-200 font-medium">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Department Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Jaipur Metro Rail Corporation"
                value={newDept.name}
                onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Short Code *</label>
              <input
                type="text"
                required
                placeholder="e.g. JMRC"
                value={newDept.code}
                onChange={(e) => setNewDept({ ...newDept, code: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Category *</label>
              <input
                type="text"
                required
                placeholder="e.g. Urban Mass Transit"
                value={newDept.category}
                onChange={(e) => setNewDept({ ...newDept, category: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">City</label>
              <input
                type="text"
                value={newDept.city}
                onChange={(e) => setNewDept({ ...newDept, city: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Contact Officer *</label>
              <input
                type="text"
                required
                placeholder="e.g. Chief Engineer"
                value={newDept.contactPerson}
                onChange={(e) => setNewDept({ ...newDept, contactPerson: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Official Email *</label>
              <input
                type="email"
                required
                placeholder="ce@jmrc.rajasthan.gov.in"
                value={newDept.email}
                onChange={(e) => setNewDept({ ...newDept, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                placeholder="+91 141 ..."
                value={newDept.phone}
                onChange={(e) => setNewDept({ ...newDept, phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows="3"
              placeholder="Agency jurisdiction and infrastructure charter..."
              value={newDept.description}
              onChange={(e) => setNewDept({ ...newDept, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowCreateDept(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold shadow"
            >
              Register Department
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
