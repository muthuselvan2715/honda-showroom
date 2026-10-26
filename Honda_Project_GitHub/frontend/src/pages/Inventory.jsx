import React, { useState, useEffect } from 'react';
import {
  Bike,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle,
  Eye,
  Edit2,
  Trash2,
  Layers,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { ConfirmModal } from '../components/ConfirmModal';
import { formatINR, formatDate } from '../utils/formatters';

export const Inventory = () => {
  const [activeTab, setActiveTab] = useState('units'); // 'units' | 'models'
  const { isAdmin } = useAuth();
  const { showSuccess, showError } = useNotification();

  // Models State
  const [models, setModels] = useState([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [editingModel, setEditingModel] = useState(null);
  const [modelFormData, setModelFormData] = useState({
    modelName: '',
    variant: '',
    modelYear: 2026,
    category: 'Scooter',
    colours: 'Pearl Siren Blue, Rebel Red Metallic, Black',
    engineCapacityCc: 109.51,
    basePrice: '',
    reorderThreshold: 3,
    description: '',
  });

  // Physical Units State
  const [units, setUnits] = useState([]);
  const [unitsLoading, setUnitsLoading] = useState(false);
  const [unitsTotal, setUnitsTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [modelFilter, setModelFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Unit Modals
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [unitFormData, setUnitFormData] = useState({
    chassisNumber: '',
    engineNumber: '',
    model: '',
    colour: '',
    variant: '',
    purchaseCost: '',
    location: 'Showroom Floor',
    notes: '',
  });

  const [unitToDelete, setUnitToDelete] = useState(null);
  const [isDeletingUnit, setIsDeletingUnit] = useState(false);

  // Fetch models
  const fetchModels = async () => {
    setModelsLoading(true);
    try {
      const res = await api.get('/bike-models');
      setModels(res.data.bikeModels || []);
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to fetch motorcycle models');
    } finally {
      setModelsLoading(false);
    }
  };

  // Fetch physical units
  const fetchUnits = async () => {
    setUnitsLoading(true);
    try {
      const params = {
        page,
        limit: 12,
        ...(statusFilter && { status: statusFilter }),
        ...(modelFilter && { model: modelFilter }),
        ...(searchQuery && { search: searchQuery }),
      };
      const res = await api.get('/bike-units', { params });
      setUnits(res.data.units || []);
      setUnitsTotal(res.data.total || 0);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to load physical bike units');
    } finally {
      setUnitsLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  useEffect(() => {
    fetchUnits();
  }, [page, statusFilter, modelFilter, searchQuery]);

  // Model Submit handler
  const handleModelSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...modelFormData,
        colours: typeof modelFormData.colours === 'string'
          ? modelFormData.colours.split(',').map((c) => c.trim()).filter(Boolean)
          : modelFormData.colours,
        modelYear: Number(modelFormData.modelYear),
        engineCapacityCc: Number(modelFormData.engineCapacityCc),
        basePrice: Number(modelFormData.basePrice),
        reorderThreshold: Number(modelFormData.reorderThreshold),
      };

      if (editingModel) {
        await api.put(`/bike-models/${editingModel._id}`, payload);
        showSuccess('Motorcycle model updated successfully');
      } else {
        await api.post('/bike-models', payload);
        showSuccess('New motorcycle model catalogued successfully');
      }

      setIsModelModalOpen(false);
      setEditingModel(null);
      fetchModels();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to save bike model');
    }
  };

  // Unit Submit handler
  const handleUnitSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...unitFormData,
        purchaseCost: Number(unitFormData.purchaseCost),
      };

      await api.post('/bike-units', payload);
      showSuccess(`Bike unit (VIN: ${payload.chassisNumber}) added to inventory!`);
      setIsUnitModalOpen(false);
      setUnitFormData({
        chassisNumber: '',
        engineNumber: '',
        model: '',
        colour: '',
        variant: '',
        purchaseCost: '',
        location: 'Showroom Floor',
        notes: '',
      });
      fetchUnits();
      fetchModels(); // Update derived model counts
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to register physical bike unit');
    }
  };

  // Delete Unit confirmation
  const confirmDeleteUnit = async () => {
    if (!unitToDelete) return;
    setIsDeletingUnit(true);
    try {
      await api.delete(`/bike-units/${unitToDelete._id}`);
      showSuccess(`Unit ${unitToDelete.chassisNumber} deleted from inventory`);
      setUnitToDelete(null);
      fetchUnits();
      fetchModels();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to delete bike unit');
    } finally {
      setIsDeletingUnit(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Motorcycle Inventory</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Physical chassis & VIN unit tracking derived directly from database records
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'units' ? (
            <button
              onClick={() => setIsUnitModalOpen(true)}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-red-600/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Stock In New Bike Unit</span>
            </button>
          ) : (
            isAdmin && (
              <button
                onClick={() => {
                  setEditingModel(null);
                  setModelFormData({
                    modelName: '',
                    variant: '',
                    modelYear: 2026,
                    category: 'Scooter',
                    colours: 'Pearl Siren Blue, Rebel Red Metallic, Black',
                    engineCapacityCc: 109.51,
                    basePrice: '',
                    reorderThreshold: 3,
                    description: '',
                  });
                  setIsModelModalOpen(true);
                }}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-red-600/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add Bike Model</span>
              </button>
            )
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('units')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'units'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Physical Bike Units ({unitsTotal})</span>
        </button>
        <button
          onClick={() => setActiveTab('models')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'models'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Bike className="w-4 h-4" />
          <span>Model Catalog ({models.length})</span>
        </button>
      </div>

      {/* TAB 1: PHYSICAL UNITS (VIN & CHASSIS TRACKER) */}
      {activeTab === 'units' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search VIN, chassis, or engine..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:border-red-600"
              >
                <option value="">All Statuses</option>
                <option value="available">Available</option>
                <option value="reserved">Reserved</option>
                <option value="sold">Sold</option>
              </select>

              <select
                value={modelFilter}
                onChange={(e) => {
                  setModelFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:border-red-600 max-w-[200px]"
              >
                <option value="">All Models</option>
                {models.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.modelName} ({m.variant})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Physical Units Grid / Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                    <th className="py-3 px-4">Chassis / VIN</th>
                    <th className="py-3 px-4">Engine Number</th>
                    <th className="py-3 px-4">Model & Variant</th>
                    <th className="py-3 px-4">Colour</th>
                    <th className="py-3 px-4">Dealer Cost</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {unitsLoading ? (
                    <tr>
                      <td colSpan="8" className="py-12 text-center text-slate-400">
                        Loading physical inventory...
                      </td>
                    </tr>
                  ) : units.length > 0 ? (
                    units.map((unit) => (
                      <tr key={unit._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {unit.chassisNumber}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">
                          {unit.engineNumber}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-800 block">
                            {unit.model?.modelName || '—'}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {unit.variant} • {unit.model?.modelYear || ''}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                            {unit.colour}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-medium text-slate-700">
                          {formatINR(unit.purchaseCost)}
                        </td>
                        <td className="py-3 px-4">
                          <Badge status={unit.status} />
                        </td>
                        <td className="py-3 px-4 text-slate-600">{unit.location}</td>
                        <td className="py-3 px-4 text-right">
                          {isAdmin && unit.status !== 'sold' && (
                            <button
                              onClick={() => setUnitToDelete(unit)}
                              title="Delete unit"
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="py-12 text-center text-slate-400">
                        No physical bike units match the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Showing page {page} of {totalPages} ({unitsTotal} units)
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-2 font-medium text-slate-800">{page}</span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MODEL CATALOG WITH DERIVED UNIT COUNTS */}
      {activeTab === 'models' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {models.map((model) => (
            <div
              key={model._id}
              className={`bg-white rounded-2xl border p-5 shadow-sm transition-all flex flex-col justify-between ${
                model.stock?.isLowStock ? 'border-amber-300' : 'border-slate-200/80'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider block">
                      {model.category}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                      {model.modelName}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">{model.variant} • {model.modelYear}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-extrabold text-slate-900 font-mono block">
                      {formatINR(model.basePrice)}
                    </span>
                    <span className="text-[10px] text-slate-400 block">Ex-Showroom</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 mt-3 line-clamp-2 leading-relaxed">
                  {model.description || 'Reliable Honda four-stroke performance and efficiency.'}
                </p>

                {/* Colours Pills */}
                <div className="flex flex-wrap gap-1 mt-3">
                  {model.colours?.map((c, idx) => (
                    <span key={idx} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              {/* Physical Inventory Stats (Derived) */}
              <div className="mt-5 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-slate-500 font-medium">Physical Stock Status:</span>
                  {model.stock?.isLowStock && (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Low Stock
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-emerald-50 border border-emerald-100 p-2 rounded-xl">
                    <span className="text-[10px] text-emerald-700 font-bold uppercase block">Available</span>
                    <span className="text-base font-black text-emerald-800 font-mono">
                      {model.stock?.available || 0}
                    </span>
                  </div>
                  <div className="bg-amber-50 border border-amber-100 p-2 rounded-xl">
                    <span className="text-[10px] text-amber-700 font-bold uppercase block">Reserved</span>
                    <span className="text-base font-black text-amber-800 font-mono">
                      {model.stock?.reserved || 0}
                    </span>
                  </div>
                  <div className="bg-slate-100 border border-slate-200 p-2 rounded-xl">
                    <span className="text-[10px] text-slate-600 font-bold uppercase block">Sold</span>
                    <span className="text-base font-black text-slate-800 font-mono">
                      {model.stock?.sold || 0}
                    </span>
                  </div>
                </div>

                {isAdmin && (
                  <div className="mt-3 flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setEditingModel(model);
                        setModelFormData({
                          modelName: model.modelName,
                          variant: model.variant,
                          modelYear: model.modelYear,
                          category: model.category,
                          colours: model.colours?.join(', ') || '',
                          engineCapacityCc: model.engineCapacityCc,
                          basePrice: model.basePrice,
                          reorderThreshold: model.reorderThreshold,
                          description: model.description || '',
                        });
                        setIsModelModalOpen(true);
                      }}
                      className="text-xs text-slate-600 hover:text-slate-900 font-semibold p-1 hover:bg-slate-100 rounded-lg flex items-center gap-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit Spec</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: STOCK IN NEW PHYSICAL BIKE UNIT */}
      <Modal
        isOpen={isUnitModalOpen}
        onClose={() => setIsUnitModalOpen(false)}
        title="Stock-In Physical Motorcycle Unit"
      >
        <form onSubmit={handleUnitSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Chassis / VIN Number *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. ME4JF501LK000555"
                value={unitFormData.chassisNumber}
                onChange={(e) => setUnitFormData({ ...unitFormData, chassisNumber: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:border-red-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Engine Number *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. JF50E700555"
                value={unitFormData.engineNumber}
                onChange={(e) => setUnitFormData({ ...unitFormData, engineNumber: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:border-red-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Bike Model Catalog *
              </label>
              <select
                required
                value={unitFormData.model}
                onChange={(e) => {
                  const selected = models.find((m) => m._id === e.target.value);
                  setUnitFormData({
                    ...unitFormData,
                    model: e.target.value,
                    variant: selected?.variant || '',
                    colour: selected?.colours?.[0] || '',
                  });
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-red-600"
              >
                <option value="">Select Motorcycle Model</option>
                {models.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.modelName} ({m.variant}) — ₹{m.basePrice}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Colour *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Pearl Siren Blue"
                value={unitFormData.colour}
                onChange={(e) => setUnitFormData({ ...unitFormData, colour: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-red-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Dealer Purchase Cost (₹) *
              </label>
              <input
                type="number"
                required
                min="0"
                placeholder="e.g. 68000"
                value={unitFormData.purchaseCost}
                onChange={(e) => setUnitFormData({ ...unitFormData, purchaseCost: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:border-red-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Location in Showroom
              </label>
              <input
                type="text"
                placeholder="e.g. Showroom Floor / Warehouse A"
                value={unitFormData.location}
                onChange={(e) => setUnitFormData({ ...unitFormData, location: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-red-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Internal Notes
            </label>
            <textarea
              rows="2"
              placeholder="e.g. Battery tested, inspected for scratch-free delivery"
              value={unitFormData.notes}
              onChange={(e) => setUnitFormData({ ...unitFormData, notes: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-red-600"
            ></textarea>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsUnitModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow"
            >
              Confirm Unit Stock-In
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: ADD / EDIT BIKE MODEL CATALOG */}
      <Modal
        isOpen={isModelModalOpen}
        onClose={() => setIsModelModalOpen(false)}
        title={editingModel ? 'Update Model Specifications' : 'Catalog New Motorcycle Model'}
      >
        <form onSubmit={handleModelSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Model Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Activa 6G / Shine 125"
                value={modelFormData.modelName}
                onChange={(e) => setModelFormData({ ...modelFormData, modelName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-red-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Variant *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Deluxe / H-Smart / Disc"
                value={modelFormData.variant}
                onChange={(e) => setModelFormData({ ...modelFormData, variant: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-red-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Model Year *
              </label>
              <input
                type="number"
                required
                min="2020"
                max="2035"
                value={modelFormData.modelYear}
                onChange={(e) => setModelFormData({ ...modelFormData, modelYear: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:border-red-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={modelFormData.category}
                onChange={(e) => setModelFormData({ ...modelFormData, category: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-red-600"
              >
                <option value="Scooter">Scooter</option>
                <option value="Commuter">Commuter</option>
                <option value="Street">Street</option>
                <option value="Cruiser">Cruiser</option>
                <option value="Adventure">Adventure</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Displacement (CC) *
              </label>
              <input
                type="number"
                required
                step="0.1"
                min="50"
                placeholder="e.g. 109.5"
                value={modelFormData.engineCapacityCc}
                onChange={(e) => setModelFormData({ ...modelFormData, engineCapacityCc: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:border-red-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Base Ex-Showroom Price (₹) *
              </label>
              <input
                type="number"
                required
                min="0"
                placeholder="e.g. 76684"
                value={modelFormData.basePrice}
                onChange={(e) => setModelFormData({ ...modelFormData, basePrice: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:border-red-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Reorder Threshold (Low Stock Alert)
              </label>
              <input
                type="number"
                required
                min="1"
                value={modelFormData.reorderThreshold}
                onChange={(e) => setModelFormData({ ...modelFormData, reorderThreshold: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:border-red-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Color Options (comma-separated)
            </label>
            <input
              type="text"
              placeholder="e.g. Pearl Siren Blue, Rebel Red Metallic, Black"
              value={modelFormData.colours}
              onChange={(e) => setModelFormData({ ...modelFormData, colours: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-red-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Description / Key Features
            </label>
            <textarea
              rows="2"
              value={modelFormData.description}
              onChange={(e) => setModelFormData({ ...modelFormData, description: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-red-600"
            ></textarea>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModelModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow"
            >
              Save Bike Model
            </button>
          </div>
        </form>
      </Modal>

      {/* CONFIRM DELETE MODAL */}
      <ConfirmModal
        isOpen={Boolean(unitToDelete)}
        onClose={() => setUnitToDelete(null)}
        onConfirm={confirmDeleteUnit}
        title="Remove Bike Unit from Inventory"
        message={`Are you sure you want to delete physical bike unit with Chassis/VIN '${unitToDelete?.chassisNumber}'? This action cannot be reversed.`}
        confirmText="Delete Unit"
        isLoading={isDeletingUnit}
      />
    </div>
  );
};
