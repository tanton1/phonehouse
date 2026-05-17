/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AppProvider } from "./store/AppContext";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import KhoMay from "./pages/KhoMay";
import TestDauVao from "./pages/TestDauVao";
import DieuPhoi from "./pages/DieuPhoi";
import KyThuat from "./pages/KyThuat";
import KhoLinhKien from "./pages/KhoLinhKien";
import QC from "./pages/QC";
import NhanVien from "./pages/NhanVien";
import PhanPhoi from "./pages/PhanPhoi";
import BanHang from "./pages/BanHang";
import LichSuDonHang from "./pages/LichSuDonHang";
import ChamCong from "./pages/ChamCong";
import SoQuy from "./pages/SoQuy";
import HangHoa from "./pages/HangHoa";
import NguonHang from "./pages/NguonHang";
import NhaCungCap from "./pages/NhaCungCap";
import BaoCaoThuNhap from "./pages/BaoCaoThuNhap";
import TiepNhan from "./pages/TiepNhan";
import QuyetDinh from "./pages/QuyetDinh";
import Login from "./pages/Login";
import Guide from "./pages/Guide";
import InventoryMatrix from "./pages/InventoryMatrix";
import PhieuNhapHang from "./pages/PhieuNhapHang";
import ErrorRateReport from "./pages/ErrorRateReport";
import LichSuThietBi from "./pages/LichSuThietBi";
import { useAppContext } from "./store/AppContext";

import KhachHang from "./pages/KhachHang";
import CaiDat from "./pages/CaiDat";

function AppRoutes() {
  const { state } = useAppContext();

  if (!state.currentUser) {
    return (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route
          index
          element={
            <ProtectedRoute
              allowedRoles={["ADMIN", "TRUONG_KT"]}
              requiredPermissions={["VIEW_DASHBOARD"]}
            >
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="tiep-nhan"
          element={
            <ProtectedRoute
              allowedRoles={["ADMIN", "TRUONG_KT", "SALE"]}
              requiredPermissions={["MANAGE_DEVICES"]}
            >
              <TiepNhan />
            </ProtectedRoute>
          }
        />
        <Route
          path="phieu-nhap-hang"
          element={
            <ProtectedRoute
              allowedRoles={["ADMIN", "KHO_MAY"]}
              requiredPermissions={["MANAGE_IMPORT"]}
            >
              <PhieuNhapHang />
            </ProtectedRoute>
          }
        />
        <Route
          path="kho-may"
          element={
            <ProtectedRoute
              allowedRoles={["ADMIN", "KHO_MAY"]}
              requiredPermissions={["MANAGE_DEVICES"]}
            >
              <KhoMay />
            </ProtectedRoute>
          }
        />
        <Route
          path="test-dau-vao"
          element={
            <ProtectedRoute
              allowedRoles={["ADMIN", "TESTER", "TRUONG_KT"]}
              requiredPermissions={["MANAGE_DEVICES"]}
            >
              <TestDauVao />
            </ProtectedRoute>
          }
        />
        <Route
          path="quyet-dinh"
          element={
            <ProtectedRoute
              allowedRoles={["ADMIN", "TRUONG_KT"]}
              requiredPermissions={["MANAGE_TASKS"]}
            >
              <QuyetDinh />
            </ProtectedRoute>
          }
        />
        <Route
          path="dieu-phoi"
          element={
            <ProtectedRoute
              allowedRoles={["ADMIN", "TRUONG_KT"]}
              requiredPermissions={["MANAGE_TASKS"]}
            >
              <DieuPhoi />
            </ProtectedRoute>
          }
        />
        <Route
          path="ky-thuat"
          element={
            <ProtectedRoute
              allowedRoles={["ADMIN", "KY_THUAT"]}
              requiredPermissions={["MANAGE_TASKS"]}
            >
              <KyThuat />
            </ProtectedRoute>
          }
        />
        <Route
          path="kho-linh-kien"
          element={
            <ProtectedRoute
              allowedRoles={["ADMIN", "KHO_LINH_KIEN"]}
              requiredPermissions={["MANAGE_PARTS"]}
            >
              <KhoLinhKien />
            </ProtectedRoute>
          }
        />
        <Route
          path="qc"
          element={
            <ProtectedRoute
              allowedRoles={["ADMIN", "QC"]}
              requiredPermissions={["MANAGE_QC"]}
            >
              <QC />
            </ProtectedRoute>
          }
        />
        <Route
          path="phan-phoi"
          element={
            <ProtectedRoute
              allowedRoles={["ADMIN", "SALE"]}
              requiredPermissions={["MANAGE_DISTRIBUTION"]}
            >
              <PhanPhoi />
            </ProtectedRoute>
          }
        />
        <Route
          path="ban-hang"
          element={
            <ProtectedRoute
              allowedRoles={["ADMIN", "SALE"]}
              requiredPermissions={["MANAGE_SALES"]}
            >
              <BanHang />
            </ProtectedRoute>
          }
        />
        <Route
          path="lich-su-don-hang"
          element={
            <ProtectedRoute
              allowedRoles={["ADMIN", "SALE"]}
              requiredPermissions={["MANAGE_SALES"]}
            >
              <LichSuDonHang />
            </ProtectedRoute>
          }
        />
        <Route
          path="khach-hang"
          element={
            <ProtectedRoute
              allowedRoles={["ADMIN", "SALE"]}
              requiredPermissions={["MANAGE_SALES"]}
            >
              <KhachHang />
            </ProtectedRoute>
          }
        />
        <Route
          path="so-quy"
          element={
            <ProtectedRoute
              allowedRoles={["ADMIN"]}
              requiredPermissions={["MANAGE_CASHBOOK"]}
            >
              <SoQuy />
            </ProtectedRoute>
          }
        />
        <Route
          path="hang-hoa"
          element={
            <ProtectedRoute
              allowedRoles={["ADMIN"]}
              requiredPermissions={["MANAGE_PRODUCTS"]}
            >
              <HangHoa />
            </ProtectedRoute>
          }
        />
        <Route
          path="bao-cao-ton-kho"
          element={
            <ProtectedRoute
              allowedRoles={["ADMIN", "KHO_MAY", "TRUONG_KT", "SALE"]}
              requiredPermissions={["VIEW_REPORTS"]}
            >
              <InventoryMatrix />
            </ProtectedRoute>
          }
        />
        <Route
          path="bao-cao-ty-le-loi"
          element={
            <ProtectedRoute
              allowedRoles={["ADMIN", "TRUONG_KT", "QC"]}
              requiredPermissions={["VIEW_REPORTS"]}
            >
              <ErrorRateReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="nguon-hang"
          element={
            <ProtectedRoute
              allowedRoles={["ADMIN", "KHO_MAY"]}
              requiredPermissions={["MANAGE_SUPPLIERS", "VIEW_REPORTS"]}
            >
              <NguonHang />
            </ProtectedRoute>
          }
        />
        <Route
          path="nha-cung-cap"
          element={
            <ProtectedRoute
              allowedRoles={["ADMIN", "KHO_MAY"]}
              requiredPermissions={["MANAGE_SUPPLIERS"]}
            >
              <NhaCungCap />
            </ProtectedRoute>
          }
        />
        <Route
          path="bao-cao-thu-nhap"
          element={
            <ProtectedRoute
              allowedRoles={["ADMIN", "KY_THUAT"]}
              requiredPermissions={["VIEW_REPORTS"]}
            >
              <BaoCaoThuNhap />
            </ProtectedRoute>
          }
        />
        <Route
          path="nhan-vien"
          element={
            <ProtectedRoute
              allowedRoles={["ADMIN"]}
              requiredPermissions={["MANAGE_USERS"]}
            >
              <NhanVien />
            </ProtectedRoute>
          }
        />
        <Route
          path="cham-cong"
          element={
            <ProtectedRoute>
              <ChamCong />
            </ProtectedRoute>
          }
        />
        <Route
          path="cai-dat"
          element={
            <ProtectedRoute
              allowedRoles={["ADMIN"]}
              requiredPermissions={[]}
            >
              <CaiDat />
            </ProtectedRoute>
          }
        />
        <Route path="huong-dan" element={<Guide />} />
        <Route path="thiet-bi/:imei" element={<LichSuThietBi />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Router>
        <Toaster
          position="top-right"
          toastOptions={{
            className: "bg-dark-card text-dark-text border border-dark-border",
            style: {
              background: "#1a1b1e",
              color: "#e4e5e7",
              border: "1px solid #2c2e33",
            },
            success: {
              iconTheme: {
                primary: "#00ffff",
                secondary: "#1a1b1e",
              },
            },
            error: {
              iconTheme: {
                primary: "#ff00ff",
                secondary: "#1a1b1e",
              },
            },
          }}
        />
        <AppRoutes />
      </Router>
    </AppProvider>
  );
}
