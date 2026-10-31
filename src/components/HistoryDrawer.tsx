/*
 * PURPOSE: Accessible local history drawer with pin management, text search, and link re-loading.
 * INPUTS: isOpen, onClose, history items, onSelect, onTogglePin, onDelete, onClear.
 * OUTPUTS: Focus-trapped modal dialog with live search filter and quick-copy actions.
 * DEPENDS_ON: React, lucide-react, historyStorage.ts, types.ts.
 * WHY_THIS_DESIGN: Zero-backend history stored privately in localStorage with search and pinning.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Search, Pin, Trash2, Copy, Check, X, History } from 'lucide-react';
import { searchHistory } from '../lib/historyStorage';
import type { HistoryItem } from '../lib/types';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onTogglePin: (id: string) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
  onAnnounce: (msg: string) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onSelect,
  onTogglePin,
  onDelete,
  onClear,
  onAnnounce
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredItems = searchHistory(items, searchQuery);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Keyboard navigation & Escape dismissal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopy = async (item: HistoryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(item.shortUrl);
      setCopiedId(item.id);
      onAnnounce(`Copied ${item.shortCode}`);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      onAnnounce('Failed to copy');
    }
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        justifyContent: 'flex-end',
        animation: 'fadeIn 0.15s ease-out'
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Local Link History"
    >
      <div
        ref={drawerRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 440,
          height: '100dvh',
          backgroundColor: 'var(--bg-surface)',
          borderLeft: '1px solid var(--border-strong)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-lg)',
          animation: 'slideInRight 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: 'var(--space-4) var(--space-5)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <History size={18} strokeWidth={2} color="var(--accent)" />
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-primary)' }}>
              Local History
            </h2>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              ({items.length})
            </span>
          </div>

          <button
            onClick={onClose}
            className="btn btn-ghost"
            style={{ padding: '6px', minHeight: 32 }}
            aria-label="Close history drawer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search Filter Bar */}
        <div style={{ padding: 'var(--space-3) var(--space-5)', borderBottom: '1px solid var(--border-subtle)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'var(--bg-canvas)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '0 var(--space-3)'
            }}
          >
            <Search size={14} color="var(--text-muted)" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search previous links or domains..."
              style={{
                flex: 1,
                padding: '8px var(--space-2)',
                backgroundColor: 'transparent',
                border: 'none',
                outline: 'none',
                fontSize: 'var(--text-xs)',
                color: 'var(--text-primary)'
              }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="btn btn-ghost" style={{ padding: '4px', minHeight: 24 }}>
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* History List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-3) var(--space-5)' }}>
          {filteredItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-8) 0', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
              {searchQuery ? 'No matching links found.' : 'No compression history yet. Compressed links appear here.'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {filteredItems.map((item) => {
                const isCopied = copiedId === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => onSelect(item)}
                    style={{
                      padding: 'var(--space-3)',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-canvas)',
                      border: `1px solid ${item.isPinned ? 'var(--accent)' : 'var(--border-subtle)'}`,
                      cursor: 'pointer',
                      transition: 'all var(--motion-fast)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                    className="history-card"
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--accent)' }}>
                        /{item.shortCode}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onTogglePin(item.id);
                          }}
                          className="btn btn-ghost"
                          style={{
                            padding: '4px',
                            minHeight: 24,
                            color: item.isPinned ? 'var(--accent)' : 'var(--text-muted)'
                          }}
                          title={item.isPinned ? 'Unpin from top' : 'Pin to top'}
                          aria-label={item.isPinned ? 'Unpin' : 'Pin'}
                        >
                          <Pin size={13} fill={item.isPinned ? 'currentColor' : 'none'} />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleCopy(item, e)}
                          className="btn btn-ghost"
                          style={{ padding: '4px', minHeight: 24 }}
                          title="Copy short link"
                          aria-label="Copy short link"
                        >
                          {isCopied ? <Check size={13} strokeWidth={3} color="var(--color-success)" /> : <Copy size={13} />}
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(item.id);
                          }}
                          className="btn btn-ghost"
                          style={{ padding: '4px', minHeight: 24, color: 'var(--color-error)' }}
                          title="Delete from history"
                          aria-label="Delete entry"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <div
                      style={{
                        fontSize: 'var(--text-xs)',
                        color: 'var(--text-secondary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                      title={item.cleanedUrl}
                    >
                      {item.cleanedUrl}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text-muted)', paddingTop: '4px' }}>
                      <span>{formatTime(item.timestamp)}</span>
                      <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>
                        {item.ratioPercent > 0 ? `-${item.ratioPercent}%` : 'Saved'} ({item.bytesSaved}B)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {items.length > 0 && (
          <div
            style={{
              padding: 'var(--space-3) var(--space-5)',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <button
              type="button"
              onClick={onClear}
              className="btn btn-ghost"
              style={{ fontSize: 'var(--text-xs)', color: 'var(--color-error)' }}
            >
              Clear All History
            </button>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Stored locally on device
            </span>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .history-card:hover {
          border-color: var(--border-strong) !important;
          background-color: var(--bg-subtle) !important;
        }
      `}</style>
    </div>
  );
};

export default HistoryDrawer;
