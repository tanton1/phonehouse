import React, { useState, useEffect, useRef } from 'react';
import { Search, Smartphone, Wrench } from 'lucide-react';
import { useAppContext } from '../store/AppContext';
import { useNavigate } from 'react-router-dom';

export default function GlobalSearch() {
  const { state } = useAppContext();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchResults = () => {
    if (!query.trim()) return { devices: [], tasks: [] };
    const lowerQuery = query.toLowerCase();
    
    const devices = state.devices.filter(d => 
      d.imei.toLowerCase().includes(lowerQuery) || 
      d.model.toLowerCase().includes(lowerQuery)
    ).slice(0, 5);

    const tasks = state.tasks.filter(t => 
      t.id.toLowerCase().includes(lowerQuery) ||
      t.type.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery)
    ).slice(0, 5);

    return { devices, tasks };
  };

  const results = searchResults();
  const hasResults = results.devices.length > 0 || results.tasks.length > 0;

  const handleSelectDevice = (deviceId: string) => {
    setIsOpen(false);
    setQuery('');
    navigate('/kho-may');
  };

  const handleSelectTask = (taskId: string) => {
    setIsOpen(false);
    setQuery('');
    navigate('/ky-thuat');
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-muted" />
        <input
          type="text"
          placeholder="Tìm kiếm máy (IMEI), công việc..."
          className="w-full pl-10 pr-4 py-2 border border-dark-border rounded-lg focus:ring-neon-cyan focus:border-neon-cyan text-sm bg-dark-bg text-dark-text transition-colors dark-input"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
      </div>

      {isOpen && query.trim() && (
        <div className="absolute top-full mt-2 w-full bg-dark-card rounded-lg shadow-xl border border-dark-border overflow-hidden z-50">
          {hasResults ? (
            <div className="max-h-96 overflow-y-auto py-2">
              {results.devices.length > 0 && (
                <div className="mb-2">
                  <div className="px-4 py-1 text-xs font-semibold text-dark-muted uppercase bg-dark-bg">Thiết bị</div>
                  {results.devices.map(device => (
                    <button
                      key={device.id}
                      onClick={() => handleSelectDevice(device.id)}
                      className="w-full text-left px-4 py-2 hover:bg-dark-border flex items-center transition-colors"
                    >
                      <Smartphone className="w-4 h-4 mr-3 text-neon-cyan shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-dark-text truncate">{device.model}</p>
                        <p className="text-xs text-dark-muted truncate">IMEI: {device.imei}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              {results.tasks.length > 0 && (
                <div>
                  <div className="px-4 py-1 text-xs font-semibold text-dark-muted uppercase bg-dark-bg">Công việc (Task)</div>
                  {results.tasks.map(task => {
                    const device = state.devices.find(d => d.id === task.deviceId);
                    return (
                      <button
                        key={task.id}
                        onClick={() => handleSelectTask(task.id)}
                        className="w-full text-left px-4 py-2 hover:bg-dark-border flex items-center transition-colors"
                      >
                        <Wrench className="w-4 h-4 mr-3 text-neon-pink shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-dark-text truncate">{task.type}</p>
                          <p className="text-xs text-dark-muted truncate">{device?.model} - {device?.imei.slice(-4)}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-dark-muted">
              Không tìm thấy kết quả nào cho "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
