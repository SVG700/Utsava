'use client';

import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  Users,
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  Phone,
  Search,
  ShieldCheck,
} from 'lucide-react';
import type {
  StoredEvent,
  Vendor,
  VendorStatus,
  BudgetCategory,
  AIBlueprint,
} from '@/schemas';
import { formatINR } from '@/lib/budget';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';

interface VendorsTabProps {
  event: StoredEvent;
  blueprint: AIBlueprint | null;
  categories: BudgetCategory[];
  vendors: Vendor[];
  onUpdateVendors: (vendors: Vendor[]) => void;
}

export function VendorsTab({
  blueprint,
  categories,
  vendors,
  onUpdateVendors,
}: VendorsTabProps) {
  const [statusFilter, setStatusFilter] = useState<'all' | VendorStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Edit / Add Vendor Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendorId, setEditingVendorId] = useState<string | null>(null);
  const [vendorForm, setVendorForm] = useState({
    category: '',
    name: '',
    contact: '',
    quote: '',
    status: 'not-started' as VendorStatus,
    notes: '',
  });

  // Quick status toggle
  const handleStatusChange = (vendorId: string, newStatus: VendorStatus) => {
    const updated = vendors.map((v) =>
      v.id === vendorId ? { ...v, status: newStatus } : v
    );
    onUpdateVendors(updated);
  };

  // Open Edit Modal
  const handleOpenEdit = (vendor: Vendor) => {
    setEditingVendorId(vendor.id);
    setVendorForm({
      category: vendor.category,
      name: vendor.name || '',
      contact: vendor.contact || '',
      quote: vendor.quote !== undefined ? String(vendor.quote) : '',
      status: vendor.status,
      notes: vendor.notes || '',
    });
    setIsModalOpen(true);
  };

  // Open Add Category Modal
  const handleOpenAdd = () => {
    setEditingVendorId(null);
    setVendorForm({
      category: '',
      name: '',
      contact: '',
      quote: '',
      status: 'not-started',
      notes: '',
    });
    setIsModalOpen(true);
  };

  // Delete Vendor
  const handleDeleteVendor = (vendorId: string) => {
    onUpdateVendors(vendors.filter((v) => v.id !== vendorId));
  };

  // Save Vendor
  const handleSaveVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorForm.category.trim()) return;

    const quoteNum =
      vendorForm.quote.trim() !== '' ? Number(vendorForm.quote) : undefined;

    if (editingVendorId) {
      const updated = vendors.map((v) =>
        v.id === editingVendorId
          ? {
              ...v,
              category: vendorForm.category.trim(),
              name: vendorForm.name.trim(),
              contact: vendorForm.contact.trim(),
              quote: quoteNum,
              status: vendorForm.status,
              notes: vendorForm.notes.trim(),
            }
          : v
      );
      onUpdateVendors(updated);
    } else {
      const newVendor: Vendor = {
        id: uuidv4(),
        category: vendorForm.category.trim(),
        name: vendorForm.name.trim(),
        contact: vendorForm.contact.trim(),
        quote: quoteNum,
        status: vendorForm.status,
        notes: vendorForm.notes.trim(),
        suggestedByAI: false,
      };
      onUpdateVendors([...vendors, newVendor]);
    }
    setIsModalOpen(false);
  };

  // Filtered vendors
  const filteredVendors = vendors.filter((v) => {
    if (statusFilter !== 'all' && v.status !== statusFilter) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchCat = v.category.toLowerCase().includes(q);
      const matchName = v.name?.toLowerCase().includes(q);
      const matchContact = v.contact?.toLowerCase().includes(q);
      if (!matchCat && !matchName && !matchContact) return false;
    }
    return true;
  });

  const bookedCount = vendors.filter((v) => v.status === 'booked').length;
  const shortlistedCount = vendors.filter((v) => v.status === 'shortlisted').length;
  const notStartedCount = vendors.filter((v) => v.status === 'not-started').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Privacy Notice Banner */}
      <div className="p-4 rounded-2xl bg-forest-50/80 dark:bg-forest-950/40 border border-forest-200 dark:border-forest-800 text-xs text-forest-900 dark:text-forest-200 flex items-start gap-3 shadow-soft">
        <ShieldCheck className="w-4 h-4 text-forest-700 dark:text-forest-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="font-semibold text-forest-950 dark:text-forest-100">Privacy & Safety Notice:</strong> AI suggestions
          provide category checklists, budget benchmarks, and interview questions only. Utsava never
          invents fake vendor businesses or synthetic contact numbers. All names, quotes, and contacts
          below represent your real entries.
        </div>
      </div>

      {/* Checklist Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-forest-50 dark:bg-forest-950/60 flex items-center justify-center text-forest-700 dark:text-forest-400">
                  <Users className="w-4 h-4" />
                </div>
                <h2 className="text-lg font-bold text-forest-950 dark:text-forest-100">
                  Vendor Checklist & Quote Tracker
                </h2>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                Organize venue, catering, decor, photography, and music vendors. Compare quotes with estimated category targets.
              </p>
            </div>
            <Button size="sm" variant="primary" onClick={handleOpenAdd} className="gap-1.5 text-xs">
              <Plus className="w-3.5 h-3.5" /> Add Category
            </Button>
          </div>

          {/* Status Chips & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-6 pt-5 border-t border-sand-100 dark:border-stone-800/80">
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-full font-medium transition-all cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-forest-900 text-white shadow-xs dark:bg-forest-600'
                    : 'bg-sand-100/80 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-sand-200/80 dark:hover:bg-stone-700'
                }`}
              >
                All ({vendors.length})
              </button>
              <button
                onClick={() => setStatusFilter('booked')}
                className={`px-3 py-1.5 rounded-full font-medium transition-all cursor-pointer ${
                  statusFilter === 'booked'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-sand-100/80 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-sand-200/80 dark:hover:bg-stone-700'
                }`}
              >
                Booked ({bookedCount})
              </button>
              <button
                onClick={() => setStatusFilter('shortlisted')}
                className={`px-3 py-1.5 rounded-full font-medium transition-all cursor-pointer ${
                  statusFilter === 'shortlisted'
                    ? 'bg-amber-700 text-white shadow-xs'
                    : 'bg-sand-100/80 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-sand-200/80 dark:hover:bg-stone-700'
                }`}
              >
                Shortlisted ({shortlistedCount})
              </button>
              <button
                onClick={() => setStatusFilter('not-started')}
                className={`px-3 py-1.5 rounded-full font-medium transition-all cursor-pointer ${
                  statusFilter === 'not-started'
                    ? 'bg-stone-700 text-white shadow-xs'
                    : 'bg-sand-100/80 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-sand-200/80 dark:hover:bg-stone-700'
                }`}
              >
                Pending ({notStartedCount})
              </button>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search vendor or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl border border-sand-300 dark:border-stone-800 bg-white dark:bg-stone-900 text-xs w-full sm:w-56 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-forest-600"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vendors List */}
      {filteredVendors.length === 0 ? (
        <Card className="text-center py-14 border-dashed bg-sand-50/30 dark:bg-stone-900/30">
          <Users className="w-10 h-10 text-stone-300 dark:text-stone-600 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-300">
            {vendors.length === 0
              ? 'No vendor categories defined yet.'
              : 'No vendors match your filter.'}
          </h3>
          <p className="text-xs text-stone-400 max-w-sm mx-auto mt-1 mb-4">
            Generate your AI blueprint to populate standard categories or add your own.
          </p>
          <Button size="sm" variant="outline" onClick={handleOpenAdd}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Vendor Category
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredVendors.map((v) => {
            // Find corresponding budget category using stored budgetCategoryId with fallback to name
            const matchCat = categories.find((c) =>
              v.budgetCategoryId
                ? c.id === v.budgetCategoryId
                : c.name.toLowerCase() === v.category.toLowerCase()
            );
            const estBudget = matchCat?.estimatedAmount;

            // Find AI tips from blueprint
            const aiCategory = blueprint?.vendorCategories?.find(
              (vc) => vc.category.toLowerCase() === v.category.toLowerCase()
            );

            // Quote vs Target comparison
            let quoteDiffText: string | null = null;
            let isQuoteOver = false;
            if (v.quote !== undefined && estBudget !== undefined) {
              const diff = v.quote - estBudget;
              if (diff > 0) {
                quoteDiffText = `₹${diff.toLocaleString('en-IN')} above target`;
                isQuoteOver = true;
              } else if (diff < 0) {
                quoteDiffText = `₹${Math.abs(diff).toLocaleString('en-IN')} within target`;
              } else {
                quoteDiffText = `Matches target exactly`;
              }
            }

            return (
              <Card
                key={v.id}
                className="hover:border-forest-300 dark:hover:border-forest-700 transition-all flex flex-col justify-between shadow-soft"
              >
                <CardContent className="p-5 space-y-3.5">
                  {/* Category & Status Row */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-forest-700 dark:text-forest-400 block">
                        Category
                      </span>
                      <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">
                        {v.category}
                      </h3>
                      {estBudget !== undefined && (
                        <span className="text-[11px] text-stone-500">
                          Target Budget: <strong className="font-semibold text-stone-700 dark:text-stone-300">{formatINR(estBudget)}</strong>
                        </span>
                      )}
                    </div>

                    <select
                      value={v.status}
                      onChange={(e) =>
                        handleStatusChange(v.id, e.target.value as VendorStatus)
                      }
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none focus:ring-1 focus:ring-forest-600 ${
                        v.status === 'booked'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                          : v.status === 'shortlisted'
                          ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                          : 'bg-sand-100 text-stone-700 border-sand-300 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700'
                      }`}
                    >
                      <option value="not-started">Pending</option>
                      <option value="shortlisted">Shortlisted</option>
                      <option value="booked">Booked</option>
                    </select>
                  </div>

                  {/* User-entered Vendor Data */}
                  <div className="p-3.5 rounded-xl bg-sand-50/70 dark:bg-stone-900/60 border border-sand-200/80 dark:border-stone-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-stone-400">
                        Vendor Information
                      </span>
                      <button
                        onClick={() => handleOpenEdit(v)}
                        className="text-forest-700 dark:text-forest-400 hover:underline flex items-center gap-1 text-[11px] font-medium"
                      >
                        <Edit2 className="w-3 h-3" /> Edit Info
                      </button>
                    </div>

                    <div>
                      <span className="text-stone-500 block text-[11px]">Vendor Name:</span>
                      <span className="font-semibold text-stone-900 dark:text-stone-100">
                        {v.name || 'Not yet chosen (click Edit)'}
                      </span>
                    </div>

                    {v.contact && (
                      <div className="flex items-center gap-1.5 text-stone-600 dark:text-stone-300">
                        <Phone className="w-3 h-3 text-stone-400" />
                        <span>{v.contact}</span>
                      </div>
                    )}

                    {v.quote !== undefined ? (
                      <div className="pt-1 flex items-baseline justify-between">
                        <div>
                          <span className="text-stone-500 block text-[11px]">Quote:</span>
                          <span className="font-extrabold text-sm text-stone-900 dark:text-stone-100">
                            {formatINR(v.quote)}
                          </span>
                        </div>
                        {quoteDiffText && (
                          <span
                            className={`text-[11px] font-semibold ${
                              isQuoteOver
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-emerald-700 dark:text-emerald-400'
                            }`}
                          >
                            {quoteDiffText}
                          </span>
                        )}
                      </div>
                    ) : null}

                    {v.notes && (
                      <p className="text-[11px] text-stone-500 italic pt-1.5 border-t border-sand-200/60 dark:border-stone-800">
                        &ldquo;{v.notes}&rdquo;
                      </p>
                    )}
                  </div>

                  {/* AI Interview Tips / Questions */}
                  {aiCategory && aiCategory.tips && aiCategory.tips.length > 0 && (
                    <div className="pt-1">
                      <span className="text-[10px] font-bold text-forest-800 dark:text-forest-300 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-forest-600" /> AI Interview Tips:
                      </span>
                      <ul className="text-[11px] text-stone-600 dark:text-stone-400 space-y-1 list-disc pl-4">
                        {aiCategory.tips.slice(0, 2).map((tip, i) => (
                          <li key={i}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>

                <div className="p-3 bg-sand-50/50 dark:bg-stone-900/50 border-t border-sand-100 dark:border-stone-800 flex justify-end gap-2">
                  <button
                    onClick={() => handleDeleteVendor(v.id)}
                    className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="Remove category"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit / Add Vendor Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingVendorId ? 'Edit Vendor Details' : 'Add Vendor Category'}
        description="Enter your shortlisted or booked vendor contact details and quotes."
      >
        <form onSubmit={handleSaveVendor} className="space-y-4">
          <Input
            label="Vendor Category"
            required
            placeholder="e.g. Venue, Catering, Decor, Photography, Mehendi"
            value={vendorForm.category}
            onChange={(e) => setVendorForm({ ...vendorForm, category: e.target.value })}
          />

          <Input
            label="Vendor / Business Name"
            placeholder="e.g. Royal Marwar Caterers, LensCraft Studio"
            value={vendorForm.name}
            onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Contact Info / Phone"
              placeholder="+91 98765 43210 / manager@..."
              value={vendorForm.contact}
              onChange={(e) => setVendorForm({ ...vendorForm, contact: e.target.value })}
            />

            <Input
              label="Quoted Amount (INR ₹)"
              type="number"
              min={0}
              placeholder="e.g. 150000"
              value={vendorForm.quote}
              onChange={(e) => setVendorForm({ ...vendorForm, quote: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
              Booking Status
            </label>
            <select
              value={vendorForm.status}
              onChange={(e) =>
                setVendorForm({ ...vendorForm, status: e.target.value as VendorStatus })
              }
              className="w-full px-3 py-2.5 rounded-xl border border-sand-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-forest-600"
            >
              <option value="not-started">Pending / Not Started</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="booked">Booked (Confirmed)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-stone-700 dark:text-stone-300">
              Notes
            </label>
            <textarea
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-sand-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-forest-600"
              placeholder="Contract terms, deliverables, balance due date..."
              value={vendorForm.notes}
              onChange={(e) => setVendorForm({ ...vendorForm, notes: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-sand-200 dark:border-stone-800">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editingVendorId ? 'Save Changes' : 'Add Category'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
