import React, { useState, useEffect } from 'react';
import { Building2, Plus, Search, Mail, Phone, ExternalLink, Edit2, Trash2, FolderGit2, Wrench } from 'lucide-react';
import { api } from '../services/api';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';

export function Departments() {
  const { isAdmin } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);
  const [editingDept, setEditingDept] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
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

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const data = await api.departments.getAll({
        search,
        category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
      });
      setDepartments(data);
    } catch (err) {
      console.error('Error fetching departments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, [search, selectedCategory]);

  const handleOpenCreate = () => {
    setEditingDept(null);
    setFormData({
      name: '',
      code: '',
      category: '',
      city: 'Jaipur',
      contactPerson: '',
      email: '',
      phone: '',
      description: '',
    });
    setErrorMsg(null);
    setShowModal(true);
  };

  const handleOpenEdit = (dept, e) => {
    e.stopPropagation();
    setEditingDept(dept);
    setFormData({
      name: dept.name,
      code: dept.code,
      category: dept.category,
      city: dept.city,
      contactPerson: dept.contactPerson,
      email: dept.email,
      phone: dept.phone || '',
      description: dept.description || '',
    });
    setErrorMsg(null);
    setShowModal(true);
  };

  const handleRowClick = async (dept) => {
    try {
      const detailed = await api.departments.getById(dept.id);
      setSelectedDept(detailed);
      setShowDetailModal(true);
    } catch (err) {
      console.error('Failed to load dept details:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      if (editingDept) {
        await api.departments.update(editingDept.id, formData);
      } else {
        await api.departments.create(formData);
      }
      setShowModal(false);
      fetchDepartments();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this department?')) return;
    try {
      await api.departments.delete(id);
      fetchDepartments();
    } catch (err) {
      alert(`Cannot delete department: ${err.message}`);
    }
  };

  // Distinct categories for filter
  const categories = ['ALL', ...new Set(departments.map((d) => d.category))];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Department Directory</h1>
          <p className="text-xs text-slate-500 mt-1">
            Registered municipal departments, public utilities, and civic execution agencies
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Department</span>
          </button>
        )}
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, code, contact officer..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none text-slate-700"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">Category:</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === 'ALL' ? 'All Categories' : c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Departments Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-6">Department</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Contact Person</th>
                <th className="py-3.5 px-4">City</th>
                <th className="py-3.5 px-4 text-center">Projects</th>
                <th className="py-3.5 px-4 text-center">Resources</th>
                {isAdmin && <th className="py-3.5 px-6 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="py-12 text-center text-slate-400">
                    Loading departments...
                  </td>
                </tr>
              ) : departments.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="py-12 text-center text-slate-400">
                    No departments found matching search criteria.
                  </td>
                </tr>
              ) : (
                departments.map((dept) => (
                  <tr
                    key={dept.id}
                    onClick={() => handleRowClick(dept)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-navy-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {dept.code}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                            {dept.name}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono mt-0.5">Code: {dept.code}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-slate-600 font-medium">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200">
                        {dept.category}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <p className="font-semibold text-slate-800">{dept.contactPerson}</p>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{dept.email}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-slate-700 font-medium">
                      {dept.city}
                    </td>

                    <td className="py-4 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200 text-xs">
                        {dept._count?.ownedProjects || 0}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 text-xs">
                        {dept._count?.resources || 0}
                      </span>
                    </td>

                    {isAdmin && (
                      <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={(e) => handleOpenEdit(dept, e)}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit Department"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(dept.id, e)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Delete Department"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Department Detail View */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={selectedDept?.name || 'Department Details'}
        maxWidth="max-w-3xl"
      >
        {selectedDept && (
          <div className="space-y-6 text-xs">
            {/* Header info */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Short Code</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedDept.code}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Category</p>
                <p className="text-xs font-semibold text-slate-800 mt-0.5">{selectedDept.category}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">City Jurisdiction</p>
                <p className="text-xs font-semibold text-slate-800 mt-0.5">{selectedDept.city}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Contact Officer</p>
                <p className="text-xs font-semibold text-slate-800 mt-0.5">{selectedDept.contactPerson}</p>
              </div>
            </div>

            {selectedDept.description && (
              <div>
                <h4 className="font-bold text-slate-800 mb-1">Charter & Responsibilities</h4>
                <p className="text-slate-600 leading-relaxed bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                  {selectedDept.description}
                </p>
              </div>
            )}

            {/* Active Projects of Department */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FolderGit2 className="w-4 h-4 text-blue-600" />
                <h4 className="font-bold text-slate-800">
                  Active Projects ({selectedDept.ownedProjects?.length || 0})
                </h4>
              </div>

              {selectedDept.ownedProjects && selectedDept.ownedProjects.length > 0 ? (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {selectedDept.ownedProjects.map((p) => (
                    <div key={p.id} className="p-3 flex justify-between items-center bg-white hover:bg-slate-50">
                      <div>
                        <p className="font-semibold text-slate-900">{p.title}</p>
                        <p className="text-[11px] text-slate-400">{p.locationName}</p>
                      </div>
                      <span className="font-mono text-[11px] px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-semibold">
                        {p.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 italic">No registered projects for this department.</p>
              )}
            </div>

            {/* Available Resources of Department */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Wrench className="w-4 h-4 text-emerald-600" />
                <h4 className="font-bold text-slate-800">
                  Shared Resources ({selectedDept.resources?.length || 0})
                </h4>
              </div>

              {selectedDept.resources && selectedDept.resources.length > 0 ? (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {selectedDept.resources.map((r) => (
                    <div key={r.id} className="p-3 flex justify-between items-center bg-white hover:bg-slate-50">
                      <div>
                        <p className="font-semibold text-slate-900">{r.name}</p>
                        <p className="text-[11px] text-slate-400">{r.category} • Location: {r.location}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Qty: {r.quantity} ({r.status})
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 italic">No resources listed for sharing.</p>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-5 py-2 bg-slate-800 text-white rounded-xl font-semibold hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Add/Edit Department */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingDept ? 'Edit Department' : 'Register New Department'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
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
                placeholder="e.g. Rajasthan Rajya Vidyut Utpadan Nigam"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Code *</label>
              <input
                type="text"
                required
                placeholder="e.g. RRVUNL"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
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
                placeholder="e.g. Power Generation"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
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
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Official Email *</label>
              <input
                type="email"
                required
                placeholder="officer@domain.gov.in"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone</label>
              <input
                type="text"
                placeholder="+91 141..."
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold shadow"
            >
              {editingDept ? 'Update Department' : 'Save Department'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
