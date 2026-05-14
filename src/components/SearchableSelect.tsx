import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";

interface SearchableSelectProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  className?: string;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Chọn hoặc nhập mới...",
  label,
  required = false,
  className = "",
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync searchTerm with value when not open
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm(value);
    }
  }, [value, isOpen]);

  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSearchTerm("");
    onChange("");
    setIsOpen(true);
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-dark-muted mb-1">
          {label} {required && "*"}
        </label>
      )}
      <div className="relative">
        <input
          type="text"
          required={required}
          className="w-full rounded-md p-2.5 text-sm dark-input pr-16 focus:ring-1 focus:ring-neon-cyan/50 outline-none transition-all"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            onChange(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setIsOpen(false);
            }
          }}
        />
        <div className="absolute right-0 top-0 h-full flex items-center pr-2 space-x-1">
          {searchTerm && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 text-dark-muted hover:text-neon-pink transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <div 
            className="p-1.5 text-dark-muted cursor-pointer"
            onClick={() => setIsOpen(!isOpen)}
          >
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-[100] w-full mt-1 bg-dark-card border border-dark-border rounded-md shadow-2xl max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="py-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, idx) => (
                <div
                  key={idx}
                  className={`px-4 py-3 text-sm cursor-pointer transition-colors border-b border-dark-border/50 last:border-0 ${
                    value === opt 
                      ? "bg-neon-cyan/10 text-neon-cyan font-bold" 
                      : "text-dark-text hover:bg-dark-border active:bg-dark-border"
                  }`}
                  onMouseDown={(e) => {
                    // Use onMouseDown to trigger before blur if needed, 
                    // though we use click-outside so it's less critical
                    e.preventDefault(); 
                    onChange(opt);
                    setSearchTerm(opt);
                    setIsOpen(false);
                  }}
                >
                  {opt}
                </div>
              ))
            ) : (
              <div className="px-4 py-4 text-sm text-dark-muted italic bg-dark-bg/30">
                Không tìm thấy kết quả. Bạn có thể nhập mới.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
