import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  MapPin,
  Calendar,
  Layers,
  Building2,
  ExternalLink,
  MessagesSquare,
  HelpCircle,
} from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';

// Center of Jaipur, Rajasthan
const JAIPUR_CENTER = [26.9124, 75.7873];

// Helper component to pan map smoothly
function MapController({ targetCenter, targetZoom }) {
  const map = useMap();
  useEffect(() => {
    if (targetCenter) {
      map.flyTo(targetCenter, targetZoom || 15, { duration: 1.2 });
    }
  }, [targetCenter, targetZoom, map]);
  return null;
}

// Custom modern SVG/HTML Leaflet Icons
function createCustomMarkerIcon(code, hasConflict, priority) {
  const bgColor = hasConflict
    ? 'bg-rose-600 ring-4 ring-rose-400/40 text-white'
    : priority === 'CRITICAL'
    ? 'bg-amber-600 ring-2 ring-amber-300 text-white'
    : 'bg-navy-900 ring-2 ring-white text-white';

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div class="flex items-center justify-center w-8 h-8 rounded-full shadow-lg font-bold text-[11px] ${bgColor} transform -translate-x-1/2 -translate-y-1/2">
        <span>${code.split('-')[0] || 'PRJ'}</span>
        ${
          hasConflict
            ? '<span class="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-white animate-ping"></span><span class="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-white"></span>'
            : ''
        }
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -20],
  });
}

export function ProjectMap() {
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterConflictStatus, setFilterConflictStatus] = useState('ALL');

  // Map view focus controller
  const [mapCenter, setMapCenter] = useState(JAIPUR_CENTER);
  const [mapZoom, setMapZoom] = useState(13);

  // Resolution Modal
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [selectedConflict, setSelectedConflict] = useState(null);
  const [resolutionStatus, setResolutionStatus] = useState('RESOLVED');
  const [resolutionNote, setResolutionNote] = useState('');

  const fetchMapData = async () => {
    try {
      setLoading(true);
      const [projectsData, conflictsData] = await Promise.all([
        api.projects.getAll(),
        api.conflicts.getAll(),
      ]);
      setProjects(projectsData);
      setConflicts(conflictsData);
    } catch (err) {
      console.error('Error loading map data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMapData();
  }, []);

  // Filter conflicts
  const filteredConflicts = conflicts.filter((c) => {
    if (filterConflictStatus === 'ALL') return true;
    return c.status === filterConflictStatus;
  });

  const handleConflictClick = (conflict) => {
    if (conflict.projectA?.latitude && conflict.projectA?.longitude) {
      setMapCenter([conflict.projectA.latitude, conflict.projectA.longitude]);
      setMapZoom(16);
    }
  };

  const handleOpenResolve = (conflict) => {
    setSelectedConflict(conflict);
    setResolutionStatus('RESOLVED');
    setResolutionNote(conflict.resolutionNote || '');
    setShowResolveModal(true);
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!selectedConflict) return;
    try {
      await api.conflicts.resolve(selectedConflict.id, {
        status: resolutionStatus,
        resolutionNote,
      });
      setShowResolveModal(false);
      fetchMapData();
    } catch (err) {
      alert(`Error updating conflict: ${err.message}`);
    }
  };

  const handleInitiateCoordination = async (conflictId) => {
    try {
      await api.conflicts.createCoordination(conflictId);
      alert('Coordination discussion successfully created!');
      fetchMapData();
    } catch (err) {
      alert(`Error creating coordination thread: ${err.message}`);
    }
  };

  // Projects with valid coordinates
  const mappedProjects = projects.filter(
    (p) => p.latitude != null && p.longitude != null && !isNaN(p.latitude) && !isNaN(p.longitude)
  );

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
      {/* Top Banner Notice: Distinguish Potential Conflict vs Confirmed Collision */}
      <div className="bg-navy-950 text-slate-300 px-6 py-2.5 text-xs flex items-center justify-between border-b border-navy-800 shrink-0">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong className="text-white">MoHUA SUTRA Protocol:</strong> Conflict detection flags proximity within 500m &amp; schedule overlaps. Does not assert precise underground utility collision without joint field GPR survey.
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-semibold text-emerald-400">
            {mappedProjects.length} Projects Plotted
          </span>
          <span className="text-slate-600">|</span>
          <span className="font-semibold text-rose-400">
            {conflicts.filter((c) => c.status === 'DETECTED').length} Unresolved Conflicts
          </span>
        </div>
      </div>

      {/* Main Split Layout: Map on left/center, Conflicts sidebar on right */}
      <div className="flex-1 flex overflow-hidden">
        {/* Leaflet Map Container */}
        <div className="flex-1 relative bg-slate-100">
          <MapContainer
            center={JAIPUR_CENTER}
            zoom={13}
            scrollWheelZoom={true}
            className="w-full h-full"
          >
            <MapController targetCenter={mapCenter} targetZoom={mapZoom} />

            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Render Conflict Buffer Circles (500m proximity) */}
            {conflicts
              .filter((c) => c.status === 'DETECTED' || c.status === 'UNDER_REVIEW')
              .map((c) => {
                if (!c.projectA?.latitude || !c.projectA?.longitude) return null;
                return (
                  <Circle
                    key={`circle-${c.id}`}
                    center={[c.projectA.latitude, c.projectA.longitude]}
                    radius={250}
                    pathOptions={{
                      color: '#f43f5e',
                      fillColor: '#f43f5e',
                      fillOpacity: 0.15,
                      weight: 1.5,
                      dashArray: '4, 4',
                    }}
                  />
                );
              })}

            {/* Render Project Markers */}
            {mappedProjects.map((p) => {
              const hasConflict = conflicts.some(
                (c) =>
                  (c.projectAId === p.id || c.projectBId === p.id) &&
                  (c.status === 'DETECTED' || c.status === 'UNDER_REVIEW')
              );

              return (
                <Marker
                  key={p.id}
                  position={[p.latitude, p.longitude]}
                  icon={createCustomMarkerIcon(p.code, hasConflict, p.priority)}
                >
                  <Popup>
                    <div className="p-1 max-w-xs text-xs space-y-2">
                      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5">
                        <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {p.code}
                        </span>
                        <StatusBadge status={p.status} />
                      </div>

                      <h4 className="font-bold text-slate-900 text-sm leading-tight">{p.title}</h4>

                      <p className="text-slate-600 text-[11px] font-medium flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        <span>{p.owningDepartment?.name}</span>
                      </p>

                      <p className="text-slate-500 text-[11px] flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{p.locationName}</span>
                      </p>

                      <p className="text-slate-500 text-[11px] flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>
                          {new Date(p.startDate).toLocaleDateString()} to {new Date(p.endDate).toLocaleDateString()}
                        </span>
                      </p>

                      {hasConflict && (
                        <div className="p-2 rounded bg-rose-50 border border-rose-200 text-rose-700 font-semibold text-[11px] flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>Spatial &amp; schedule conflict flagged!</span>
                        </div>
                      )}

                      <div className="pt-2 border-t border-slate-100 text-right">
                        <button
                          onClick={() => navigate(`/projects/${p.id}`)}
                          className="text-emerald-600 hover:text-emerald-700 font-bold inline-flex items-center gap-1 text-[11px]"
                        >
                          <span>Open Coordination Details</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>

          {/* Map Overlay Floating Legend */}
          <div className="absolute top-4 left-4 z-[400] bg-white/95 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-slate-200 text-xs space-y-2 pointer-events-auto">
            <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider block">
              Jaipur GIS Overlay
            </span>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-600 ring-2 ring-rose-300" />
              <span className="text-slate-700">Conflict Flagged (&lt;500m)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-navy-900" />
              <span className="text-slate-700">Clear Municipal Project</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-200 border border-rose-400" />
              <span className="text-slate-700">Proximity Buffer Zone</span>
            </div>
          </div>
        </div>

        {/* Conflicts Sidebar Panel */}
        <div className="w-96 bg-white border-l border-slate-200/80 flex flex-col shrink-0 shadow-lg z-10">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <h3 className="font-bold text-slate-900 text-sm">Detected Conflicts</h3>
              </div>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                {conflicts.length}
              </span>
            </div>

            {/* Filter buttons */}
            <div className="grid grid-cols-4 gap-1 text-[11px]">
              {['ALL', 'DETECTED', 'UNDER_REVIEW', 'RESOLVED'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterConflictStatus(status)}
                  className={`py-1 rounded font-semibold transition-colors ${
                    filterConflictStatus === status
                      ? 'bg-slate-900 text-white'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {status === 'ALL'
                    ? 'All'
                    : status === 'DETECTED'
                    ? 'Active'
                    : status === 'UNDER_REVIEW'
                    ? 'Review'
                    : 'Done'}
                </button>
              ))}
            </div>
          </div>

          {/* Conflict List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-3 space-y-3">
            {loading ? (
              <p className="text-center py-8 text-xs text-slate-400">Loading spatial conflicts...</p>
            ) : filteredConflicts.length === 0 ? (
              <div className="text-center py-12 px-4 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="text-xs font-bold text-slate-700">No conflicts in this category</p>
                <p className="text-[11px] text-slate-400">
                  Select another filter or re-run spatial conflict scan.
                </p>
              </div>
            ) : (
              filteredConflicts.map((c) => (
                <div
                  key={c.id}
                  onClick={() => handleConflictClick(c)}
                  className="bg-slate-50/70 hover:bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 transition-all cursor-pointer group space-y-2 text-xs"
                >
                  <div className="flex justify-between items-start gap-1">
                    <StatusBadge status={c.status} />
                    <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      {c.distanceMeters}m away
                    </span>
                  </div>

                  {/* Project A vs Project B */}
                  <div className="space-y-1.5 pt-1">
                    <div className="border-l-2 border-blue-500 pl-2">
                      <p className="font-bold text-slate-900 truncate">{c.projectA?.title}</p>
                      <p className="text-[10px] text-slate-500">
                        {c.projectA?.owningDepartment?.name} ({c.projectA?.code})
                      </p>
                    </div>

                    <div className="border-l-2 border-emerald-500 pl-2">
                      <p className="font-bold text-slate-900 truncate">{c.projectB?.title}</p>
                      <p className="text-[10px] text-slate-500">
                        {c.projectB?.owningDepartment?.name} ({c.projectB?.code})
                      </p>
                    </div>
                  </div>

                  {/* Overlap timeline */}
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200/60">
                    <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>Schedule overlap: ~<strong>{c.scheduleOverlapDays} days</strong></span>
                  </div>

                  {/* Suggested Action */}
                  <div className="bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-100 text-[11px] text-slate-700 leading-relaxed">
                    <strong className="text-emerald-900 block mb-0.5">Suggested Coordination:</strong>
                    {c.suggestedAction}
                  </div>

                  {c.resolutionNote && (
                    <div className="text-[11px] text-slate-500 italic bg-white p-2 rounded border border-slate-100">
                      Note: {c.resolutionNote}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleInitiateCoordination(c.id)}
                      className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                    >
                      <MessagesSquare className="w-3 h-3" />
                      <span>Coordinate</span>
                    </button>

                    <button
                      onClick={() => handleOpenResolve(c)}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 shadow-sm"
                    >
                      Update Status
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal: Resolve / Review Conflict */}
      <Modal
        isOpen={showResolveModal}
        onClose={() => setShowResolveModal(false)}
        title="Review & Resolve Project Conflict"
      >
        <form onSubmit={handleResolveSubmit} className="space-y-4 text-xs">
          <p className="text-slate-600">
            Updating coordination resolution between <strong>{selectedConflict?.projectA?.title}</strong> and{' '}
            <strong>{selectedConflict?.projectB?.title}</strong>.
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
              placeholder="e.g. Agreement reached for common ducting; joint shift sequencing confirmed."
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
              Save Resolution
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
