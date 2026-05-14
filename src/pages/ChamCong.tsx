import React, { useState, useMemo } from 'react';
import { useAppContext } from '../store/AppContext';
import { Scanner } from '@yudiel/react-qr-scanner';
import QRCode from 'react-qr-code';
import { Clock, CheckCircle, Calendar, Shield, Info, MapPin } from 'lucide-react';

const STORE_LOCATIONS = [
  { id: 'KHO_TONG', name: 'Kho Tổng', code: 'KHO_TONG_QR' },
  { id: 'XSTORE', name: 'Xstore', code: 'XSTORE_QR' },
  { id: 'PH_DN', name: 'PhoneHouse Đà Nẵng', code: 'PH_DN_QR' },
  { id: 'PH_HUE', name: 'PhoneHouse Huế', code: 'PH_HUE_QR' },
  { id: 'PH_QNG', name: 'PhoneHouse Quảng Ngãi', code: 'PH_QNG_QR' },
];

export default function ChamCong() {
  const { state, dispatch } = useAppContext();
  const [activeTab, setActiveTab] = useState<'CHECK_IN' | 'OVERVIEW' | 'QR_CODE'>('CHECK_IN');
  const [scanResult, setScanResult] = useState<string | null>(null);

  const currentUser = state.currentUser;
  const isAdmin = currentUser?.role === 'ADMIN';

  const todayStr = new Date().toISOString().split('T')[0];
  const myTodayRecord = state.attendanceRecords.find(a => a.userId === currentUser?.id && a.date === todayStr);

  const handleScan = (result: string) => {
    if (result) {
      setScanResult(result);
      // Validate store QR
      const store = STORE_LOCATIONS.find(s => s.code === result);
      
      if (!store) {
        alert('Mã QR không hợp lệ. Vui lòng quét mã check-in của cửa hàng.');
        return;
      }

      if (!myTodayRecord) {
        // Check in 1
        const newRecord = {
          id: `att-${Date.now()}`,
          userId: currentUser!.id,
          storeId: store.id,
          date: todayStr,
          checkIn1: new Date().toISOString(),
          status: 'PRESENT' as const
        };
        dispatch({ type: 'ADD_ATTENDANCE', payload: newRecord });
        alert(`Check-in vào ca sáng thành công tại ${store.name}!`);
      } else if (!myTodayRecord.checkOut1) {
        // Check out 1
        const updateRecord = {
          ...myTodayRecord,
          checkOut1: new Date().toISOString()
        };
        dispatch({ type: 'UPDATE_ATTENDANCE', payload: updateRecord });
        alert(`Check-out ra ca sáng thành công tại ${store.name}!`);
      } else if (!myTodayRecord.checkIn2) {
        // Check in 2
        const updateRecord = {
          ...myTodayRecord,
          checkIn2: new Date().toISOString()
        };
        dispatch({ type: 'UPDATE_ATTENDANCE', payload: updateRecord });
        alert(`Check-in vào ca chiều thành công tại ${store.name}!`);
      } else if (!myTodayRecord.checkOut2) {
        // Check out 2
        const updateRecord = {
          ...myTodayRecord,
          checkOut2: new Date().toISOString()
        };
        dispatch({ type: 'UPDATE_ATTENDANCE', payload: updateRecord });
        alert(`Check-out ra ca chiều thành công tại ${store.name}!`);
      } else {
        alert('Bạn đã hoàn thành tất cả ca làm việc trong hôm nay.');
      }
    }
  };

  const myRecords = useMemo(() => {
    return state.attendanceRecords.filter(a => a.userId === currentUser?.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [state.attendanceRecords, currentUser]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neon-cyan neon-text flex items-center">
            <Clock className="w-6 h-6 mr-2" />
            Check-in & Chấm Công
          </h1>
          <p className="text-dark-muted text-sm mt-1">Quét mã QR tại cửa hàng để điểm danh</p>
        </div>
      </div>

      <div className="flex space-x-1 bg-dark-bg p-1 rounded-lg w-full max-w-md border border-dark-border">
        <button
          onClick={() => setActiveTab('CHECK_IN')}
          className={`flex-1 flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'CHECK_IN' ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50' : 'text-dark-muted hover:text-dark-text'
          }`}
        >
          Check-in
        </button>
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`flex-1 flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'OVERVIEW' ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50' : 'text-dark-muted hover:text-dark-text'
          }`}
        >
          {isAdmin ? 'Báo cáo tổng' : 'Lịch sử của tôi'}
        </button>
        {isAdmin && (
          <button
            onClick={() => setActiveTab('QR_CODE')}
            className={`flex-1 flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'QR_CODE' ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50' : 'text-dark-muted hover:text-dark-text'
            }`}
          >
            Mã QR Cửa hàng
          </button>
        )}
      </div>

      {activeTab === 'CHECK_IN' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-dark-card border border-dark-border rounded-xl p-6 flex flex-col items-center">
            <h2 className="text-lg font-bold text-dark-text mb-4">Trạng thái hôm nay</h2>
            
            {myTodayRecord ? (
              <div className="w-full bg-dark-bg/50 border border-neon-green/30 rounded-lg p-6 flex flex-col items-center">
                <CheckCircle className="w-16 h-16 text-neon-green mb-4" />
                <h3 className="text-xl font-bold text-neon-green mb-2">Đã Check-in hôm nay</h3>
                <div className="text-dark-text text-center space-y-2 w-full">
                  <div className="flex justify-between border-b border-dark-border pb-2">
                    <span className="text-dark-muted">Ca Sáng (Vào):</span>
                    <span className="font-bold text-neon-cyan">{myTodayRecord.checkIn1 ? new Date(myTodayRecord.checkIn1).toLocaleTimeString('vi-VN') : '---'}</span>
                  </div>
                  <div className="flex justify-between border-b border-dark-border pb-2">
                    <span className="text-dark-muted">Ca Sáng (Ra):</span>
                    <span className="font-bold text-neon-cyan">{myTodayRecord.checkOut1 ? new Date(myTodayRecord.checkOut1).toLocaleTimeString('vi-VN') : '---'}</span>
                  </div>
                  <div className="flex justify-between border-b border-dark-border pb-2">
                    <span className="text-dark-muted">Ca Chiều (Vào):</span>
                    <span className="font-bold text-neon-cyan">{myTodayRecord.checkIn2 ? new Date(myTodayRecord.checkIn2).toLocaleTimeString('vi-VN') : '---'}</span>
                  </div>
                  <div className="flex justify-between border-b border-dark-border pb-2">
                    <span className="text-dark-muted">Ca Chiều (Ra):</span>
                    <span className="font-bold text-neon-cyan">{myTodayRecord.checkOut2 ? new Date(myTodayRecord.checkOut2).toLocaleTimeString('vi-VN') : '---'}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-dark-muted">Tại:</span>
                    <span className="font-medium text-neon-cyan">{STORE_LOCATIONS.find(s => s.id === myTodayRecord.storeId)?.name || myTodayRecord.storeId}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full bg-dark-bg/50 border border-dark-border rounded-lg p-6 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-dark-border flex items-center justify-center mb-4">
                  <Clock className="w-8 h-8 text-dark-muted" />
                </div>
                <h3 className="text-lg font-bold text-dark-text mb-2">Chưa Check-in</h3>
                <p className="text-sm text-dark-muted text-center">Hãy quét mã QR tại cửa hàng để điểm danh.</p>
              </div>
            )}
          </div>

          <div className="bg-dark-card border border-dark-border rounded-xl p-6">
            <h2 className="text-lg font-bold text-dark-text mb-4">Quét QR Code</h2>
            {myTodayRecord && myTodayRecord.checkOut2 ? (
              <div className="h-64 flex flex-col items-center justify-center bg-dark-bg border border-dark-border rounded-lg p-4 text-center">
                <CheckCircle className="w-12 h-12 text-neon-green mb-4" />
                <p className="text-dark-text">Bạn đã hoàn thành 4 ca làm việc hôm nay.</p>
              </div>
            ) : (
              <div className="w-full aspect-square max-h-[400px] bg-black rounded-lg overflow-hidden border border-neon-cyan/30 relative">
                <Scanner
                  onScan={(result) => handleScan(result[0].rawValue)}
                  onError={(error) => console.log(error)}
                />
                <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                  <div className="bg-black/60 px-4 py-2 rounded-full backdrop-blur text-sm text-white">
                    Hướng camera về mã QR để quét
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'OVERVIEW' && (
        <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-dark-border bg-dark-bg/50">
            <h2 className="text-lg font-bold text-neon-cyan flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              {isAdmin ? 'Báo Cáo Chấm Công Toàn Hệ Thống' : 'Lịch Sử Chấm Công Của Bạn'}
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-dark-text">
              <thead className="bg-dark-bg/80 text-xs text-dark-muted uppercase border-b border-dark-border">
                <tr>
                  <th className="px-6 py-3">Ngày</th>
                  {isAdmin && <th className="px-6 py-3">Nhân Viên</th>}
                  <th className="px-6 py-3">Chi Nhánh</th>
                  <th className="px-6 py-3">Ca Sáng</th>
                  <th className="px-6 py-3">Ca Chiều</th>
                  <th className="px-6 py-3">Thời gian làm</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border">
                {(isAdmin ? state.attendanceRecords : myRecords).map(record => {
                  let hoursWorked = 0;
                  
                  if (record.checkIn1 && record.checkOut1) {
                    hoursWorked += (new Date(record.checkOut1).getTime() - new Date(record.checkIn1).getTime()) / (1000 * 60 * 60);
                  }
                  if (record.checkIn2 && record.checkOut2) {
                    hoursWorked += (new Date(record.checkOut2).getTime() - new Date(record.checkIn2).getTime()) / (1000 * 60 * 60);
                  }

                  const user = state.users.find(u => u.id === record.userId);

                  return (
                    <tr key={record.id} className="hover:bg-dark-border/50">
                      <td className="px-6 py-4 font-medium">{record.date}</td>
                      {isAdmin && (
                        <td className="px-6 py-4">
                          <p className="font-bold">{user?.name || record.userId}</p>
                          <p className="text-xs text-dark-muted">Lương CB: {user?.baseSalary ? user.baseSalary.toLocaleString() + 'đ' : '---'}</p>
                        </td>
                      )}
                      <td className="px-6 py-4 flex items-center">
                        <MapPin className="w-4 h-4 text-dark-muted mr-1" />
                        {STORE_LOCATIONS.find(s => s.id === record.storeId)?.name || record.storeId}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 text-xs font-mono">
                          <div className="text-neon-cyan">V: {record.checkIn1 ? new Date(record.checkIn1).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'}) : '--:--'}</div>
                          <div className="text-neon-pink">R: {record.checkOut1 ? new Date(record.checkOut1).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'}) : '--:--'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 text-xs font-mono">
                          <div className="text-neon-cyan">V: {record.checkIn2 ? new Date(record.checkIn2).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'}) : '--:--'}</div>
                          <div className="text-neon-pink">R: {record.checkOut2 ? new Date(record.checkOut2).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'}) : '--:--'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {hoursWorked > 0 ? (
                          <span className={`${hoursWorked >= 8 ? 'text-neon-green' : 'text-neon-pink'} font-bold`}>
                            {hoursWorked.toFixed(1)} h
                          </span>
                        ) : '---'}
                      </td>
                    </tr>
                  )
                })}
                {(isAdmin ? state.attendanceRecords : myRecords).length === 0 && (
                  <tr>
                    <td colSpan={isAdmin ? 6 : 5} className="px-6 py-8 text-center text-dark-muted">
                      Chưa có dữ liệu chấm công.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'QR_CODE' && isAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {STORE_LOCATIONS.map(store => (
            <div key={store.id} className="bg-dark-card border border-dark-border rounded-xl p-6 flex flex-col items-center shadow-lg">
              <h3 className="text-lg font-bold text-dark-text mb-4 text-center">{store.name}</h3>
              <div className="bg-white p-4 rounded-xl shadow-inner mb-6">
                <QRCode value={store.code} size={200} level="H" />
              </div>
              <p className="text-xs font-mono text-dark-muted bg-dark-bg py-1 px-3 rounded border border-dark-border mb-4">
                {store.code}
              </p>
              <div className="w-full text-center text-sm text-dark-muted bg-neon-cyan/5 border border-neon-cyan/20 p-3 rounded-lg flex items-start text-left">
                <Info className="w-4 h-4 text-neon-cyan mr-2 mt-0.5 shrink-0" />
                <span>In mã này và dán tại <strong>{store.name}</strong> để nhân viên quét khi đến và về.</span>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
