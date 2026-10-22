import React, { useState } from 'react';
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Modal } from '@/components/ui/Modal';

describe('Modal Component', () => {
  const originalOffsetParent = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    'offsetParent',
  );

  beforeAll(() => {
    // In JSDOM, offsetParent is null by default. Mock it so elements attached to document are considered visible.
    Object.defineProperty(HTMLElement.prototype, 'offsetParent', {
      get() {
        return this.parentNode;
      },
      configurable: true,
    });
  });

  afterAll(() => {
    if (originalOffsetParent) {
      Object.defineProperty(HTMLElement.prototype, 'offsetParent', originalOffsetParent);
    } else {
      delete (HTMLElement.prototype as unknown as { offsetParent?: unknown }).offsetParent;
    }
  });

  function TestHarness({
    initialOpen = true,
    onClose = vi.fn(),
  }: {
    initialOpen?: boolean;
    onClose?: () => void;
  }) {
    const [open, setOpen] = useState(initialOpen);

    React.useEffect(() => {
      setOpen(initialOpen);
    }, [initialOpen]);

    const handleClose = () => {
      setOpen(false);
      onClose();
    };

    return (
      <div>
        <button id="trigger-btn" onClick={() => setOpen(true)}>
          Open Modal
        </button>
        <Modal
          isOpen={open}
          onClose={handleClose}
          title="Test Modal Title"
          description="Test description"
        >
          <div>
            <input id="input-field" placeholder="First focusable" />
            <button id="action-btn">Action Button</button>
            <button id="cancel-btn" onClick={handleClose}>
              Cancel
            </button>
          </div>
        </Modal>
      </div>
    );
  }

  it('renders title, description and accessible dialog role when open', () => {
    render(<TestHarness />);
    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByText('Test Modal Title')).toBeDefined();
    expect(screen.getByText('Test description')).toBeDefined();
  });

  it('moves focus inside the modal upon opening', async () => {
    vi.useFakeTimers();
    render(<TestHarness />);

    // Fast-forward 20ms to allow the focus timer in Modal to execute
    act(() => {
      vi.advanceTimersByTime(20);
    });

    const activeEl = document.activeElement;
    expect(activeEl).not.toBeNull();
    // First focusable element inside modal (either close button or first interactive element)
    const modal = screen.getByRole('dialog');
    expect(modal.contains(activeEl)).toBe(true);

    vi.useRealTimers();
  });

  it('calls onClose when Escape key is pressed', () => {
    const onClose = vi.fn();
    render(<TestHarness onClose={onClose} />);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when clicking close button or backdrop', () => {
    const onClose = vi.fn();
    render(<TestHarness onClose={onClose} />);

    const closeButton = screen.getByRole('button', { name: /close dialog/i });
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('traps Tab key navigation inside modal (wraps from last to first, and Shift+Tab from first to last)', () => {
    render(<TestHarness />);

    const modal = screen.getByRole('dialog');
    const focusable = Array.from(
      modal.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    );

    expect(focusable.length).toBeGreaterThan(1);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    // Focus last element and press Tab -> wraps to first
    last.focus();
    expect(document.activeElement).toBe(last);

    fireEvent.keyDown(window, { key: 'Tab', shiftKey: false });
    expect(document.activeElement).toBe(first);

    // Focus first element and press Shift+Tab -> wraps to last
    first.focus();
    expect(document.activeElement).toBe(first);

    fireEvent.keyDown(window, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(last);
  });

  it('restores focus to previous active element upon close', async () => {
    const { rerender } = render(<TestHarness initialOpen={false} />);

    const triggerBtn = screen.getByRole('button', { name: 'Open Modal' });
    triggerBtn.focus();
    expect(document.activeElement).toBe(triggerBtn);

    // Open the modal
    rerender(<TestHarness initialOpen={true} />);

    // Now close the modal by clicking cancel
    const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelBtn);

    // Focus should be restored to triggerBtn
    expect(document.activeElement).toBe(triggerBtn);
  });
});
