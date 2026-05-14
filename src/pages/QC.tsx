import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../store/AppContext";
import { Device, Task, QCReport } from "../types";
import { ShieldCheck, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

export default function QC() {
  const { state, dispatch } = useAppContext();
  const navigate = useNavigate();
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [qcNotes, setQcNotes] = useState("");

  const pendingDevices = state.devices.filter((d) => d.status === "CHO_QC");

  const handlePass = () => {
    if (!selectedDevice) return;

    const report: QCReport = {
      id: `qc-${Date.now()}`,
      deviceId: selectedDevice.id,
      taskId:
        state.tasks.find(
          (t) =>
            t.deviceId === selectedDevice.id &&
            t.status === "HOAN_THANH_CHO_QC",
        )?.id || "",
      testerId: state.currentUser!.id,
      testedAt: format(new Date(), "yyyy-MM-dd HH:mm"),
      status: "PASS",
      notes: qcNotes,
    };

    dispatch({ type: "ADD_QC_REPORT", payload: report });

    // Update task status
    const task = state.tasks.find(
      (t) =>
        t.deviceId === selectedDevice.id && t.status === "HOAN_THANH_CHO_QC",
    );
    if (task) {
      dispatch({
        type: "UPDATE_TASK",
        payload: { ...task, status: "DONG_TASK" },
      });

      // Notify technician
      dispatch({
        type: "ADD_NOTIFICATION",
        payload: {
          id: `noti-${Date.now()}`,
          userId: task.assigneeId,
          title: "Task đã PASS QC!",
          message: `Task "${task.type}" cho máy ${selectedDevice.model} đã được QC duyệt PASS.`,
          type: "TASK_UPDATED",
          link: "/bao-cao-thu-nhap",
          isRead: false,
          createdAt: new Date().toISOString(),
        },
      });
    }

    // Update device status
    const newStatus = selectedDevice.receptionType === 'SERVICE' ? 'HOAN_TAT' : 'CHO_BAN';
    dispatch({
      type: "UPDATE_DEVICE",
      payload: { ...selectedDevice, status: newStatus },
    });

    setSelectedDevice(null);
    setQcNotes("");
    alert(newStatus === 'HOAN_TAT' ? "Đã xác nhận QC PASS, máy chuyển sang chờ trả khách!" : "Đã xác nhận QC PASS, máy chuyển sang chờ bán!");
  };

  const handleFail = () => {
    if (!selectedDevice || !qcNotes) return alert("Vui lòng nhập lý do FAIL");

    const report: QCReport = {
      id: `qc-${Date.now()}`,
      deviceId: selectedDevice.id,
      taskId:
        state.tasks.find(
          (t) =>
            t.deviceId === selectedDevice.id &&
            t.status === "HOAN_THANH_CHO_QC",
        )?.id || "",
      testerId: state.currentUser!.id,
      testedAt: format(new Date(), "yyyy-MM-dd HH:mm"),
      status: "FAIL",
      notes: qcNotes,
    };

    dispatch({ type: "ADD_QC_REPORT", payload: report });

    // Update task status back to processing
    const task = state.tasks.find(
      (t) =>
        t.deviceId === selectedDevice.id && t.status === "HOAN_THANH_CHO_QC",
    );
    if (task) {
      dispatch({
        type: "UPDATE_TASK",
        payload: {
          ...task,
          status: "DANG_XU_LY",
          notes: `${task.notes}\n[QC FAIL]: ${qcNotes}`,
        },
      });

      // Notify technician
      dispatch({
        type: "ADD_NOTIFICATION",
        payload: {
          id: `noti-${Date.now()}`,
          userId: task.assigneeId,
          title: "Task bị FAIL QC!",
          message: `Task "${task.type}" cho máy ${selectedDevice.model} bị QC trả về. Lý do: ${qcNotes}`,
          type: "TASK_UPDATED",
          link: "/ky-thuat",
          isRead: false,
          createdAt: new Date().toISOString(),
        },
      });
    }

    // Update device status
    dispatch({
      type: "UPDATE_DEVICE",
      payload: { ...selectedDevice, status: "DANG_XU_LY" },
    });

    setSelectedDevice(null);
    setQcNotes("");
    alert("Đã xác nhận QC FAIL, trả máy về kỹ thuật xử lý lại!");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-neon-cyan neon-text">
          Kiểm Tra Chất Lượng (QC)
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cột trái: Danh sách máy chờ QC */}
        <div className="bg-dark-card rounded-xl shadow-sm border border-dark-border overflow-hidden col-span-1">
          <div className="p-4 border-b border-dark-border bg-dark-bg/50">
            <h3 className="text-lg font-medium text-dark-text flex items-center">
              <ShieldCheck className="w-5 h-5 mr-2 text-neon-cyan" />
              Máy Chờ QC ({pendingDevices.length})
            </h3>
          </div>
          <div className="divide-y divide-dark-border max-h-[600px] overflow-y-auto">
            {pendingDevices.map((device) => {
              const task = state.tasks.find(
                (t) =>
                  t.deviceId === device.id && t.status === "HOAN_THANH_CHO_QC",
              );
              const assignee = state.users.find(
                (u) => u.id === task?.assigneeId,
              );
              return (
                <div
                  key={device.id}
                  onClick={() => setSelectedDevice(device)}
                  className={`p-4 cursor-pointer hover:bg-dark-border/50 transition-colors ${selectedDevice?.id === device.id ? "bg-dark-bg border-l-4 border-neon-cyan" : ""}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-dark-text">
                        {device.model}
                      </p>
                      <p className="text-xs text-dark-muted font-mono mt-1">
                        IMEI: <button onClick={(e) => { e.stopPropagation(); navigate(`/thiet-bi/${device.imei}`); }} className="text-neon-cyan hover:underline">{device.imei.slice(-4)}</button>
                      </p>
                    </div>
                    <span className="px-2 py-1 text-[10px] font-semibold rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      {task?.type}
                    </span>
                  </div>
                  <p className="text-xs text-dark-muted mt-2">
                    KT: {assignee?.name}
                  </p>
                </div>
              );
            })}
            {pendingDevices.length === 0 && (
              <div className="p-8 text-center text-dark-muted text-sm">
                Không có máy nào đang chờ QC.
              </div>
            )}
          </div>
        </div>

        {/* Cột phải: Chi tiết và Form QC */}
        <div className="col-span-2">
          {selectedDevice ? (
            <div className="bg-dark-card rounded-xl shadow-sm border border-dark-border h-full flex flex-col">
              <div className="p-6 border-b border-dark-border bg-dark-bg/50">
                <h2 className="text-xl font-semibold text-dark-text">
                  Biên Bản QC: {selectedDevice.model}
                </h2>
                <p className="text-sm text-dark-muted font-mono mt-1">
                  IMEI: <button onClick={() => navigate(`/thiet-bi/${selectedDevice.imei}`)} className="text-neon-cyan hover:underline">{selectedDevice.imei}</button>
                </p>
              </div>

              <div className="p-6 flex-1 overflow-y-auto space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-dark-muted mb-2">
                      Lỗi Đầu Vào (Bệnh Nền)
                    </h4>
                    <div className="bg-yellow-500/10 p-4 rounded-lg border border-yellow-500/30 text-sm text-yellow-500 whitespace-pre-wrap">
                      {selectedDevice.notes}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-dark-muted mb-2">
                      Ghi Chú Kỹ Thuật (Hoàn Thành)
                    </h4>
                    <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-500/30 text-sm text-blue-400 whitespace-pre-wrap">
                      {state.tasks.find(
                        (t) =>
                          t.deviceId === selectedDevice.id &&
                          t.status === "HOAN_THANH_CHO_QC",
                      )?.notes || "Không có ghi chú."}
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-dark-border">
                  <label className="block text-sm font-medium text-dark-muted mb-2">
                    Ghi chú QC (Bắt buộc nếu FAIL)
                  </label>
                  <textarea
                    rows={4}
                    className="block w-full rounded-md sm:text-sm p-3 dark-input"
                    placeholder="Ghi chú kết quả test, lỗi phát hiện thêm (nếu có)..."
                    value={qcNotes}
                    onChange={(e) => setQcNotes(e.target.value)}
                  />
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    onClick={handleFail}
                    className="px-6 py-3 bg-neon-pink/10 text-neon-pink border border-neon-pink/30 rounded-lg text-sm font-medium hover:bg-neon-pink/20 flex items-center transition-colors"
                  >
                    <XCircle className="w-5 h-5 mr-2" />
                    QC FAIL (Trả Lại)
                  </button>
                  <button
                    onClick={handlePass}
                    className="px-6 py-3 bg-neon-green/20 text-neon-green border border-neon-green/30 rounded-lg text-sm font-medium hover:bg-neon-green/30 flex items-center shadow-sm transition-colors"
                  >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    QC PASS (Chờ Bán)
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-dark-bg rounded-xl border border-dark-border border-dashed h-full min-h-[400px] flex flex-col items-center justify-center text-dark-muted">
              <ShieldCheck className="w-12 h-12 mb-4 text-dark-border" />
              <p>Chọn một máy bên trái để tiến hành QC</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
