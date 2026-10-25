import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Plus,
  Search,
  Building2,
  MapPin,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ArrowRight,
  Shield,
  Layers,
} from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';

export function Resources() {
  const { user, isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'requests'
  const [resources, setResources] = useState([]);
  const [requests, setRequests] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedDept, setSelectedDept] = useState('ALL');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);

  // Forms
  const [resourceForm, setResourceForm] = useState({
    name: '',
    category: '',
    owningDepartmentId: '',
    location: '',
    quantity: 1,
    status: 'AVAILABLE',
    description: '',
  });

  const [requestForm, setRequestForm] = useState({
    startDate: '',
    endDate: '',
    purpose: '',
    quantity: 1,
    requestingDepartmentId: '',
  });

  const [errorMsg, setErrorMsg] = useState(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resData, reqData, deptData] = await Promise.all([
        api.resources.getAll({
          search: search || undefined,
          category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
          owningDepartmentId: selectedDept !== 'ALL' ? selectedDept : undefined,
        }),
        api.resources.getRequests(),
        api.departments.getAll(),
      ]);

      setResources(resData);
      setRequests(reqData);
      setDepartments(deptData);

      if (deptData.length > 0 && !resourceForm.owningDepartmentId) {
        setResourceForm((prev) => ({
          ...prev,
          owningDepartmentId: user?.departmentId || deptData[0].id,
        }));
      }
      if (deptData.length > 0 && !requestForm.requestingDepartmentId) {
        setRequestForm((prev) => ({
          ...prev,
          requestingDepartmentId: user?.departmentId || deptData[0].id,
        }));
      }
    } catch (err) {
      console.error('Failed to load resources:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, selectedCategory, selectedDept]);

  const handleAddResourceSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      await api.resources.create(resourceForm);
      setShowAddModal(false);
      setResourceForm({
        name: '',
        category: '',
        owningDepartmentId: departments[0]?.id || '',
        location: '',
        quantity: 1,
        status: 'AVAILABLE',
        description: '',
      });
      setActionSuccessMsg('Shared resource successfully added.');
      fetchData();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleOpenRequest = (res) => {
    setSelectedResource(res);
    setRequestForm({
      startDate: '',
      endDate: '',
      purpose: '',
      quantity: 1,
      requestingDepartmentId: user?.departmentId || departments[0]?.id || '',
    });
    setErrorMsg(null);
    setShowRequestModal(true);
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      await api.resources.createRequest(selectedResource.id, requestForm);
      setShowRequestModal(false);
      setActionSuccessMsg(`Resource request submitted for ${selectedResource.name}.`);
      setActiveTab('requests');
      fetchData();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleReviewRequest = async (requestId, status) => {
    const note = prompt(`Enter review note for ${status.toLowerCase()} action:`, '');
    if (note === null) return;

    try {
      await api.resources.updateRequestStatus(requestId, {
        status,
        reviewNote: note,
      });
      setActionSuccessMsg(`Request marked as ${status}.`);
      fetchData();
    } catch (err) {
      alert(`Action failed: ${err.message}`);
    }
  };

  const categories = [
    'ALL',
    'Excavation & Earthmoving',
    'Compaction Equipment',
    'Utility Inspection & Detection',
    'Emergency Power & Generators',
    'Surveying & Geospatial',
    'Vehicles & Transport',
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Shared Resource Inventory</h1>
          <p className="text-xs text-slate-500 mt-1">
            Interdepartmental sharing of heavy excavators, inspection crawlers, rollers, and testing equipment
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setErrorMsg(null);
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>List New Resource</span>
          </button>
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-xs flex items-center justify-between">
          <span>{actionSuccessMsg}</span>
          <button onClick={() => setActionSuccessMsg(null)} className="font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 ${
            activeTab === 'inventory'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Resource Directory ({resources.length})
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 ${
            activeTab === 'requests'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Booking Requests ({requests.length})
        </button>
      </div>

      {activeTab === 'inventory' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search equipment, brand, yard location..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-semibold">Category:</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 focus:outline-none max-w-[200px]"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c === 'ALL' ? 'All Categories' : c}
                    </option>
                  ))}
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

          {/* Resources Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {loading ? (
              <div className="col-span-full py-12 text-center text-slate-400 text-xs">
                Loading resource catalog...
              </div>
            ) : resources.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-400 text-xs">
                No matching resources found.
              </div>
            ) : (
              resources.map((r) => (
                <div
                  key={r.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-all text-xs space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {r.category}
                      </span>
                      <StatusBadge status={r.status} />
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm">{r.name}</h3>

                    <div className="space-y-1 text-slate-600 text-[11px]">
                      <p className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-semibold text-slate-800">{r.owningDepartment?.name}</span>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{r.location}</span>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Inventory Quantity: <strong>{r.quantity} unit(s)</strong></span>
                      </p>
                    </div>

                    {r.description && (
                      <p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed line-clamp-2">
                        {r.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">
                      {r.requests?.length || 0} Active Reservation(s)
                    </span>
                    <button
                      onClick={() => handleOpenRequest(r)}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold shadow-sm transition-all"
                    >
                      Request Resource
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden text-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-6">Requested Resource</th>
                  <th className="py-3.5 px-4">Requesting Department</th>
                  <th className="py-3.5 px-4">Required Period</th>
                  <th className="py-3.5 px-4">Purpose</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-6 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No resource booking requests recorded.
                    </td>
                  </tr>
                ) : (
                  requests.map((req) => {
                    const canReview =
                      isAdmin || user?.departmentId === req.resource?.owningDepartmentId;

                    return (
                      <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-6 max-w-[200px]">
                          <p className="font-bold text-slate-900">{req.resource?.name}</p>
                          <p className="text-[11px] text-slate-400">
                            Owner: {req.resource?.owningDepartment?.name}
                          </p>
                        </td>

                        <td className="py-4 px-4 text-slate-700">
                          <p className="font-semibold">{req.requestingDepartment?.name}</p>
                          <p className="text-[11px] text-slate-400">By: {req.requestedBy?.name}</p>
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap text-slate-600">
                          <p className="font-semibold text-slate-800">
                            {new Date(req.startDate).toLocaleDateString()} to {new Date(req.endDate).toLocaleDateString()}
                          </p>
                          <p className="text-[11px] text-slate-400">Qty: {req.quantity} unit(s)</p>
                        </td>

                        <td className="py-4 px-4 max-w-[240px] text-slate-600">
                          <p className="line-clamp-2">{req.purpose}</p>
                          {req.reviewNote && (
                            <p className="text-[11px] text-slate-400 italic mt-0.5">
                              Note: {req.reviewNote}
                            </p>
                          )}
                        </td>

                        <td className="py-4 px-4 text-center">
                          <StatusBadge status={req.status} />
                        </td>

                        <td className="py-4 px-6 text-right">
                          {req.status === 'PENDING' && canReview ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleReviewRequest(req.id, 'APPROVED')}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[11px] shadow"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleReviewRequest(req.id, 'REJECTED')}
                                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-bold text-[11px]"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">
                              {req.status === 'APPROVED' ? 'Approved & Locked' : 'Concluded'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: List Resource */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="List Resource for Interdepartmental Sharing">
        <form onSubmit={handleAddResourceSubmit} className="space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 text-rose-700 rounded-xl border border-rose-200 font-medium">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Resource Name & Model *</label>
            <input
              type="text"
              required
              placeholder="e.g. Caterpillar 320D Excavator with Hydraulic Breaker"
              value={resourceForm.name}
              onChange={(e) => setResourceForm({ ...resourceForm, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Category *</label>
              <select
                required
                value={resourceForm.category}
                onChange={(e) => setResourceForm({ ...resourceForm, category: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
              >
                <option value="">Select category...</option>
                {categories.filter((c) => c !== 'ALL').map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Owning Department *</label>
              <select
                required
                value={resourceForm.owningDepartmentId}
                onChange={(e) => setResourceForm({ ...resourceForm, owningDepartmentId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Yard / Depot Location *</label>
              <input
                type="text"
                required
                placeholder="e.g. Transport Nagar Central Mechanical Yard"
                value={resourceForm.location}
                onChange={(e) => setResourceForm({ ...resourceForm, location: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Available Quantity</label>
              <input
                type="number"
                min="1"
                value={resourceForm.quantity}
                onChange={(e) => setResourceForm({ ...resourceForm, quantity: parseInt(e.target.value, 10) || 1 })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Technical Specifications & Notes</label>
            <textarea
              rows="3"
              placeholder="Operational capacity, fuel requirements, certified operator requirements..."
              value={resourceForm.description}
              onChange={(e) => setResourceForm({ ...resourceForm, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold shadow"
            >
              List Equipment
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Request Resource */}
      <Modal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        title={`Request Resource: ${selectedResource?.name}`}
      >
        <form onSubmit={handleRequestSubmit} className="space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 text-rose-700 rounded-xl border border-rose-200 font-medium">
              {errorMsg}
            </div>
          )}

          <p className="text-slate-600">
            Owning Agency: <strong>{selectedResource?.owningDepartment?.name}</strong> • Location:{' '}
            <strong>{selectedResource?.location}</strong>
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Start Date *</label>
              <input
                type="date"
                required
                value={requestForm.startDate}
                onChange={(e) => setRequestForm({ ...requestForm, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">End Date *</label>
              <input
                type="date"
                required
                value={requestForm.endDate}
                onChange={(e) => setRequestForm({ ...requestForm, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Requesting Department *</label>
              <select
                required
                value={requestForm.requestingDepartmentId}
                onChange={(e) => setRequestForm({ ...requestForm, requestingDepartmentId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Units Required</label>
              <input
                type="number"
                min="1"
                max={selectedResource?.quantity || 1}
                value={requestForm.quantity}
                onChange={(e) => setRequestForm({ ...requestForm, quantity: parseInt(e.target.value, 10) || 1 })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Purpose & Project Site *</label>
            <textarea
              rows="3"
              required
              placeholder="e.g. Required for utility trenching along MI Road North Corridor for water main replacement."
              value={requestForm.purpose}
              onChange={(e) => setRequestForm({ ...requestForm, purpose: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowRequestModal(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold shadow"
            >
              Submit Reservation Request
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
