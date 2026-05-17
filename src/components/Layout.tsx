import React, { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAppContext } from "../store/AppContext";
import { MOCK_USERS } from "../store/AppContext";
import {
  LayoutDashboard,
  Smartphone,
  ClipboardCheck,
  Wrench,
  Settings,
  Package,
  ShieldCheck,
  UserCircle,
  Users,
  Store,
  Menu,
  X,
  DollarSign,
  UserPlus,
  HelpCircle,
  LogOut,
  Table,
  Box,
  Truck,
  FileText,
  Activity,
  BookOpen,
  AlertTriangle,
  KeyRound,
  ShoppingCart,
  Clock,
  ChevronLeft,
  Home,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import GlobalSearch from "./GlobalSearch";
import NotificationBell from "./NotificationBell";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const NAV_GROUPS = [
  {
    title: "Tổng Quan",
    items: [
      {
        path: "/",
        label: "Dashboard",
        icon: LayoutDashboard,
        roles: ["ADMIN", "TRUONG_KT"],
        permissions: ["VIEW_DASHBOARD"],
      },
    ],
  },
  {
    title: "Quản Lý Kho",
    items: [
      {
        path: "/hang-hoa",
        label: "Danh Mục Hàng Hóa",
        icon: Box,
        roles: ["ADMIN"],
        permissions: ["MANAGE_PRODUCTS"],
      },
      {
        path: "/phieu-nhap-hang",
        label: "Phiếu Nhập Hàng",
        icon: FileText,
        roles: ["ADMIN", "KHO_MAY"],
        permissions: ["MANAGE_IMPORT"],
      },
      {
        path: "/kho-may",
        label: "Kho Máy",
        icon: Smartphone,
        roles: ["ADMIN", "KHO_MAY"],
        permissions: ["MANAGE_DEVICES"],
      },
      {
        path: "/kho-linh-kien",
        label: "Kho Linh Kiện",
        icon: Package,
        roles: ["ADMIN", "KHO_LINH_KIEN"],
        permissions: ["MANAGE_PARTS"],
      },
    ],
  },
  {
    title: "Quy Trình Kỹ Thuật",
    items: [
      {
        path: "/test-dau-vao",
        label: "Test Đầu Vào",
        icon: Activity,
        roles: ["ADMIN", "TESTER", "TRUONG_KT"],
        permissions: ["MANAGE_DEVICES"],
      },
      {
        path: "/quyet-dinh",
        label: "Duyệt Quyết Định",
        icon: ClipboardCheck,
        roles: ["ADMIN", "TRUONG_KT"],
        permissions: ["MANAGE_TASKS"],
      },
      {
        path: "/dieu-phoi",
        label: "Điều Phối Task",
        icon: Settings,
        roles: ["ADMIN", "TRUONG_KT"],
        permissions: ["MANAGE_TASKS"],
      },
      {
        path: "/ky-thuat",
        label: "Kỹ Thuật",
        icon: Wrench,
        roles: ["ADMIN", "KY_THUAT"],
        permissions: ["MANAGE_TASKS"],
      },
      {
        path: "/qc",
        label: "QC & Thẩm Định",
        icon: ShieldCheck,
        roles: ["ADMIN", "QC"],
        permissions: ["MANAGE_QC"],
      },
    ],
  },
  {
    title: "Kinh Doanh & Báo Cáo",
    items: [
      {
        path: "/ban-hang",
        label: "Bán Hàng (POS)",
        icon: ShoppingCart,
        roles: ["ADMIN", "SALE"],
        permissions: ["MANAGE_SALES"],
      },
      {
        path: "/lich-su-don-hang",
        label: "Lịch Sử Bán Hàng",
        icon: FileText,
        roles: ["ADMIN", "SALE"],
        permissions: ["MANAGE_SALES"],
      },
      {
        path: "/khach-hang",
        label: "Khách Hàng & Công Nợ",
        icon: Users,
        roles: ["ADMIN", "SALE"],
        permissions: ["MANAGE_SALES"],
      },
      {
        path: "/phan-phoi",
        label: "Điều Chuyển",
        icon: Store,
        roles: ["ADMIN", "SALE"],
        permissions: ["MANAGE_DISTRIBUTION"],
      },
      {
        path: "/so-quy",
        label: "Sổ Quỹ",
        icon: DollarSign,
        roles: ["ADMIN"],
        permissions: ["MANAGE_CASHBOOK"],
      },
      {
        path: "/bao-cao-ton-kho",
        label: "Báo Cáo Tồn Kho",
        icon: Table,
        roles: ["ADMIN", "KHO_MAY", "TRUONG_KT"],
        permissions: ["VIEW_REPORTS"],
      },
      {
        path: "/nha-cung-cap",
        label: "Nhà Cung Cấp & Công Nợ",
        icon: Truck,
        roles: ["ADMIN", "KHO_MAY"],
        permissions: ["MANAGE_SUPPLIERS"],
      },
      {
        path: "/nguon-hang",
        label: "Báo Cáo Theo Nguồn",
        icon: Truck,
        roles: ["ADMIN", "KHO_MAY"],
        permissions: ["MANAGE_SUPPLIERS", "VIEW_REPORTS"],
      },
      {
        path: "/bao-cao-ty-le-loi",
        label: "Báo Cáo Tỷ Lệ Lỗi",
        icon: AlertTriangle,
        roles: ["ADMIN", "TRUONG_KT", "QC"],
        permissions: ["VIEW_REPORTS"],
      },
      {
        path: "/bao-cao-thu-nhap",
        label: "Báo Cáo Thu Nhập",
        icon: DollarSign,
        roles: ["ADMIN", "KY_THUAT"],
        permissions: ["VIEW_REPORTS"],
      },
    ],
  },
  {
    title: "Hệ Thống",
    items: [
      {
        path: "/cham-cong",
        label: "Check-in & Chấm Công",
        icon: Clock,
        roles: [
          "ADMIN",
          "KHO_MAY",
          "TESTER",
          "TRUONG_KT",
          "KY_THUAT",
          "KHO_LINH_KIEN",
          "QC",
          "SALE",
        ],
      },
      {
        path: "/nhan-vien",
        label: "Nhân Sự",
        icon: Users,
        roles: ["ADMIN"],
        permissions: ["MANAGE_USERS"],
      },
      {
        path: "/cai-dat",
        label: "Cài Đặt",
        icon: Settings, // Make sure Settings is imported from lucide-react
        roles: ["ADMIN"],
        permissions: [],
      },
      {
        path: "/huong-dan",
        label: "Hướng Dẫn",
        icon: BookOpen,
        roles: [
          "ADMIN",
          "KHO_MAY",
          "TESTER",
          "TRUONG_KT",
          "KY_THUAT",
          "KHO_LINH_KIEN",
          "QC",
          "SALE",
        ],
        permissions: [],
      },
    ],
  },
];

export default function Layout() {
  const { state, dispatch } = useAppContext();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    old: "",
    new: "",
    confirm: "",
  });

  // Close sidebar on mobile when route changes
  React.useEffect(() => {
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname]);

  const originalUserStr = localStorage.getItem("phonehouse_original_admin");
  const originalUser = originalUserStr ? JSON.parse(originalUserStr) : null;
  const isOriginalAdmin =
    state.currentUser?.role === "ADMIN" || originalUser?.role === "ADMIN";

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const user = state.users.find((u) => u.id === e.target.value);
    if (user) {
      if (state.currentUser?.role === "ADMIN" && user.role !== "ADMIN") {
        localStorage.setItem(
          "phonehouse_original_admin",
          JSON.stringify(state.currentUser),
        );
      } else if (user.id === originalUser?.id || user.role === "ADMIN") {
        localStorage.removeItem("phonehouse_original_admin");
      }

      dispatch({ type: "SET_USER", payload: user });
      localStorage.setItem("phonehouse_user", JSON.stringify(user));
      toast.success(`Đã chuyển sang tài khoản: ${user.name}`);

      // Determine the first accessible route for the new user
      let newPath = "/huong-dan";
      for (const group of NAV_GROUPS) {
        const visibleItem = group.items.find((item) => {
          if (user.role === "ADMIN") return true;
          let hasPerm = false;
          if (item.permissions && item.permissions.length > 0) {
            const userPermissions = user.permissions || [];
            hasPerm = item.permissions.some((p) =>
              userPermissions.includes(p as any),
            );
          }
          return hasPerm || item.roles.includes(user.role);
        });
        if (visibleItem) {
          newPath = visibleItem.path;
          break;
        }
      }

      // Navigate to prevent access denied errors
      navigate(newPath);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("phonehouse_user");
    localStorage.removeItem("phonehouse_original_admin");
    window.location.href = "/"; // Simple reload to clear state
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.currentUser) return;

    // Check old password
    const isOldPasswordValid =
      state.currentUser.password === passwordForm.old ||
      (!state.currentUser.password && passwordForm.old === "123456");

    if (!isOldPasswordValid) {
      toast.error("Mật khẩu hiện tại không đúng");
      return;
    }

    if (passwordForm.new !== passwordForm.confirm) {
      toast.error("Mật khẩu mới không khớp");
      return;
    }

    if (passwordForm.new.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }

    const updatedUser = { ...state.currentUser, password: passwordForm.new };
    dispatch({ type: "UPDATE_USER", payload: updatedUser });
    dispatch({ type: "SET_USER", payload: updatedUser });
    localStorage.setItem("phonehouse_user", JSON.stringify(updatedUser));

    toast.success("Đổi mật khẩu thành công!");
    setIsChangePasswordOpen(false);
    setPasswordForm({ old: "", new: "", confirm: "" });
  };

  return (
    <div className="flex h-screen bg-dark-bg font-sans text-dark-text overflow-hidden">
      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-dark-card border-r border-dark-border flex flex-col transform transition-transform duration-300 ease-in-out",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="p-6 border-b border-dark-border flex justify-between items-center">
          <Link to="/">
            <h1 className="text-2xl font-bold text-neon-cyan tracking-tight neon-text">
              Phone House
            </h1>
            <p className="text-xs text-dark-muted mt-1">
              Hệ thống quản lý kỹ thuật
            </p>
          </Link>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 text-dark-muted hover:bg-dark-border hover:text-dark-text rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
          {NAV_GROUPS.map((group, idx) => {
            const visibleItems = group.items.filter((item) => {
              if (!state.currentUser) return false;
              if (state.currentUser.role === "ADMIN") return true;
              if (item.permissions && item.permissions.length > 0) {
                const userPermissions = state.currentUser.permissions || [];
                const hasPermission = item.permissions.some((p) =>
                  userPermissions.includes(p as any),
                );
                if (hasPermission) return true;
              }
              return item.roles.includes(state.currentUser.role);
            });

            if (visibleItems.length === 0) return null;

            return (
              <div key={idx} className="space-y-1">
                <h3 className="px-3 text-[10px] font-semibold text-dark-muted uppercase tracking-wider mb-2">
                  {group.title}
                </h3>
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsSidebarOpen(false)}
                      className={cn(
                        "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                        isActive
                          ? "bg-neon-cyan/10 text-neon-cyan neon-border"
                          : "text-dark-text hover:bg-dark-border hover:text-neon-cyan",
                      )}
                    >
                      <Icon
                        className={cn(
                          "mr-3 h-4 w-4",
                          isActive ? "text-neon-cyan" : "text-dark-muted",
                        )}
                      />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        <div className="p-4 border-t border-dark-border bg-dark-card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <UserCircle className="h-8 w-8 text-dark-muted mr-2" />
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-dark-text truncate">
                  {state.currentUser?.name}
                </p>
                <p className="text-[10px] text-neon-pink uppercase tracking-wider">
                  {state.currentUser?.role}
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => setIsChangePasswordOpen(true)}
                className="p-2 text-dark-muted hover:text-neon-cyan transition-colors"
                title="Đổi mật khẩu"
              >
                <KeyRound className="w-4 h-4" />
              </button>
              <button
                onClick={handleLogout}
                className="p-2 text-dark-muted hover:text-neon-pink transition-colors"
                title="Đăng xuất"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Role switcher for ADMIN only */}
          {isOriginalAdmin && (
            <div className="mt-4 pt-4 border-t border-dark-border/50">
              <label className="block text-[10px] text-dark-muted uppercase tracking-widest mb-2 font-bold">
                Chuyển quyền nhanh{" "}
                {originalUser ? `(Đang đóng giả từ ${originalUser.name})` : ""}
              </label>
              <select
                className="w-full text-xs bg-dark-bg border-dark-border text-dark-text rounded-md py-1.5 focus:border-neon-cyan focus:ring-neon-cyan dark-input"
                value={state.currentUser?.id || ""}
                onChange={handleRoleChange}
              >
                {state.users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
              {originalUser && (
                <button
                  onClick={() =>
                    handleRoleChange({
                      target: { value: originalUser.id },
                    } as any)
                  }
                  className="mt-2 w-full text-xs py-1.5 bg-neon-pink/10 text-neon-pink hover:bg-neon-pink/20 rounded border border-neon-pink/30 flex justify-center items-center font-bold"
                >
                  <LogOut className="w-3 h-3 mr-1" />
                  Trở về {originalUser.name}
                </button>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div
        className={cn(
          "flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300 ease-in-out",
          isSidebarOpen ? "lg:ml-64" : "ml-0",
        )}
      >
        {/* Header (Mobile & Desktop) */}
        <header className="bg-dark-card border-b border-dark-border shrink-0 sticky top-0 z-30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 lg:px-8 gap-4">
            <div className="flex items-center justify-between sm:w-auto">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="p-2 -ml-2 text-dark-muted hover:bg-dark-border hover:text-dark-text rounded-md"
                  title="Menu"
                >
                  <Menu className="w-6 h-6" />
                </button>
                {location.pathname !== "/" && (
                  <>
                    <button
                      onClick={() => navigate(-1)}
                      className="p-2 text-dark-muted hover:bg-dark-border hover:text-dark-text rounded-md"
                      title="Quay lại"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => navigate("/")}
                      className="p-2 text-dark-muted hover:bg-dark-border hover:text-dark-text rounded-md"
                      title="Trang chủ"
                    >
                      <Home className="w-5 h-5" />
                    </button>
                  </>
                )}
                <h1 className="text-xl font-bold text-neon-cyan tracking-tight neon-text lg:hidden ml-2">
                  Phone House
                </h1>
              </div>
            </div>

            <div className="flex-1 w-full sm:max-w-md lg:max-w-2xl flex items-center gap-4">
              <GlobalSearch />
              <NotificationBell />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-dark-bg pb-20">
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>

        {/* Bottom Navigation (Fixed) */}
        <nav className="fixed bottom-0 left-0 w-full z-40 bg-dark-card border-t border-dark-border lg:hidden flex justify-around p-2 shadow-[0_-5px_20px_rgba(0,0,0,0.5)] pb-safe">
          {[
            {
              path: "/",
              label: "Home",
              icon: LayoutDashboard,
              roles: ["ADMIN", "KHO_MAY", "KY_THUAT", "SALE", "QUAN_LY"],
            },
            {
              path: "/ban-hang",
              label: "POS",
              icon: ShoppingCart,
              roles: ["ADMIN", "SALE", "QUAN_LY"],
            },
            {
              path: "/tiep-nhan",
              label: "Tiếp Nhận",
              icon: Box,
              roles: ["ADMIN", "KY_THUAT", "QUAN_LY"],
            },
          ]
            .filter(
              (item) =>
                item.roles.includes(state.currentUser?.role || "") ||
                item.roles.includes("ALL"),
            )
            .map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex flex-col items-center p-2 text-[10px] font-medium rounded-lg transition-colors w-1/4",
                    isActive
                      ? "text-neon-cyan"
                      : "text-dark-muted hover:text-dark-text",
                  )}
                >
                  <Icon className="h-5 w-5 mb-1" />
                  <span className="truncate w-full text-center">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="flex flex-col items-center p-2 text-[10px] font-medium rounded-lg transition-colors w-1/4 text-dark-muted hover:text-dark-text"
          >
            <Menu className="h-5 w-5 mb-1" />
            <span className="truncate w-full text-center">Menu</span>
          </button>
        </nav>
      </div>
      {/* Change Password Modal */}
      {isChangePasswordOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold text-dark-text mb-4 flex items-center">
              <KeyRound className="w-5 h-5 mr-2 text-neon-cyan" />
              Đổi Mật Khẩu
            </h2>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-muted mb-1">
                  Mật khẩu hiện tại
                </label>
                <input
                  type="password"
                  required
                  className="w-full p-2 rounded-md bg-dark-bg border border-dark-border text-dark-text focus:ring-1 focus:ring-neon-cyan outline-none"
                  value={passwordForm.old}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, old: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-muted mb-1">
                  Mật khẩu mới
                </label>
                <input
                  type="password"
                  required
                  className="w-full p-2 rounded-md bg-dark-bg border border-dark-border text-dark-text focus:ring-1 focus:ring-neon-cyan outline-none"
                  value={passwordForm.new}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, new: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-muted mb-1">
                  Xác nhận mật khẩu mới
                </label>
                <input
                  type="password"
                  required
                  className="w-full p-2 rounded-md bg-dark-bg border border-dark-border text-dark-text focus:ring-1 focus:ring-neon-cyan outline-none"
                  value={passwordForm.confirm}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      confirm: e.target.value,
                    })
                  }
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsChangePasswordOpen(false);
                    setPasswordForm({ old: "", new: "", confirm: "" });
                  }}
                  className="px-4 py-2 border border-dark-border rounded-md text-sm font-medium text-dark-muted hover:bg-dark-border hover:text-dark-text transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md shadow-sm text-sm font-medium neon-button"
                >
                  Đổi Mật Khẩu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
