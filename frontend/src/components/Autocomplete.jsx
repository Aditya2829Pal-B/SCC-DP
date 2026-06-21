import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';

export default function Autocomplete({
  value,
  onChange,
  onSelect,
  suggestions = [],
  placeholder = '',
  icon: Icon = null,
  disabled = false,
  className = 'form-input',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  // Filter suggestions based on input
  useEffect(() => {
    if (value && value.length > 0) {
      const filtered = suggestions.filter(item =>
        item.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setIsOpen(filtered.length > 0);
      setHighlightedIndex(-1);
    } else {
      setFilteredSuggestions(suggestions.slice(0, 5)); // Show first 5 when empty
      setIsOpen(false);
    }
  }, [value, suggestions]);

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (suggestion) => {
    onChange(suggestion);
    if (onSelect) onSelect(suggestion);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev < filteredSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0) {
          handleSelect(filteredSuggestions[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  const handleClear = (e) => {
    e.preventDefault();
    onChange('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        {Icon && (
          <Icon
            style={{
              position: 'absolute',
              left: '0.875rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              fontSize: '1rem',
              pointerEvents: 'none',
            }}
          />
        )}
        <input
          ref={inputRef}
          type="text"
          className={className}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => value && setIsOpen(true)}
          disabled={disabled}
          style={{
            paddingLeft: Icon ? '2.75rem' : undefined,
            paddingRight: value ? '2.75rem' : undefined,
          }}
        />
        {value && (
          <button
            onClick={handleClear}
            style={{
              position: 'absolute',
              right: '0.875rem',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FiX size={18} />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && filteredSuggestions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '0.5rem',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '0.75rem',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
              maxHeight: '300px',
              overflowY: 'auto',
              listStyle: 'none',
              padding: '0.5rem',
              zIndex: 1000,
            }}
          >
            {filteredSuggestions.map((suggestion, index) => (
              <motion.li
                key={`${suggestion}-${index}`}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -4 }}
              >
                <button
                  type="button"
                  onClick={() => handleSelect(suggestion)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    textAlign: 'left',
                    background:
                      highlightedIndex === index
                        ? 'rgba(99, 102, 241, 0.1)'
                        : 'transparent',
                    color: highlightedIndex === index ? '#6366f1' : 'inherit',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    fontSize: '0.9375rem',
                    fontWeight: highlightedIndex === index ? 500 : 400,
                  }}
                >
                  {suggestion}
                </button>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
