import React, { useState } from "react";
import { Device } from "../types";
import { X, Clock, Smartphone, Info, User, Calendar } from "lucide-react";

interface DeviceHistoryModalProps {
  devices: Device[];
  model: string;
  onClose: () => void;
}

export default function DeviceHistoryModal({ devices, model, onClose }: DeviceHistoryModalProps) {
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  const modelDevices = devices.filter(d => d.model === model);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-card rounded-xl shadow-xl border border-dark-border w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-dark-border flex justify-between items-center">
          <h2 className="text-xl font-bold text-neon-cyan">Chi tiết tồn kho: {model}</h2>
          <button onClick={onClose} className="text-dark-muted hover:text-dark-text">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <table className="min-w-full dark-table">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase">IMEI</th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase">Trạng thái</th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase">Vị trí</th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase">Ngày nhập</th>
              </tr>
            </thead>
            <tbody>
              {modelDevices.map(device => (
                <tr 
                  key={device.id} 
                  className="hover:bg-dark-border/30 cursor-pointer"
                  onClick={() => setSelectedDevice(device)}
                >
                  <td className="px-4 py-3 text-sm text-neon-cyan font-medium">{device.imei}</td>
                  <td className="px-4 py-3 text-sm text-dark-text">{device.status}</td>
                  <td className="px-4 py-3 text-sm text-dark-muted">{device.location}</td>
                  <td className="px-4 py-3 text-sm text-dark-muted">{device.importDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedDevice && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
          <div className="bg-dark-card rounded-xl shadow-xl border border-neon-cyan p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-neon-cyan">Thông tin chi tiết</h3>
              <button onClick={() => setSelectedDevice(null)} className="text-dark-muted hover:text-dark-text">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <p><span className="text-dark-muted">IMEI:</span> <span className="text-dark-text font-bold">{selectedDevice.imei}</span></p>
              <p><span className="text-dark-muted">Model:</span> <span className="text-dark-text">{selectedDevice.model}</span></p>
              <p><span className="text-dark-muted">Trạng thái:</span> <span className="text-neon-green">{selectedDevice.status}</span></p>
              <p><span className="text-dark-muted">Vị trí:</span> <span className="text-dark-text">{selectedDevice.location}</span></p>
              <p><span className="text-dark-muted">Ngày nhập:</span> <span className="text-dark-text">{selectedDevice.importDate}</span></p>
              <p><span className="text-dark-muted">Ghi chú:</span> <span className="text-dark-text">{selectedDevice.notes}</span></p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
