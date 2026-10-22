'use client';

import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Users, Plus, Search, ShieldCheck } from 'lucide-react';
import type { StoredEvent, Vendor, VendorStatus, BudgetCategory, AIBlueprint } from '@/schemas';
import { formatINR } from '@/lib/budget';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { UndoToast } from '@/components/ui/UndoToast';
import { useUndo } from '@/hooks/useUndo';
import { VendorCard } from './vendors/VendorCard';
import { VendorFormModal, type VendorFormData } from './vendors/VendorFormModal';

interface VendorsTabProps {
  event: StoredEvent;
  blueprint: AIBlueprint | null;
  categories: BudgetCategory[];
  vendors: Vendor[];
  onUpdateVendors: (vendors: Vendor[]) => void;
}

const UNDO_WINDOW_MS = 6000;

/** Vendor Checklist tab: AI-suggested vendor cards, quotes and booking status. */
export function VendorsTab({ blueprint, categories, vendors, onUpdateVendors }: VendorsTabProps) {
  const [statusFilter, setStatusFilter] = useState<'all' | VendorStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Edit / Add Vendor Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendorId, setEditingVendorId] = useState<string | null>(null);
  const [vendorToDelete, setVendorToDelete] = useState<Vendor | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const undo = useUndo<Vendor>(UNDO_WINDOW_MS);
  const [vendorForm, setVendorForm] = useState<VendorFormData>({
    category: '',
    name: '',
    contact: '',
    quote: '',
    status: 'not-started',
    notes: '',
  });

  // Quick status toggle
  const handleStatusChange = (vendorId: string, newStatus: VendorStatus) => {
    const updated = vendors.map((v) => (v.id === vendorId ? { ...v, status: newStatus } : v));
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

  // Delete Vendor with confirmation and undo
  const handleRequestDeleteVendor = (vendor: Vendor) => {
    setVendorToDelete(vendor);
  };

  const handleConfirmDeleteVendor = () => {
    if (!vendorToDelete) return;
    onUpdateVendors(vendors.filter((v) => v.id !== vendorToDelete.id));
    undo.offer(vendorToDelete);
    setVendorToDelete(null);
  };

  const handleUndoDeleteVendor = () => {
    if (!undo.item) return;
    onUpdateVendors([...vendors, undo.item]);
    undo.dismiss();
  };

  // Save Vendor
  const handleSaveVendor = (e: React.FormEvent) => {
    e.preventDefault();
    setQuoteError(null);
    if (!vendorForm.category.trim()) return;

    let quoteNum: number | undefined;
    if (vendorForm.quote.trim() !== '') {
      const parsed = Number(vendorForm.quote);
      if (!Number.isFinite(parsed) || parsed < 0) {
        setQuoteError('Quote must be a valid positive amount.');
        return;
      }
      quoteNum = Math.round(parsed);
    }

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
              source: 'user' as const,
            }
          : v,
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
        source: 'user' as const,
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

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Privacy Notice Banner */}
      <div className="p-4 rounded-2xl bg-forest-50/80 dark:bg-forest-950/40 border border-forest-200 dark:border-forest-800 text-xs text-forest-900 dark:text-forest-200 flex items-start gap-3 shadow-soft">
        <ShieldCheck className="w-4 h-4 text-forest-700 dark:text-forest-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="font-semibold text-forest-950 dark:text-forest-100">
            Privacy & Safety Notice:
          </strong>{' '}
          AI suggestions provide category checklists, budget benchmarks, and interview questions
          only. Utsava never invents fake vendor businesses or synthetic contact numbers. All names,
          quotes, and contacts below represent your real entries.
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
                Track status across {vendors.length} vendor categories. Compare actual quotes with
                target allocations.
              </p>
            </div>

            <Button
              onClick={handleOpenAdd}
              variant="primary"
              size="sm"
              className="gap-2 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Add Category</span>
            </Button>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 pt-5 mt-5 border-t border-sand-200 dark:border-stone-800">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                placeholder="Search by category, vendor name or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                aria-label="Search vendors"
              />
            </div>

            <div
              className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0"
              role="group"
              aria-label="Filter vendors by status"
            >
              {(['all', 'not-started', 'shortlisted', 'booked'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  aria-pressed={statusFilter === st}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    statusFilter === st
                      ? 'bg-forest-800 text-white dark:bg-forest-600 shadow-soft'
                      : 'bg-sand-100 text-stone-600 hover:bg-sand-200 dark:bg-stone-800 dark:text-stone-400'
                  }`}
                >
                  {st === 'all'
                    ? 'All'
                    : st === 'not-started'
                      ? 'Pending'
                      : st === 'shortlisted'
                        ? 'Shortlisted'
                        : 'Booked'}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vendor Cards Grid */}
      {filteredVendors.length === 0 ? (
        <Card className="text-center py-12 border-dashed bg-sand-50/50 dark:bg-stone-900/50">
          <p className="text-xs text-stone-500">No vendor categories match your filter.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVendors.map((v) => (
            <VendorCard
              key={v.id}
              vendor={v}
              categories={categories}
              blueprint={blueprint}
              onStatusChange={handleStatusChange}
              onOpenEdit={handleOpenEdit}
              onRequestDelete={handleRequestDeleteVendor}
            />
          ))}
        </div>
      )}

      {/* Edit / Add Vendor Modal */}
      <VendorFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveVendor}
        editingVendorId={editingVendorId}
        vendorForm={vendorForm}
        setVendorForm={setVendorForm}
        quoteError={quoteError}
        setQuoteError={setQuoteError}
      />

      {/* Confirm Vendor Deletion Modal */}
      <Modal
        isOpen={Boolean(vendorToDelete)}
        onClose={() => setVendorToDelete(null)}
        title="Confirm Vendor Deletion"
        description="Are you sure you want to delete this vendor record? You can immediately undo this action."
        maxWidth="sm"
      >
        <div className="space-y-4">
          {vendorToDelete && (
            <div className="p-3 rounded-xl bg-sand-50 dark:bg-stone-900 border border-sand-200 dark:border-stone-800 text-xs space-y-1">
              <p className="font-semibold text-stone-900 dark:text-stone-100">
                {vendorToDelete.category}
              </p>
              {vendorToDelete.name && <p className="text-stone-500">Name: {vendorToDelete.name}</p>}
              {vendorToDelete.quote !== undefined && (
                <p className="text-stone-500">Quote: {formatINR(vendorToDelete.quote)}</p>
              )}
            </div>
          )}
          <div className="flex justify-end gap-2.5">
            <Button variant="outline" size="sm" onClick={() => setVendorToDelete(null)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleConfirmDeleteVendor}>
              Delete Vendor
            </Button>
          </div>
        </div>
      </Modal>

      {undo.item && (
        <UndoToast onUndo={handleUndoDeleteVendor}>
          Vendor &ldquo;{undo.item.category}&rdquo; deleted
        </UndoToast>
      )}
    </div>
  );
}
