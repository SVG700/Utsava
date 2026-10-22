import React from 'react';
import type { VendorStatus } from '@/schemas';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export interface VendorFormData {
  category: string;
  name: string;
  contact: string;
  quote: string;
  status: VendorStatus;
  notes: string;
}

interface VendorFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  editingVendorId: string | null;
  vendorForm: VendorFormData;
  setVendorForm: React.Dispatch<React.SetStateAction<VendorFormData>>;
  quoteError: string | null;
  setQuoteError: (err: string | null) => void;
}

export function VendorFormModal({
  isOpen,
  onClose,
  onSubmit,
  editingVendorId,
  vendorForm,
  setVendorForm,
  quoteError,
  setQuoteError,
}: VendorFormModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingVendorId ? 'Edit Vendor Details' : 'Add Vendor Category'}
      description="Enter your shortlisted or booked vendor contact details and quotes."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Input
          id="vendor-category-input"
          label="Vendor Category"
          required
          placeholder="e.g. Venue, Catering, Decor, Photography, Mehendi"
          value={vendorForm.category}
          onChange={(e) => setVendorForm({ ...vendorForm, category: e.target.value })}
        />

        <Input
          id="vendor-name-input"
          label="Vendor / Business Name"
          placeholder="e.g. Royal Marwar Caterers, LensCraft Studio"
          value={vendorForm.name}
          onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            id="vendor-contact-input"
            label="Contact Info / Phone"
            placeholder="+91 98765 43210 / manager@..."
            value={vendorForm.contact}
            onChange={(e) => setVendorForm({ ...vendorForm, contact: e.target.value })}
          />

          <div className="space-y-1">
            <Input
              id="vendor-quote-input"
              label="Quoted Amount (INR ₹)"
              type="number"
              step="any"
              min={0}
              placeholder="e.g. 150000"
              value={vendorForm.quote}
              onChange={(e) => {
                setQuoteError(null);
                setVendorForm({ ...vendorForm, quote: e.target.value });
              }}
            />
            {quoteError && (
              <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                {quoteError}
              </p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="vendor-form-status-select" className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
            Booking Status
          </label>
          <select
            id="vendor-form-status-select"
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
          <label htmlFor="vendor-form-notes" className="block text-xs font-medium text-stone-700 dark:text-stone-300">
            Notes & Scope
          </label>
          <textarea
            id="vendor-form-notes"
            rows={2}
            className="w-full px-3 py-2 rounded-xl border border-sand-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-forest-600"
            placeholder="Contract terms, deliverables, balance due date..."
            value={vendorForm.notes}
            onChange={(e) => setVendorForm({ ...vendorForm, notes: e.target.value })}
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-sand-200 dark:border-stone-800">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            {editingVendorId ? 'Save Changes' : 'Add Category'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
