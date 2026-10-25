import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Calendar,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Edit2,
  Plus,
  MessagesSquare,
  ShieldCheck,
  Send,
  Trash2,
} from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';

export function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const [project, setProject] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit Project Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [errorMsg, setErrorMsg] = useState(null);

  // Conflict Resolution Modal
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [activeConflict, setActiveConflict] = useState(null);
  const [resolutionStatus, setResolutionStatus] = useState('RESOLVED');
  const [resolutionNote, setResolutionNote] = useState('');

  // Quick Discussion
  const [discussionMessage, setDiscussionMessage] = useState('');

  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      const [projData, deptData] = await Promise.all([
        api.projects.getById(id),
        api.departments.getAll(),
      ]);
      setProject(projData);
      setDepartments(deptData);

      setEditFormData({
        title: projData.title,
        code: projData.code,
        description: projData.description || '',
        owningDepartmentId: projData.owningDepartmentId,
        locationName: projData.locationName,
        latitude: projData.latitude || '',
        longitude: projData.longitude || '',
        startDate: projData.startDate ? projData.startDate.split('T')[0] : '',
        endDate: projData.endDate ? projData.endDate.split('T')[0] : '',
        responsibleOfficer: projData.responsibleOfficer,
        priority: projData.priority,
        status: projData.status,
        budget: projData.budget || '',
        progress: projData.progress,
        participatingDepartmentIds: (projData.participatingDepts || []).map((p) => p.departmentId),
      });
    } catch (err) {
      console.error('Error fetching project detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectDetails();
  }, [id]);

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      await api.projects.update(id, editFormData);
      setShowEditModal(false);
      fetchProjectDetails();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleOpenResolve = (conflict) => {
    setActiveConflict(conflict);
    setResolutionStatus('RESOLVED');
    setResolutionNote(conflict.resolutionNote || '');
    setShowResolveModal(true);
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!activeConflict) return;
    try {
      await api.conflicts.resolve(activeConflict.id, {
        status: resolutionStatus,
        resolutionNote,
      });
      setShowResolveModal(false);
      fetchProjectDetails();
    } catch (err) {
      alert(`Failed to update conflict: ${err.message}`);
    }
  };

  const handleInitiateCoordination = async (conflictId) => {
    try {
      const res = await api.conflicts.createCoordination(conflictId);
      alert('Coordination discussion successfully created!');
      fetchProjectDetails();
    } catch (err) {
      alert(`Error initiating coordination: ${err.message}`);
    }
  };

  const handleQuickDiscussionSubmit = async (e) => {
    e.preventDefault();
    if (!discussionMessage.trim()) return;
    try {
      await api.discussions.create({
        title: `Coordination Note: ${project.title}`,
        message: discussionMessage.trim(),
        projectId: project.id,
        departmentId: user?.departmentId || project.owningDepartmentId,
      });
      setDiscussionMessage('');
      fetchProjectDetails();
    } catch (err) {
      alert(`Failed to post message: ${err.message}`);
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    try {
      await api.projects.delete(id);
      navigate('/projects');
    } catch (err) {
      alert(`Cannot delete project: ${err.message}`);
    }
  };

  if (loading || !project) {
    return (
      <div className="p-12 text-center text-slate-500 text-sm">
        Loading project details...
      </div>
    );
  }

  const canEdit = isAdmin || user?.departmentId === project.owningDepartmentId;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Projects</span>
        </button>

        {canEdit && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEditModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow transition-all"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Project</span>
            </button>
            <button
              onClick={handleDeleteProject}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
              title="Delete Project"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Main Project Overview Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                {project.code}
              </span>
              <StatusBadge status={project.priority} />
              <StatusBadge status={project.status} />
              <span className="text-xs text-slate-400 font-medium">
                Owning Agency: <strong className="text-slate-800">{project.owningDepartment?.name}</strong>
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mt-2">{project.title}</h1>
          </div>

          <div className="flex flex-col items-end shrink-0">
            <span className="text-xs font-bold text-slate-500 uppercase">Progress</span>
            <div className="flex items-center gap-3 mt-1">
              <div className="w-36 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
              <span className="text-sm font-bold font-mono text-slate-800">{project.progress}%</span>
            </div>
          </div>
        </div>

        {/* Project Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-1.5 text-slate-500 font-semibold mb-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>Location Corridor</span>
            </div>
            <p className="font-bold text-slate-900">{project.locationName}</p>
            {project.latitude && (
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                Coords: {project.latitude.toFixed(4)}, {project.longitude?.toFixed(4)}
              </p>
            )}
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-1.5 text-slate-500 font-semibold mb-1">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>Execution Schedule</span>
            </div>
            <p className="font-bold text-slate-900">
              {new Date(project.startDate).toLocaleDateString()} — {new Date(project.endDate).toLocaleDateString()}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Duration: Planned Works</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-1.5 text-slate-500 font-semibold mb-1">
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Responsible Officer</span>
            </div>
            <p className="font-bold text-slate-900">{project.responsibleOfficer}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{project.owningDepartment?.category}</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-1.5 text-slate-500 font-semibold mb-1">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Estimated Budget</span>
            </div>
            <p className="font-bold text-slate-900">
              {project.budget ? `₹ ${project.budget.toFixed(2)} Lakhs` : 'Allocated in Annual Plan'}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">State & Municipal Grants</p>
          </div>
        </div>

        {/* Scope Description */}
        {project.description && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Scope of Work & Technical Parameters
            </h3>
            <p className="text-xs text-slate-700 bg-slate-50/60 p-4 rounded-xl border border-slate-100 leading-relaxed whitespace-pre-line">
              {project.description}
            </p>
          </div>
        )}

        {/* Participating Agencies */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Participating & Coordinating Agencies ({project.participatingDepts?.length || 0})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {project.participatingDepts && project.participatingDepts.length > 0 ? (
              project.participatingDepts.map((part) => (
                <div
                  key={part.id}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center gap-3 text-xs"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                    {part.department.code}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{part.department.name}</p>
                    <p className="text-[11px] text-slate-500">{part.role || 'Coordinating Agency'}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic">No secondary coordinating agencies assigned.</p>
            )}
          </div>
        </div>
      </div>

      {/* Relevant Coordination Issues & Spatial Conflicts */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Spatial Proximity & Schedule Overlap Conflicts ({project.conflicts?.length || 0})
              </h2>
              <p className="text-xs text-slate-500">
                Automated detection based on Haversine distance (&lt;500m) and overlapping planned schedules
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {project.conflicts && project.conflicts.length > 0 ? (
            project.conflicts.map((c) => (
              <div
                key={c.id}
                className="p-4 rounded-xl border border-rose-200 bg-rose-50/30 text-xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">
                      Conflicting Project: {c.otherProject?.title}
                    </span>
                    <span className="font-mono text-[11px] font-bold text-slate-500">({c.otherProject?.code})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={c.status} />
                    <button
                      onClick={() => handleOpenResolve(c)}
                      className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
                    >
                      Update Review / Resolution
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-slate-700">
                  <div>
                    <span className="font-semibold text-slate-500">Owning Department:</span>{' '}
                    <strong className="text-slate-800">{c.otherProject?.owningDepartment?.name}</strong>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500">Spatial Proximity:</span>{' '}
                    <strong className="text-rose-700">{c.distanceMeters} meters away</strong>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500">Schedule Overlap:</span>{' '}
                    <strong className="text-rose-700">~{c.scheduleOverlapDays} days</strong>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200/80">
                  <p className="font-semibold text-emerald-800 mb-1 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Suggested Interdepartmental Action:</span>
                  </p>
                  <p className="text-slate-600 leading-relaxed">{c.suggestedAction}</p>
                </div>

                {c.resolutionNote && (
                  <div className="bg-slate-100/70 p-2.5 rounded-lg text-slate-600 text-[11px]">
                    <span className="font-bold text-slate-700">Resolution Note:</span> {c.resolutionNote}
                    {c.resolvedBy && <span> (Reviewed by {c.resolvedBy.name})</span>}
                  </div>
                )}

                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => handleInitiateCoordination(c.id)}
                    className="flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-bold"
                  >
                    <MessagesSquare className="w-3.5 h-3.5" />
                    <span>Open Interdepartmental Discussion Thread</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-100 text-xs">
              <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
              <span>No spatial or schedule conflicts identified with active projects in this corridor.</span>
            </div>
          )}
        </div>
      </div>

      {/* Discussion Forum Linked to this Project */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <MessagesSquare className="w-5 h-5 text-emerald-600" />
          <h2 className="text-base font-bold text-slate-900">
            Project Coordination Discussions ({project.discussions?.length || 0})
          </h2>
        </div>

        {/* New Message Form */}
        <form onSubmit={handleQuickDiscussionSubmit} className="flex gap-3">
          <input
            type="text"
            value={discussionMessage}
            onChange={(e) => setDiscussionMessage(e.target.value)}
            placeholder="Post a coordination note, schedule update, or utility query regarding this project..."
            className="flex-1 px-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Note</span>
          </button>
        </form>

        <div className="divide-y divide-slate-100 mt-2">
          {project.discussions && project.discussions.length > 0 ? (
            project.discussions.map((d) => (
              <div
                key={d.id}
                onClick={() => navigate('/discussions')}
                className="py-3.5 hover:bg-slate-50 px-2 rounded-xl cursor-pointer transition-colors text-xs"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-900">{d.title}</h4>
                    <p className="text-slate-600 mt-1 line-clamp-2">{d.message}</p>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono shrink-0 ml-4">
                    {new Date(d.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                  <span>Author: {d.author?.name} ({d.department?.name})</span>
                  <span>•</span>
                  <span>{d._count?.replies || 0} Replies</span>
                </div>
              </div>
            ))
          ) : (
            <p className="py-6 text-center text-slate-400 text-xs">No discussion threads opened for this project yet.</p>
          )}
        </div>
      </div>

      {/* Modal: Edit Project */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Project Details">
        <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 text-rose-700 rounded-xl border border-rose-200 font-medium">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Project Title</label>
            <input
              type="text"
              required
              value={editFormData.title || ''}
              onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Location Details</label>
            <input
              type="text"
              required
              value={editFormData.locationName || ''}
              onChange={(e) => setEditFormData({ ...editFormData, locationName: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                required
                value={editFormData.startDate || ''}
                onChange={(e) => setEditFormData({ ...editFormData, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">End Date</label>
              <input
                type="date"
                required
                value={editFormData.endDate || ''}
                onChange={(e) => setEditFormData({ ...editFormData, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={editFormData.status || 'PLANNED'}
                onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
              >
                <option value="PROPOSED">Proposed</option>
                <option value="PLANNED">Planned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Priority</label>
              <select
                value={editFormData.priority || 'MEDIUM'}
                onChange={(e) => setEditFormData({ ...editFormData, priority: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Progress (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={editFormData.progress ?? 0}
                onChange={(e) => setEditFormData({ ...editFormData, progress: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Responsible Officer</label>
            <input
              type="text"
              required
              value={editFormData.responsibleOfficer || ''}
              onChange={(e) => setEditFormData({ ...editFormData, responsibleOfficer: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Scope Description</label>
            <textarea
              rows="3"
              value={editFormData.description || ''}
              onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold shadow"
            >
              Update Project
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Resolve/Review Conflict */}
      <Modal
        isOpen={showResolveModal}
        onClose={() => setShowResolveModal(false)}
        title="Review & Coordinate Project Conflict"
      >
        <form onSubmit={handleResolveSubmit} className="space-y-4 text-xs">
          <p className="text-slate-600">
            Reviewing conflict between <strong>{project.title}</strong> and{' '}
            <strong>{activeConflict?.otherProject?.title}</strong> ({activeConflict?.distanceMeters}m proximity).
          </p>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Status</label>
            <select
              value={resolutionStatus}
              onChange={(e) => setResolutionStatus(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
            >
              <option value="UNDER_REVIEW">Under Joint Review</option>
              <option value="RESOLVED">Resolved (Schedule / Corridor Aligned)</option>
              <option value="DISMISSED">Dismissed (No Physical Collision Risk)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Resolution & Coordination Notes *</label>
            <textarea
              rows="4"
              required
              placeholder="e.g. Joint trenching agreed; PWD South carriageway works shifted by 2 weeks; PHED will lay DI pipes along utility verge."
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowResolveModal(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold shadow"
            >
              Save Conflict Status
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
