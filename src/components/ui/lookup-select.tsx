'use client';

import { useState, useEffect, useRef, useId } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Plus, X, Search, Check, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip } from './tooltip';

interface LookupOption {
  id: string;
  name: string;
  subtitle?: string;
}

interface LookupSelectProps {
  value: string | null;
  onChange: (value: string | null) => void;
  options: LookupOption[];
  placeholder?: string;
  label?: string;
  help?: string;
  disabled?: boolean;
  allowClear?: boolean;
  allowCreate?: boolean;
  onCreateNew?: () => void;
  createLabel?: string;
  className?: string;
  error?: string;
}

export function LookupSelect({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  label,
  help,
  disabled = false,
  allowClear = true,
  allowCreate = true,
  onCreateNew,
  createLabel = 'Add new',
  className,
  error,
}: LookupSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();
  const labelId = useId();

  const selectedOption = options.find(o => o.id === value);

  const filteredOptions = search
    ? options.filter(o => 
        o.name.toLowerCase().includes(search.toLowerCase()) ||
        o.subtitle?.toLowerCase().includes(search.toLowerCase())
      )
    : options;

  // Close on click outside (must also check portal dropdown)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const inContainer = containerRef.current?.contains(target);
      const inDropdown = dropdownRef.current?.contains(target);
      if (!inContainer && !inDropdown) {
        setIsOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const updateDropdownPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: 'fixed',
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
      });
    }
  };

  const handleSelect = (optionId: string) => {
    onChange(optionId);
    setIsOpen(false);
    setSearch('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {label && (
        <label id={labelId} className="flex items-center gap-1.5 text-sm font-medium text-text-secondary mb-1.5">
          {label}
          {help && (
            <Tooltip content={help}>
              <HelpCircle size={14} className="text-text-tertiary hover:text-text-secondary cursor-help transition-colors" />
            </Tooltip>
          )}
        </label>
      )}
      
      {/* Trigger Button */}
      <button
        type="button"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={isOpen ? listboxId : undefined}
        aria-labelledby={label ? labelId : undefined}
        ref={buttonRef}
        onClick={() => {
          if (!disabled) {
            if (!isOpen) updateDropdownPosition();
            setIsOpen(!isOpen);
          }
        }}
        disabled={disabled}
        className={cn(
          'w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-left transition-colors',
          'bg-surface text-text-primary',
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-border-strong cursor-pointer',
          error ? 'border-error' : 'border-border',
          isOpen && 'ring-2 ring-brand-purple/20 border-brand-purple'
        )}
      >
        <span className={cn('truncate', !selectedOption && 'text-text-tertiary')}>
          {selectedOption?.name || placeholder}
        </span>
        <div className="flex items-center gap-1 flex-shrink-0">
          {allowClear && value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear selection"
              className="p-0.5 hover:bg-bg-tertiary rounded"
            >
              <X size={14} className="text-text-tertiary" />
            </button>
          )}
          <ChevronDown
            size={16}
            className={cn('text-text-tertiary transition-transform', isOpen && 'rotate-180')}
            aria-hidden="true"
          />
        </div>
      </button>

      {error && (
        <p className="text-xs text-error mt-1" role="alert">{error}</p>
      )}

      {/* Dropdown — portal to escape overflow/stacking context */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div ref={dropdownRef} style={dropdownStyle} className="bg-surface border border-border rounded-lg shadow-lg overflow-hidden">
          {/* Search */}
          {options.length > 5 && (
            <div className="p-2 border-b border-border">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary" aria-hidden="true" />
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  aria-label="Search options"
                  className="w-full pl-8 pr-3 py-1.5 text-sm bg-bg-tertiary border border-border rounded-md text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-brand-purple"
                />
              </div>
            </div>
          )}

          {/* Options */}
          <div id={listboxId} role="listbox" className="max-h-60 overflow-auto">
            {filteredOptions.length === 0 && !allowCreate && (
              <div className="px-3 py-4 text-center text-sm text-text-tertiary">
                No options found
              </div>
            )}

            {filteredOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                role="option"
                aria-selected={option.id === value}
                onClick={() => handleSelect(option.id)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-bg-tertiary transition-colors',
                  option.id === value && 'bg-brand-purple/10'
                )}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary truncate">{option.name}</p>
                  {option.subtitle && (
                    <p className="text-xs text-text-tertiary truncate">{option.subtitle}</p>
                  )}
                </div>
                {option.id === value && (
                  <Check size={14} className="text-brand-purple flex-shrink-0" aria-hidden="true" />
                )}
              </button>
            ))}

            {/* Create New Option */}
            {allowCreate && onCreateNew && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setSearch('');
                  onCreateNew();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-bg-tertiary transition-colors border-t border-border text-brand-purple"
              >
                <Plus size={14} aria-hidden="true" />
                <span className="text-sm font-medium">{createLabel}</span>
              </button>
            )}
          </div>
        </div>,
      document.body)}
    </div>
  );
}

// Multi-select version for team members, swag, etc.
interface LookupMultiSelectProps {
  values: string[];
  onChange: (values: string[]) => void;
  options: LookupOption[];
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  allowCreate?: boolean;
  onCreateNew?: () => void;
  createLabel?: string;
  className?: string;
  maxDisplay?: number;
}

export function LookupMultiSelect({
  values,
  onChange,
  options,
  placeholder = 'Select...',
  label,
  disabled = false,
  allowCreate = true,
  onCreateNew,
  createLabel = 'Add new',
  className,
  maxDisplay = 3,
}: LookupMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOptions = options.filter(o => values.includes(o.id));

  const filteredOptions = search
    ? options.filter(o => 
        o.name.toLowerCase().includes(search.toLowerCase()) ||
        o.subtitle?.toLowerCase().includes(search.toLowerCase())
      )
    : options;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const toggleOption = (optionId: string) => {
    if (values.includes(optionId)) {
      onChange(values.filter(v => v !== optionId));
    } else {
      onChange([...values, optionId]);
    }
  };

  const removeOption = (optionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(values.filter(v => v !== optionId));
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {label && (
        <label className="block text-sm font-medium text-text-secondary mb-1.5">
          {label}
        </label>
      )}
      
      {/* Trigger */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-left transition-colors min-h-[42px]',
          'bg-surface text-text-primary',
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-border-strong cursor-pointer',
          'border-border',
          isOpen && 'ring-2 ring-brand-purple/20 border-brand-purple'
        )}
      >
        <div className="flex-1 flex flex-wrap gap-1 min-w-0">
          {selectedOptions.length === 0 && (
            <span className="text-text-tertiary">{placeholder}</span>
          )}
          {selectedOptions.slice(0, maxDisplay).map((option) => (
            <span
              key={option.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-bg-tertiary rounded text-xs text-text-primary"
            >
              {option.name}
              <button
                type="button"
                onClick={(e) => removeOption(option.id, e)}
                className="hover:text-error"
              >
                <X size={12} />
              </button>
            </span>
          ))}
          {selectedOptions.length > maxDisplay && (
            <span className="text-xs text-text-tertiary">
              +{selectedOptions.length - maxDisplay} more
            </span>
          )}
        </div>
        <ChevronDown
          size={16}
          className={cn('text-text-tertiary transition-transform flex-shrink-0', isOpen && 'rotate-180')}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-surface border border-border rounded-lg shadow-lg overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-bg-tertiary border border-border rounded-md text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-brand-purple"
              />
            </div>
          </div>

          {/* Options */}
          <div className="max-h-60 overflow-auto">
            {filteredOptions.length === 0 && !allowCreate && (
              <div className="px-3 py-4 text-center text-sm text-text-tertiary">
                No options found
              </div>
            )}

            {filteredOptions.map((option) => {
              const isSelected = values.includes(option.id);
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => toggleOption(option.id)}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-bg-tertiary transition-colors',
                    isSelected && 'bg-brand-purple/10'
                  )}
                >
                  <div className={cn(
                    'w-4 h-4 rounded border flex items-center justify-center flex-shrink-0',
                    isSelected ? 'bg-brand-purple border-brand-purple' : 'border-border'
                  )}>
                    {isSelected && <Check size={12} className="text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary truncate">{option.name}</p>
                    {option.subtitle && (
                      <p className="text-xs text-text-tertiary truncate">{option.subtitle}</p>
                    )}
                  </div>
                </button>
              );
            })}

            {/* Create New */}
            {allowCreate && onCreateNew && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setSearch('');
                  onCreateNew();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-bg-tertiary transition-colors border-t border-border text-brand-purple"
              >
                <Plus size={14} />
                <span className="text-sm font-medium">{createLabel}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
