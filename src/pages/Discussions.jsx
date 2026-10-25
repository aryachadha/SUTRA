import React, { useState, useEffect } from 'react';
import {
  MessagesSquare,
  Plus,
  Search,
  Building2,
  Calendar,
  Send,
  FolderGit2,
  User,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { api } from '../services/api';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';

export function Discussions() {
  const { user } = useAuth();

  const [discussions, setDiscussions] = useState([]);
  const [projects, setProjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDiscussion, setSelectedDiscussion] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('ALL');

  // Modals & Forms
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    projectId: '',
    departmentId: '',
  });
  const [replyMessage, setReplyMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);

  const fetchDiscussions = async () => {
    try {
      setLoading(true);
      const [discData, projData, deptData] = await Promise.all([
        api.discussions.getAll({
          search: search || undefined,
          projectId: selectedProjectId !== 'ALL' ? selectedProjectId : undefined,
        }),
        api.projects.getAll(),
        api.departments.getAll(),
      ]);

      setDiscussions(discData);
      setProjects(projData);
      setDepartments(deptData);

      if (discData.length > 0) {
        if (!selectedDiscussion || !discData.some((d) => d.id === selectedDiscussion.id)) {
          setSelectedDiscussion(discData[0]);
        } else {
          const updatedSelected = discData.find((d) => d.id === selectedDiscussion.id);
          setSelectedDiscussion(updatedSelected);
        }
      } else {
        setSelectedDiscussion(null);
      }
    } catch (err) {
      console.error('Error fetching discussions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscussions();
  }, [search, selectedProjectId]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      const created = await api.discussions.create({
        title: formData.title,
        message: formData.message,
        projectId: formData.projectId || null,
        departmentId: formData.departmentId || user?.departmentId,
      });
      setShowCreateModal(false);
      setFormData({
        title: '',
        message: '',
        projectId: '',
        departmentId: '',
      });
      fetchDiscussions();
      setSelectedDiscussion(created);
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedDiscussion) return;
    try {
      await api.discussions.reply(selectedDiscussion.id, {
        message: replyMessage.trim(),
        departmentId: user?.departmentId,
      });
      setReplyMessage('');
      // Refetch and update active discussion
      const updated = await api.discussions.getById(selectedDiscussion.id);
      setSelectedDiscussion(updated);
      fetchDiscussions();
    } catch (err) {
      alert(`Failed to send reply: ${err.message}`);
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
      {/* Page Header */}
      <div className="p-6 pb-4 bg-white border-b border-slate-200/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Interdepartmental Discussion Forum</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Synchronize excavation shifts, coordinate corridor utility ducts, and resolve schedule conflicts
          </p>
        </div>

        <button
          onClick={() => {
            setErrorMsg(null);
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Discussion Thread</span>
        </button>
      </div>

      {/* Main Two-Pane Chat / Thread Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane: Discussions List & Filters */}
        <div className="w-80 sm:w-96 bg-white border-r border-slate-200/80 flex flex-col shrink-0">
          {/* Search & Project Filter */}
          <div className="p-4 border-b border-slate-100 space-y-2 bg-slate-50/50">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search forum threads..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1 text-slate-700 focus:outline-none truncate"
              >
                <option value="ALL">All Related Projects</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} - {p.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* List of Threads */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loading && discussions.length === 0 ? (
              <p className="text-center py-12 text-xs text-slate-400">Loading discussions...</p>
            ) : discussions.length === 0 ? (
              <div className="text-center py-12 px-4 space-y-2 text-xs">
                <MessagesSquare className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-semibold text-slate-600">No discussions found</p>
                <p className="text-slate-400">Create a new thread to coordinate with other agencies.</p>
              </div>
            ) : (
              discussions.map((d) => {
                const isSelected = selectedDiscussion?.id === d.id;
                return (
                  <div
                    key={d.id}
                    onClick={() => setSelectedDiscussion(d)}
                    className={`p-4 cursor-pointer transition-all text-xs space-y-1.5 ${
                      isSelected
                        ? 'bg-emerald-50/70 border-l-4 border-emerald-600'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-1">
                      <span className="font-bold text-slate-900 line-clamp-1">{d.title}</span>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {new Date(d.updatedAt || d.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-slate-600 line-clamp-2 leading-relaxed">{d.message}</p>

                    <div className="flex items-center justify-between text-[11px] pt-1 text-slate-500">
                      <div className="flex items-center gap-1.5 truncate">
                        <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{d.department?.name}</span>
                      </div>
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 font-bold">
                        {d._count?.replies || 0} replies
                      </span>
                    </div>

                    {d.project && (
                      <div className="flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded w-fit">
                        <FolderGit2 className="w-3 h-3" />
                        <span className="truncate">{d.project.code}</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Active Thread View */}
        <div className="flex-1 bg-slate-50/50 flex flex-col overflow-hidden">
          {selectedDiscussion ? (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {/* Thread Header */}
              <div className="p-6 bg-white border-b border-slate-200/80 shrink-0 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedDiscussion.project && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                      <FolderGit2 className="w-3 h-3" />
                      <span>{selectedDiscussion.project.code}</span>
                    </span>
                  )}
                  <span className="text-xs text-slate-500 font-semibold">
                    Initiated by {selectedDiscussion.author?.name} ({selectedDiscussion.department?.name})
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs text-slate-400">
                    {new Date(selectedDiscussion.createdAt).toLocaleString()}
                  </span>
                </div>

                <h2 className="text-lg font-bold text-slate-900">{selectedDiscussion.title}</h2>
              </div>

              {/* Message Feed */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {/* Original Post */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-navy-900 text-white flex items-center justify-center font-bold text-xs">
                        {selectedDiscussion.author?.name ? selectedDiscussion.author.name[0] : 'U'}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900">{selectedDiscussion.author?.name}</span>
                        <p className="text-[10px] text-slate-500">
                          {selectedDiscussion.author?.designation} • {selectedDiscussion.department?.name}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {new Date(selectedDiscussion.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-line">
                    {selectedDiscussion.message}
                  </p>
                </div>

                {/* Reply Timeline */}
                {selectedDiscussion.replies && selectedDiscussion.replies.length > 0 && (
                  <div className="space-y-3 pl-4 border-l-2 border-slate-200 my-4">
                    {selectedDiscussion.replies.map((reply) => (
                      <div
                        key={reply.id}
                        className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-[10px]">
                              {reply.author?.name ? reply.author.name[0] : 'U'}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900">{reply.author?.name}</span>
                              <span className="text-[11px] text-slate-400 ml-2">
                                ({reply.department?.name})
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {new Date(reply.createdAt).toLocaleDateString()}{' '}
                            {new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                          {reply.message}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Reply Input Form */}
              <div className="p-4 bg-white border-t border-slate-200/80 shrink-0">
                <form onSubmit={handleReplySubmit} className="flex gap-3">
                  <input
                    type="text"
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type official departmental response or coordination schedule..."
                    className="flex-1 px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none text-slate-800"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Reply</span>
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-12 text-slate-400 text-xs">
              <div>
                <MessagesSquare className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                <p className="font-semibold text-slate-600">Select a discussion thread</p>
                <p>Or create a new thread to coordinate across Jaipur civic agencies.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal: New Discussion */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Open Interdepartmental Discussion Thread">
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 text-rose-700 rounded-xl border border-rose-200 font-medium">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Discussion Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Schedule Alignment: Tonk Road Trenching & Water Supply"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Related Project (Optional)</label>
              <select
                value={formData.projectId}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
              >
                <option value="">No linked project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} - {p.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Author Department</label>
              <select
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
              >
                <option value="">Default (Your Assigned Department)</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Detailed Coordination Notice *</label>
            <textarea
              rows="5"
              required
              placeholder="State proposed trench depth, carriageway closures, alignment demarcations, and requested actions from utility partners..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
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
              Post Discussion Thread
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
