import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FolderGit2,
  Plus,
  Search,
  Calendar,
  MapPin,
  AlertTriangle,
  Building2,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';

export function Projects() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAdmin } = useAuth();

  const [projects, setProjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [selectedDept, setSelectedDept] = useState('ALL');

  // Create Project Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
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
    progress: 0,
    participatingDepartmentIds: [],
  });
  const [errorMsg, setErrorMsg] = useState(null);

  const fetchProjectsAndDepts = async () => {
    try {
      setLoading(true);
      const [projData, deptData] = await Promise.all([
        api.projects.getAll({
          search: search || undefined,
          status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
          priority: selectedPriority !== 'ALL' ? selectedPriority : undefined,
          owningDepartmentId: selectedDept !== 'ALL' ? selectedDept : undefined,
        }),
        api.departments.getAll(),
      ]);

      setProjects(projData);
      setDepartments(deptData);

      if (deptData.length > 0 && !formData.owningDepartmentId) {
        setFormData((prev) => ({
          ...prev,
          owningDepartmentId: user?.departmentId || deptData[0].id,
        }));
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectsAndDepts();
  }, [search, selectedStatus, selectedPriority, selectedDept]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      await api.projects.create(formData);
      setShowCreateModal(false);
      setFormData({
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
        progress: 0,
        participatingDepartmentIds: [],
      });
      fetchProjectsAndDepts();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleParticipantToggle = (deptId) => {
    setFormData((prev) => {
      const exists = prev.participatingDepartmentIds.includes(deptId);
      return {
        ...prev,
        participatingDepartmentIds: exists
          ? prev.participatingDepartmentIds.filter((id) => id !== deptId)
          : [...prev.participatingDepartmentIds, deptId],
      };
    });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Project Management & Coordination</h1>
          <p className="text-xs text-slate-500 mt-1">
            City infrastructure projects, schedules, participating agencies, and location conflicts
          </p>
        </div>
        <button
          onClick={() => {
            setErrorMsg(null);
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-4 text-xs">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search code, title, location, officer..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none text-slate-700"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-semibold">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="PROPOSED">Proposed</option>
              <option value="PLANNED">Planned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-semibold">Priority:</span>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-semibold">Department:</span>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 focus:outline-none max-w-[160px] truncate"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-6">Project Title & Code</th>
                <th className="py-3.5 px-4">Owning Department</th>
                <th className="py-3.5 px-4">Location</th>
                <th className="py-3.5 px-4">Timeline</th>
                <th className="py-3.5 px-4 text-center">Priority</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Conflict Status</th>
                <th className="py-3.5 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Loading projects...
                  </td>
                </tr>
              ) : projects.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No projects found matching current filters.
                  </td>
                </tr>
              ) : (
                projects.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => navigate(`/projects/${p.id}`)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                  >
                    <td className="py-4 px-6 max-w-[240px]">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {p.code}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors mt-1 line-clamp-1">
                        {p.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 truncate">Officer: {p.responsibleOfficer}</p>
                    </td>

                    <td className="py-4 px-4 text-slate-700 max-w-[180px]">
                      <p className="font-semibold truncate">{p.owningDepartment?.name}</p>
                      {p.participatingDepts && p.participatingDepts.length > 0 && (
                        <p className="text-[10px] text-emerald-600 font-medium">
                          +{p.participatingDepts.length} participating agency
                        </p>
                      )}
                    </td>

                    <td className="py-4 px-4 max-w-[200px]">
                      <div className="flex items-start gap-1 text-slate-600">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="truncate">{p.locationName}</span>
                      </div>
                      {p.latitude && (
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5 ml-4">
                          {p.latitude.toFixed(4)}, {p.longitude?.toFixed(4)}
                        </p>
                      )}
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{new Date(p.startDate).toLocaleDateString()}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        to {new Date(p.endDate).toLocaleDateString()}
                      </p>
                    </td>

                    <td className="py-4 px-4 text-center">
                      <StatusBadge status={p.priority} />
                    </td>

                    <td className="py-4 px-4 text-center">
                      <StatusBadge status={p.status} />
                    </td>

                    <td className="py-4 px-4 text-center">
                      {p.hasConflicts ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <AlertTriangle className="w-3 h-3" />
                          <span>{p.pendingConflictsCount} Conflict</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          Clear
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => navigate(`/projects/${p.id}`)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Coordination</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create Project */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Municipal Project">
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 text-rose-700 rounded-xl border border-rose-200 font-medium">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Project Code *</label>
              <input
                type="text"
                required
                placeholder="e.g. JVVNL-2026-009"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Owning Department *</label>
              <select
                required
                value={formData.owningDepartmentId}
                onChange={(e) => setFormData({ ...formData, owningDepartmentId: e.target.value })}
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
              placeholder="e.g. JLN Marg Overhead Cable Under-grounding"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Location Details *</label>
            <input
              type="text"
              required
              placeholder="e.g. JLN Marg, OTS Crossing to Birla Mandir"
              value={formData.locationName}
              onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Latitude</label>
              <input
                type="number"
                step="any"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Longitude</label>
              <input
                type="number"
                step="any"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
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
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">End Date *</label>
              <input
                type="date"
                required
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
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
                placeholder="e.g. Er. Dev Sharma"
                value={formData.responsibleOfficer}
                onChange={(e) => setFormData({ ...formData, responsibleOfficer: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
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
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
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

          {/* Participating Departments Checkbox Selection */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Participating / Coordinating Departments
            </label>
            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 max-h-36 overflow-y-auto">
              {departments
                .filter((d) => d.id !== formData.owningDepartmentId)
                .map((d) => {
                  const checked = formData.participatingDepartmentIds.includes(d.id);
                  return (
                    <label
                      key={d.id}
                      className="flex items-center gap-2 text-slate-700 hover:text-slate-900 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleParticipantToggle(d.id)}
                        className="rounded text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                      />
                      <span className="truncate">{d.code} - {d.name}</span>
                    </label>
                  );
                })}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Scope & Technical Specifications</label>
            <textarea
              rows="3"
              placeholder="Describe trench depths, corridor width, pipe diameter, or compaction standards..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold shadow"
            >
              Register & Evaluate Conflicts
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
