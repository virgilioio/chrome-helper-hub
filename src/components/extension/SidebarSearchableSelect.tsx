import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronsUpDown, Loader2, Search } from 'lucide-react';

export interface SelectOption {
  id: string;
  label: string;
}

interface SidebarSearchableSelectProps {
  options: SelectOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  isLoading?: boolean;
}

/**
 * Custom searchable select for the sidebar context
 * Does NOT use portals - renders dropdown inline within the sidebar DOM
 * This fixes the z-index/CORS issues with Radix UI portals in content scripts
 */
export const SidebarSearchableSelect: React.FC<SidebarSearchableSelectProps> = ({
  options,
  value,
  onValueChange,
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  emptyMessage = 'No results found.',
  disabled = false,
  isLoading = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.id === value);

  // Filter options based on search
  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (optionId: string) => {
    onValueChange(optionId);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleToggle = () => {
    if (!disabled && !isLoading) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        setSearchQuery('');
      }
    }
  };

  return (
    <div className="gogio-dropdown-container" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        className={`gogio-dropdown-trigger ${!selectedOption ? 'placeholder' : ''}`}
        onClick={handleToggle}
        disabled={disabled || isLoading}
        data-state={isOpen ? 'open' : 'closed'}
      >
        {isLoading ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Loader2 className="animate-spin" style={{ width: 16, height: 16 }} />
            Loading...
          </span>
        ) : selectedOption ? (
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {selectedOption.label}
          </span>
        ) : (
          placeholder
        )}
        <ChevronsUpDown className="gogio-dropdown-chevron" />
      </button>

      {/* Dropdown Menu - NO PORTAL */}
      {isOpen && (
        <div className="gogio-dropdown-menu">
          {/* Search Input */}
          <div className="gogio-dropdown-search">
            <Search className="gogio-dropdown-search-icon" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchPlaceholder}
              style={{
                height: '24px',
                padding: 0,
                border: 'none',
                boxShadow: 'none',
              }}
            />
          </div>

          {/* Options List */}
          <div className="gogio-dropdown-list">
            {filteredOptions.length === 0 ? (
              <div className="gogio-dropdown-empty">{emptyMessage}</div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.id}
                  className={`gogio-dropdown-item ${value === option.id ? 'selected' : ''}`}
                  onClick={() => handleSelect(option.id)}
                >
                  {value === option.id && (
                    <Check className="gogio-dropdown-item-check" />
                  )}
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {option.label}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
