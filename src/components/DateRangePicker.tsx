import React, { useState, useEffect } from 'react';
import { startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onChange: (startDate: string, endDate: string) => void;
  className?: string;
}

export default function DateRangePicker({ startDate, endDate, onChange, className = "" }: DateRangePickerProps) {
  const [rangeType, setRangeType] = useState('this_month');
  const [customStart, setCustomStart] = useState(startDate);
  const [customEnd, setCustomEnd] = useState(endDate);

  // When rangeType changes, calculate new dates and call onChange
  useEffect(() => {
    if (rangeType === 'custom') return;

    let start = new Date();
    let end = new Date();
    const today = new Date();

    if (rangeType === 'today') {
      start = startOfDay(today);
      end = endOfDay(today);
    } else if (rangeType === 'yesterday') {
      const yesterday = subDays(today, 1);
      start = startOfDay(yesterday);
      end = endOfDay(yesterday);
    } else if (rangeType === 'this_week') {
      start = startOfWeek(today, { weekStartsOn: 1 });
      end = endOfWeek(today, { weekStartsOn: 1 });
    } else if (rangeType === 'last_week') {
      const lastWeek = subDays(today, 7);
      start = startOfWeek(lastWeek, { weekStartsOn: 1 });
      end = endOfWeek(lastWeek, { weekStartsOn: 1 });
    } else if (rangeType === 'this_month') {
      start = startOfMonth(today);
      end = endOfMonth(today);
    } else if (rangeType === 'last_month') {
      const lastMonth = subMonths(today, 1);
      start = startOfMonth(lastMonth);
      end = endOfMonth(lastMonth);
    } else if (rangeType === 'all') {
      start = new Date(2000, 0, 1);
      end = new Date(2100, 0, 1);
    }

    const startStr = format(start, 'yyyy-MM-dd');
    const endStr = format(end, 'yyyy-MM-dd');
    
    onChange(startStr, endStr);
  }, [rangeType]);

  const handleCustomChange = (type: 'start' | 'end', val: string) => {
    if (type === 'start') {
      setCustomStart(val);
      onChange(val, customEnd);
    } else {
      setCustomEnd(val);
      onChange(customStart, val);
    }
  };

  return (
    <div className={`flex flex-col sm:flex-row gap-2 ${className}`}>
      <select
        className="p-2 rounded-md bg-dark-bg border border-dark-border text-sm focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan outline-none"
        value={rangeType}
        onChange={(e) => setRangeType(e.target.value)}
      >
        <option value="today">Hôm nay</option>
        <option value="yesterday">Hôm qua</option>
        <option value="this_week">Tuần này</option>
        <option value="last_week">Tuần trước</option>
        <option value="this_month">Tháng này</option>
        <option value="last_month">Tháng trước</option>
        <option value="all">Tất cả thời gian</option>
        <option value="custom">Tuỳ chỉnh</option>
      </select>
      
      {rangeType === 'custom' && (
        <div className="flex items-center space-x-2 bg-dark-bg p-1 rounded-lg border border-dark-border">
          <input
            type="date"
            value={customStart}
            onChange={(e) => handleCustomChange('start', e.target.value)}
            className="bg-transparent text-dark-text text-sm p-1 outline-none"
          />
          <span className="text-dark-muted">-</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => handleCustomChange('end', e.target.value)}
            className="bg-transparent text-dark-text text-sm p-1 outline-none"
          />
        </div>
      )}
    </div>
  );
}
