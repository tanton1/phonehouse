import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../store/AppContext";
import { DeviceLocation, Role } from "../types";
import { Table, LayoutDashboard, Smartphone, MapPin, User, Download, Store } from "lucide-react";

const APPEARANCES = ['LN', '99%', 'OTHER'] as const;

const APPEARANCE_LABELS: Record<string, string> = {
  'LN': 'Like New',
  '99%': '99%',
  'OTHER': 'Chưa phân loại'
};

export default function InventoryMatrix() {
  const { state } = useAppContext();
  const navigate = useNavigate();
  
  const SHOP_LABELS = state.storeBranches.reduce((acc, branch) => {
    acc[branch.code] = branch.name;
    return acc;
  }, {} as Record<string, string>);

  // Default store restricted to user's assigned store if they are SALE
  const [selectedStore, setSelectedStore] = useState<DeviceLocation | 'KHO_TONG'>(state.currentUser?.storeId || 'KHO_TONG');

  // Filter devices: only for selected store and specific sources
  const activeDevices = useMemo(() => {
    return state.devices.filter(d => {
      // 1. Not sold
      if (d.status === 'DA_BAN') return false;
      
      // 2. Match selected store
      const deviceLoc = d.location || 'KHO_TONG';
      if (deviceLoc !== selectedStore) return false;

      // 3. Source filter (for KHO_TONG, we exclude warranty and service)
      // For shops, we usually just want to see CHO_BAN or SAN_SANG or just everything that is literally there
      if (selectedStore === 'KHO_TONG') {
        const allowedSources = ['IMPORT', 'SHOP_TRANSFER', 'TRADE_IN'];
        if (d.receptionType && !allowedSources.includes(d.receptionType)) return false;
      }
      
      return true;
    });
  }, [state.devices, selectedStore]);

  // Helper to get holder ID for a device
  const getDeviceHolder = (device: any) => {
    if (selectedStore !== 'KHO_TONG') return device.location; // Shops group by store name instead of tasks
    const activeTask = state.tasks.find(t => t.deviceId === device.id && !['DONG_TASK', 'HUY_TASK'].includes(t.status));
    return activeTask?.assigneeId || 'KHO_TONG';
  };

  // Get unique holders (Users who have devices or 'KHO_TONG')
  const holders = useMemo(() => {
    const holderIds = new Set<string>();
    activeDevices.forEach(d => {
      holderIds.add(getDeviceHolder(d));
    });
    
    const sortedHolders = Array.from(holderIds).sort((a, b) => {
      if (a === 'KHO_TONG') return -1;
      if (b === 'KHO_TONG') return 1;
      const userA = state.users.find(u => u.id === a);
      const userB = state.users.find(u => u.id === b);
      return (userA?.name || '').localeCompare(userB?.name || '');
    });

    return sortedHolders;
  }, [activeDevices, state.users, state.tasks]);

  const getHolderName = (id: string) => {
    if (selectedStore !== 'KHO_TONG') return SHOP_LABELS[id] || id; // Shops
    if (id === 'KHO_TONG') return 'Kho Tổng';
    const user = state.users.find(u => u.id === id);
    return user ? user.name : id;
  };

  // Get unique models and sort them
  const models = useMemo(() => {
    const uniqueModels = Array.from(new Set(activeDevices.map(d => d.model))) as string[];
    return uniqueModels.sort((a, b) => {
      const getNum = (s: string) => {
        const match = s.match(/\d+/);
        return match ? parseInt(match[0]) : 0;
      };
      const numA = getNum(a);
      const numB = getNum(b);
      if (numA !== numB) return numA - numB;
      return a.localeCompare(b);
    });
  }, [activeDevices]);

  // Grouping logic: model -> holder -> appearance -> [imeis]
  const matrixData = useMemo(() => {
    const data: Record<string, Record<string, Record<string, string[]>>> = {};

    models.forEach(model => {
      data[model] = {};
      holders.forEach(h => {
        data[model][h] = {};
        APPEARANCES.forEach(app => {
          data[model][h][app] = [];
        });
      });
    });

    activeDevices.forEach(d => {
      const holder = getDeviceHolder(d);
      const app = d.appearance || 'OTHER';
      if (data[d.model] && data[d.model][holder]) {
        if (!data[d.model][holder][app]) {
          data[d.model][holder][app] = [];
        }
        data[d.model][holder][app].push(d.imei);
      }
    });

    return data;
  }, [activeDevices, models, holders]);

  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // Add BOM for Excel UTF-8
    
    // Header row
    const headers = ["Model"];
    holders.forEach(h => {
      APPEARANCES.forEach(app => {
        headers.push(`${getHolderName(h)} - ${APPEARANCE_LABELS[app]}`);
      });
    });
    headers.push("Tổng");
    csvContent += headers.join(",") + "\n";

    // Data rows
    models.forEach(model => {
      const row = [model];
      let rowTotal = 0;
      
      holders.forEach(h => {
        APPEARANCES.forEach(app => {
          const count = matrixData[model][h][app]?.length || 0;
          row.push(count.toString());
          rowTotal += count;
        });
      });
      
      row.push(rowTotal.toString());
      csvContent += row.join(",") + "\n";
    });

    // Total row
    const totalRow = ["Tổng Cộng"];
    let grandTotal = 0;
    
    holders.forEach(h => {
      APPEARANCES.forEach(app => {
        let colTotal = 0;
        models.forEach(model => {
          colTotal += matrixData[model][h][app]?.length || 0;
        });
        totalRow.push(colTotal.toString());
        grandTotal += colTotal;
      });
    });
    
    totalRow.push(grandTotal.toString());
    csvContent += totalRow.join(",") + "\n";

    // Download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `BaoCaoTonKho_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const visibleAppearances = useMemo(() => {
    const hasOtherData = models.some(model => 
      holders.some(holder => matrixData[model][holder]['OTHER'].length > 0)
    );
    return hasOtherData ? APPEARANCES : APPEARANCES.filter(a => a !== 'OTHER');
  }, [matrixData, models, holders]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neon-cyan neon-text flex items-center">
            <Table className="w-6 h-6 mr-2" />
            Báo Cáo Tồn Kho Ma Trận
          </h1>
          <p className="text-dark-muted text-sm mt-1">
            Thống kê tồn kho tại cửa hàng. Phân loại theo Tình trạng.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          {(!state.currentUser?.storeId || state.currentUser?.role === 'ADMIN' || state.currentUser?.role === 'KHO_MAY') && (
            <div className="flex items-center w-full sm:w-auto bg-dark-card border border-dark-border rounded-lg px-3 py-2">
              <Store className="w-4 h-4 text-dark-muted mr-2 shrink-0" />
              <select
                value={selectedStore}
                onChange={(e) => setSelectedStore(e.target.value as DeviceLocation | 'KHO_TONG')}
                className="bg-transparent text-dark-text outline-none text-sm font-medium w-full"
              >
                {Object.entries(SHOP_LABELS).map(([key, label]) => (
                  <option key={key} value={key} className="bg-dark-card">{label}</option>
                ))}
              </select>
            </div>
          )}
          <button 
            onClick={exportToCSV}
            className="w-full sm:w-auto neon-button flex items-center justify-center shadow-sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Xuất Excel (CSV)
          </button>
        </div>
      </div>

      <div className="bg-dark-card rounded-xl border border-dark-border overflow-hidden shadow-2xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full border-collapse text-xs">
            <thead>
              {/* Level 1 Headers: Holders */}
              <tr className="bg-dark-bg/50">
                <th rowSpan={2} className="p-4 border border-dark-border text-left font-bold text-dark-text min-w-[150px] sticky left-0 bg-dark-card z-20">
                  Dòng Máy
                </th>
                {holders.map(h => (
                  <th key={h} colSpan={visibleAppearances.length} className="p-2 border border-dark-border text-center font-bold text-neon-cyan bg-dark-bg/30">
                    <div className="flex items-center justify-center">
                      <User className="w-3 h-3 mr-1" />
                      {getHolderName(h)}
                    </div>
                  </th>
                ))}
                <th rowSpan={2} className="p-4 border border-dark-border text-center font-bold text-dark-text bg-dark-bg/50">
                  Tổng Tồn
                </th>
              </tr>
              {/* Level 2 Headers: Appearances */}
              <tr className="bg-dark-bg/20">
                {holders.map(h => (
                  visibleAppearances.map(app => (
                    <th key={`${h}-${app}`} className="p-2 border border-dark-border text-center font-bold text-dark-muted min-w-[100px]">
                      {APPEARANCE_LABELS[app]}
                    </th>
                  ))
                ))}
              </tr>
            </thead>
            <tbody>
              {models.map(model => {
                let modelTotal = 0;
                return (
                  <tr key={model} className="hover:bg-dark-border/30 transition-colors group">
                    <td className="p-3 border border-dark-border font-bold text-dark-text sticky left-0 bg-dark-card group-hover:bg-dark-border/50 z-10">
                      {model}
                    </td>
                    {holders.map(h => (
                      visibleAppearances.map(app => {
                        const imeis = matrixData[model][h][app];
                        modelTotal += imeis.length;
                        return (
                          <td key={`${model}-${h}-${app}`} className="p-2 border border-dark-border align-top">
                            {imeis.length > 0 ? (
                              <div className="space-y-1">
                                <div className="flex flex-col gap-1">
                                  {imeis.map(imei => (
                                    <button 
                                      key={imei} 
                                      onClick={() => navigate(`/thiet-bi/${imei}`)}
                                      className="text-[12px] font-bold text-neon-cyan font-mono bg-dark-bg px-2 py-1 rounded border border-neon-cyan/30 hover:border-neon-cyan/80 hover:text-white transition-colors shadow-sm text-left"
                                    >
                                      {imei}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <span className="text-dark-muted/20">-</span>
                            )}
                          </td>
                        );
                      })
                    ))}
                    <td className="p-3 border border-dark-border text-center font-bold text-neon-cyan bg-dark-bg/10">
                      {modelTotal}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-dark-bg/50 font-bold">
                <td className="p-3 border border-dark-border sticky left-0 bg-dark-card">TỔNG CỘNG</td>
                {holders.map(h => (
                  visibleAppearances.map(app => {
                    const total = models.reduce((sum, model) => sum + matrixData[model][h][app].length, 0);
                    return (
                      <td key={`total-${h}-${app}`} className="p-3 border border-dark-border text-center text-neon-cyan">
                        {total}
                      </td>
                    );
                  })
                ))}
                <td className="p-3 border border-dark-border text-center text-neon-green text-lg">
                  {activeDevices.length}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-dark-card p-4 rounded-xl border border-dark-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-dark-muted uppercase">Tổng máy tồn kho</span>
            <Smartphone className="w-4 h-4 text-neon-cyan" />
          </div>
          <div className="text-2xl font-bold text-dark-text">{activeDevices.length}</div>
        </div>
        <div className="bg-dark-card p-4 rounded-xl border border-dark-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-dark-muted uppercase">Số lượng Model</span>
            <LayoutDashboard className="w-4 h-4 text-neon-pink" />
          </div>
          <div className="text-2xl font-bold text-dark-text">{models.length}</div>
        </div>
        <div className="bg-dark-card p-4 rounded-xl border border-dark-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-dark-muted uppercase">Người quản lý</span>
            <User className="w-4 h-4 text-neon-green" />
          </div>
          <div className="text-2xl font-bold text-dark-text">{holders.length}</div>
        </div>
      </div>
    </div>
  );
}
