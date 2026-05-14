import React, { createContext, useContext, useReducer, ReactNode, useEffect, useRef, useState } from "react";
import { db } from "../firebase";
import { collection, doc, setDoc, deleteDoc, onSnapshot, getDocs } from "firebase/firestore";
import {
  AppState,
  User,
  Device,
  Task,
  Part,
  PartRequest,
  Incident,
  QCReport,
  Supplier,
  Product,
  AppNotification,
  ImportReceipt,
  Order,
  Customer,
  Transaction,
} from "../types";

export type Action =
  | { type: "SET_USER"; payload: User }
  | { type: "ADD_DEVICE"; payload: Device }
  | { type: "UPDATE_DEVICE"; payload: Device }
  | { type: "DELETE_DEVICE"; payload: string }
  | { type: "ADD_TASK"; payload: Task }
  | { type: "UPDATE_TASK"; payload: Task }
  | { type: "ADD_PART_REQUEST"; payload: PartRequest }
  | { type: "UPDATE_PART_REQUEST"; payload: PartRequest }
  | { type: "ADD_INCIDENT"; payload: Incident }
  | { type: "UPDATE_INCIDENT"; payload: Incident }
  | { type: "ADD_QC_REPORT"; payload: QCReport }
  | { type: "ADD_USER"; payload: User }
  | { type: "UPDATE_USER"; payload: User }
  | { type: "DELETE_USER"; payload: string }
  | { type: "ADD_SUPPLIER"; payload: Supplier }
  | { type: "UPDATE_SUPPLIER"; payload: Supplier }
  | { type: "ADD_PART"; payload: Part }
  | { type: "UPDATE_PART"; payload: Part }
  | { type: "ADD_PRODUCT"; payload: Product }
  | { type: "UPDATE_PRODUCT"; payload: Product }
  | { type: "DELETE_PRODUCT"; payload: string }
  | { type: "ADD_NOTIFICATION"; payload: AppNotification }
  | { type: "UPDATE_NOTIFICATION"; payload: AppNotification }
  | { type: "DELETE_NOTIFICATION"; payload: string }
  | { type: "ADD_IMPORT_RECEIPT"; payload: ImportReceipt }
  | { type: "UPDATE_IMPORT_RECEIPT"; payload: ImportReceipt }
  | { type: "DELETE_IMPORT_RECEIPT"; payload: string }
  | { type: "ADD_ORDER"; payload: Order }
  | { type: "UPDATE_ORDER"; payload: Order }
  | { type: "ADD_CUSTOMER"; payload: Customer }
  | { type: "UPDATE_CUSTOMER"; payload: Customer }
  | { type: "ADD_TRANSACTION"; payload: Transaction }
  | { type: "UPDATE_TRANSACTION"; payload: Transaction }
  | { type: "DELETE_TRANSACTION"; payload: string }
  | { type: "ADD_CUSTOMER_GROUP"; payload: import('../types').CustomerGroupDef }
  | { type: "UPDATE_CUSTOMER_GROUP"; payload: import('../types').CustomerGroupDef }
  | { type: "DELETE_CUSTOMER_GROUP"; payload: string }
  | { type: "ADD_ATTENDANCE"; payload: import('../types').AttendanceRecord }
  | { type: "UPDATE_ATTENDANCE"; payload: import('../types').AttendanceRecord }
  | { type: "SET_FULL_STATE"; payload: Partial<AppState> }
  | {
      type: "UPDATE_PART_STOCK";
      payload: { partId: string; quantity: number };
    }
  | {
      type: "UPDATE_TECH_STOCK";
      payload: { technicianId: string; partId: string; quantity: number };
    };

export const MOCK_USERS: User[] = [
  { id: "u-admin-new", name: "Nguyễn Nhật Tân", role: "ADMIN", status: "ACTIVE", email: "nhattank16.1@gmail.com", password: "0905410812", phone: "0905410812" },
  { id: "u1", name: "Admin", role: "ADMIN", status: "ACTIVE", email: "admin@ifix.vn", password: "123", phone: "0901234567" },
  { id: "u2", name: "Kho Máy", role: "KHO_MAY", status: "ACTIVE", email: "khomay@ifix.vn", password: "123", phone: "0901234568" },
  { id: "u3", name: "Tester", role: "TESTER", status: "ACTIVE", email: "tester@ifix.vn", password: "123", phone: "0901234569" },
  { id: "u4", name: "Trưởng KT", role: "TRUONG_KT", status: "ACTIVE", email: "truongkt@ifix.vn", password: "123", phone: "0901234570" },
  { id: "u5", name: "Kỹ Thuật A", role: "KY_THUAT", status: "ACTIVE", email: "kta@ifix.vn", password: "123", phone: "0901234571" },
  { id: "u6", name: "Kỹ Thuật B", role: "KY_THUAT", status: "ACTIVE", email: "ktb@ifix.vn", password: "123", phone: "0901234572" },
  { id: "u7", name: "Kho Linh Kiện", role: "KHO_LINH_KIEN", status: "ACTIVE", email: "kholk@ifix.vn", password: "123", phone: "0901234573" },
  { id: "u8", name: "QC", role: "QC", status: "ACTIVE", email: "qc@ifix.vn", password: "123", phone: "0901234574" },
  { id: "u9", name: "Sale XSTORE", role: "SALE", storeId: "XSTORE", status: "ACTIVE", email: "sale@ifix.vn", password: "123", phone: "0901234575" },
  { id: "u10", name: "Sale PH Đà Nẵng", role: "SALE", storeId: "PH_DN", status: "ACTIVE", email: "sale.phdn@ifix.vn", password: "123", phone: "0901234576" },
];

const MOCK_PARTS: Part[] = [
  {
    id: "p1",
    name: "Pin iPhone 12",
    model: "iPhone 12",
    cost: 280000,
    stock: 50,
  },
  {
    id: "p2",
    name: "Màn hình iPhone 12",
    model: "iPhone 12",
    cost: 1500000,
    stock: 10,
  },
  { id: "p3", name: "Keo ron", model: "Chung", cost: 20000, stock: 200 },
];

const MOCK_SUPPLIERS: Supplier[] = [
  { id: "sup1", name: "Nhà cung cấp A", phone: "0909123456", address: "HCM" },
  { id: "sup2", name: "Khách lẻ (Trade-in)", phone: "", address: "" },
];

const MOCK_PRODUCTS: Product[] = [
  { id: "IP-8P", name: "iPhone 8 Plus", category: "DEVICE", model: "iPhone 8 Plus", costPrice: 3000000, sellPrice: 4500000 },
  { id: "IP-X", name: "iPhone X", category: "DEVICE", model: "iPhone X", costPrice: 4000000, sellPrice: 5500000 },
  { id: "IP-XR", name: "iPhone XR", category: "DEVICE", model: "iPhone XR", costPrice: 4500000, sellPrice: 6000000 },
  { id: "IP-XS", name: "iPhone XS", category: "DEVICE", model: "iPhone XS", costPrice: 5000000, sellPrice: 6500000 },
  { id: "IP-XSM", name: "iPhone XS Max", category: "DEVICE", model: "iPhone XS Max", costPrice: 6000000, sellPrice: 8000000 },
  { id: "IP-11", name: "iPhone 11", category: "DEVICE", model: "iPhone 11", costPrice: 6500000, sellPrice: 8500000 },
  { id: "IP-11P", name: "iPhone 11 Pro", category: "DEVICE", model: "iPhone 11 Pro", costPrice: 8000000, sellPrice: 10500000 },
  { id: "IP-11PM", name: "iPhone 11 Pro Max", category: "DEVICE", model: "iPhone 11 Pro Max", costPrice: 10000000, sellPrice: 13000000 },
  { id: "IP-12M", name: "iPhone 12 Mini", category: "DEVICE", model: "iPhone 12 Mini", costPrice: 7500000, sellPrice: 9500000 },
  { id: "IP-12", name: "iPhone 12", category: "DEVICE", model: "iPhone 12", costPrice: 9000000, sellPrice: 11500000 },
  { id: "IP-12P", name: "iPhone 12 Pro", category: "DEVICE", model: "iPhone 12 Pro", costPrice: 11000000, sellPrice: 14000000 },
  { id: "IP-12PM", name: "iPhone 12 Pro Max", category: "DEVICE", model: "iPhone 12 Pro Max", costPrice: 13000000, sellPrice: 16500000 },
  { id: "IP-13M", name: "iPhone 13 Mini", category: "DEVICE", model: "iPhone 13 Mini", costPrice: 10000000, sellPrice: 12500000 },
  { id: "IP-13", name: "iPhone 13", category: "DEVICE", model: "iPhone 13", costPrice: 12000000, sellPrice: 15000000 },
  { id: "IP-13P", name: "iPhone 13 Pro", category: "DEVICE", model: "iPhone 13 Pro", costPrice: 15000000, sellPrice: 18500000 },
  { id: "IP-13PM", name: "iPhone 13 Pro Max", category: "DEVICE", model: "iPhone 13 Pro Max", costPrice: 17000000, sellPrice: 21000000 },
  { id: "IP-14", name: "iPhone 14", category: "DEVICE", model: "iPhone 14", costPrice: 14000000, sellPrice: 17500000 },
  { id: "IP-14PL", name: "iPhone 14 Plus", category: "DEVICE", model: "iPhone 14 Plus", costPrice: 16000000, sellPrice: 19500000 },
  { id: "IP-14P", name: "iPhone 14 Pro", category: "DEVICE", model: "iPhone 14 Pro", costPrice: 19000000, sellPrice: 23000000 },
  { id: "IP-14PM", name: "iPhone 14 Pro Max", category: "DEVICE", model: "iPhone 14 Pro Max", costPrice: 21000000, sellPrice: 26000000 },
  { id: "IP-15", name: "iPhone 15", category: "DEVICE", model: "iPhone 15", costPrice: 17000000, sellPrice: 21000000 },
  { id: "IP-15PL", name: "iPhone 15 Plus", category: "DEVICE", model: "iPhone 15 Plus", costPrice: 19000000, sellPrice: 23500000 },
  { id: "IP-15P", name: "iPhone 15 Pro", category: "DEVICE", model: "iPhone 15 Pro", costPrice: 22000000, sellPrice: 27000000 },
  { id: "IP-15PM", name: "iPhone 15 Pro Max", category: "DEVICE", model: "iPhone 15 Pro Max", costPrice: 25000000, sellPrice: 31000000 },
  { id: "IP-16", name: "iPhone 16", category: "DEVICE", model: "iPhone 16", costPrice: 20000000, sellPrice: 24500000 },
  { id: "IP-16PL", name: "iPhone 16 Plus", category: "DEVICE", model: "iPhone 16 Plus", costPrice: 22000000, sellPrice: 27000000 },
  { id: "IP-16P", name: "iPhone 16 Pro", category: "DEVICE", model: "iPhone 16 Pro", costPrice: 26000000, sellPrice: 31500000 },
  { id: "IP-16PM", name: "iPhone 16 Pro Max", category: "DEVICE", model: "iPhone 16 Pro Max", costPrice: 29000000, sellPrice: 35500000 },
  { id: "IP-17", name: "iPhone 17", category: "DEVICE", model: "iPhone 17", costPrice: 24000000, sellPrice: 29500000 },
  { id: "IP-17PL", name: "iPhone 17 Plus", category: "DEVICE", model: "iPhone 17 Plus", costPrice: 26000000, sellPrice: 32000000 },
  { id: "IP-17P", name: "iPhone 17 Pro", category: "DEVICE", model: "iPhone 17 Pro", costPrice: 30000000, sellPrice: 36500000 },
  { id: "IP-17PM", name: "iPhone 17 Pro Max", category: "DEVICE", model: "iPhone 17 Pro Max", costPrice: 33000000, sellPrice: 40500000 },
  // PIN EU VTECH
  { id: "PIN-6G-VTECH", name: "Pin 6G EU VTECH", category: "PART", model: "iPhone 6G", costPrice: 80000, sellPrice: 125000 },
  { id: "PIN-7G-VTECH", name: "Pin 7G EU VTECH", category: "PART", model: "iPhone 7G", costPrice: 90000, sellPrice: 130000 },
  { id: "PIN-8G-VTECH", name: "Pin 8G EU VTECH", category: "PART", model: "iPhone 8G", costPrice: 95000, sellPrice: 135000 },
  { id: "PIN-X-VTECH", name: "Pin X EU VTECH", category: "PART", model: "iPhone X", costPrice: 140000, sellPrice: 195000 },
  { id: "PIN-11-VTECH", name: "Pin 11 EU VTECH", category: "PART", model: "iPhone 11", costPrice: 140000, sellPrice: 195000 },
  { id: "PIN-12-VTECH", name: "Pin 12/12Pro EU VTECH", category: "PART", model: "iPhone 12", costPrice: 150000, sellPrice: 205000 },
  { id: "PIN-13-VTECH", name: "Pin 13 EU VTECH", category: "PART", model: "iPhone 13", costPrice: 170000, sellPrice: 235000 },
  { id: "PIN-14-VTECH", name: "Pin 14 EU VTECH", category: "PART", model: "iPhone 14", costPrice: 200000, sellPrice: 270000 },
  { id: "PIN-15-VTECH", name: "Pin 15G EU VTECH", category: "PART", model: "iPhone 15", costPrice: 220000, sellPrice: 300000 },
  // VỎ ZIN THẨM
  { id: "VO-6S", name: "Vỏ 6S Zin Thẩm", category: "PART", model: "iPhone 6S", costPrice: 50000, sellPrice: 90000 },
  { id: "VO-7G", name: "Vỏ 7G Zin Thẩm", category: "PART", model: "iPhone 7G", costPrice: 80000, sellPrice: 125000 },
  { id: "VO-8G", name: "Vỏ 8G Zin Thẩm", category: "PART", model: "iPhone 8G", costPrice: 100000, sellPrice: 150000 },
  { id: "VO-X", name: "Vỏ X Zin Thẩm", category: "PART", model: "iPhone X", costPrice: 160000, sellPrice: 240000 },
  { id: "VO-11", name: "Vỏ 11 Zin Thẩm", category: "PART", model: "iPhone 11", costPrice: 130000, sellPrice: 195000 },
  { id: "VO-12", name: "Vỏ 12 Zin Thẩm", category: "PART", model: "iPhone 12", costPrice: 150000, sellPrice: 220000 },
  { id: "VO-13", name: "Vỏ 13 Zin Thẩm", category: "PART", model: "iPhone 13", costPrice: 180000, sellPrice: 250000 },
  // KÍNH LƯNG
  { id: "KL-8G", name: "Kính Lưng 8G", category: "PART", model: "iPhone 8G", costPrice: 15000, sellPrice: 30000 },
  { id: "KL-11", name: "Kính Lưng 11 (To)", category: "PART", model: "iPhone 11", costPrice: 25000, sellPrice: 48000 },
  { id: "KL-12", name: "Kính Lưng 12 (To)", category: "PART", model: "iPhone 12", costPrice: 30000, sellPrice: 57000 },
  { id: "KL-13", name: "Kính Lưng 13 (To)", category: "PART", model: "iPhone 13", costPrice: 40000, sellPrice: 70000 },
  { id: "LK-PIN-IP12", name: "Pin iPhone 12 Dung Lượng Cao", category: "PART", model: "iPhone 12", costPrice: 280000, sellPrice: 450000 },
];

const MOCK_CUSTOMERS: Customer[] = [
  { id: "CUST-1", name: "Nguyễn Văn A", phone: "0901234567", group: "VIP", totalDebt: 0, totalSpent: 25000000, points: 250, createdAt: new Date().toISOString() },
  { id: "CUST-2", name: "Cửa hàng Huy Hoàng", phone: "0987654321", group: "SI_DAI_LY", totalDebt: 1500000, totalSpent: 120000000, points: 1200, createdAt: new Date(Date.now() - 86400000 * 30).toISOString() },
  { id: "CUST-3", name: "Trần Thị B", phone: "0912345678", group: "THUONG_XUYEN", totalDebt: 500000, totalSpent: 5500000, points: 55, createdAt: new Date(Date.now() - 86400000 * 10).toISOString() },
];

const initialState: AppState = {
  currentUser: null,
  users: MOCK_USERS,
  devices: [],
  tasks: [],
  parts: MOCK_PARTS,
  partRequests: [],
  incidents: [],
  qcReports: [],
  technicianStocks: [],
  suppliers: MOCK_SUPPLIERS,
  products: MOCK_PRODUCTS,
  notifications: [],
  importReceipts: [],
  orders: [],
  customers: MOCK_CUSTOMERS,
  customerGroups: [
    { id: 'VANG_LAI', name: 'Vãng lai' },
    { id: 'THUONG_XUYEN', name: 'Thường xuyên' },
    { id: 'VIP', name: 'VIP', color: '#ffeb3b' },
    { id: 'SI_DAI_LY', name: 'Sỉ / Đại Lý' }
  ],
  transactions: [],
  attendanceRecords: [],
};

const appReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case "SET_USER":
      return { ...state, currentUser: action.payload };
    case "ADD_ORDER":
      return { ...state, orders: [...state.orders, action.payload] };
    case "UPDATE_ORDER":
      return {
        ...state,
        orders: state.orders.map((o) =>
          o.id === action.payload.id ? action.payload : o
        ),
      };
    case "ADD_CUSTOMER":
      return { ...state, customers: [...state.customers, action.payload] };
    case "UPDATE_CUSTOMER":
      return {
        ...state,
        customers: state.customers.map((c) =>
          c.id === action.payload.id ? action.payload : c
        ),
      };
    case "ADD_TRANSACTION":
      return { ...state, transactions: [...state.transactions, action.payload] };
    case "UPDATE_TRANSACTION":
      return {
        ...state,
        transactions: state.transactions.map((t) =>
          t.id === action.payload.id ? action.payload : t
        ),
      };
    case "DELETE_TRANSACTION":
      return {
        ...state,
        transactions: state.transactions.filter((t) => t.id !== action.payload),
      };
    case "ADD_IMPORT_RECEIPT":
      return { ...state, importReceipts: [...state.importReceipts, action.payload] };
    case "UPDATE_IMPORT_RECEIPT":
      return {
        ...state,
        importReceipts: state.importReceipts.map((ir) =>
          ir.id === action.payload.id ? action.payload : ir
        ),
      };
    case "DELETE_IMPORT_RECEIPT":
      return {
        ...state,
        importReceipts: state.importReceipts.filter((ir) => ir.id !== action.payload),
      };
    case "ADD_DEVICE":
      return { ...state, devices: [...state.devices, action.payload] };
    case "UPDATE_DEVICE":
      console.log("Updating device:", action.payload);
      return {
        ...state,
        devices: state.devices.map((d) =>
          d.id === action.payload.id ? action.payload : d,
        ),
      };
    case "DELETE_DEVICE":
      return {
        ...state,
        devices: state.devices.filter((d) => d.id !== action.payload),
      };
    case "ADD_TASK":
      return { ...state, tasks: [...state.tasks, action.payload] };
    case "UPDATE_TASK":
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.payload.id ? action.payload : t,
        ),
      };
    case "ADD_PART_REQUEST":
      return {
        ...state,
        partRequests: [...state.partRequests, action.payload],
      };
    case "UPDATE_PART_REQUEST":
      return {
        ...state,
        partRequests: state.partRequests.map((pr) =>
          pr.id === action.payload.id ? action.payload : pr,
        ),
      };
    case "ADD_INCIDENT":
      return { ...state, incidents: [...state.incidents, action.payload] };
    case "UPDATE_INCIDENT":
      return {
        ...state,
        incidents: state.incidents.map((i) =>
          i.id === action.payload.id ? action.payload : i,
        ),
      };
    case "ADD_QC_REPORT":
      return { ...state, qcReports: [...state.qcReports, action.payload] };
    case "UPDATE_PART_STOCK":
      return {
        ...state,
        parts: state.parts.map((p) =>
          p.id === action.payload.partId
            ? { ...p, stock: p.stock + action.payload.quantity }
            : p,
        ),
      };
    case "UPDATE_TECH_STOCK": {
      const { technicianId, partId, quantity } = action.payload;
      const existingStockIndex = state.technicianStocks.findIndex(
        (ts) => ts.technicianId === technicianId && ts.partId === partId
      );

      if (existingStockIndex >= 0) {
        const newStocks = [...state.technicianStocks];
        newStocks[existingStockIndex] = {
          ...newStocks[existingStockIndex],
          quantity: newStocks[existingStockIndex].quantity + quantity,
        };
        // Remove if quantity <= 0
        if (newStocks[existingStockIndex].quantity <= 0) {
          newStocks.splice(existingStockIndex, 1);
        }
        return { ...state, technicianStocks: newStocks };
      } else if (quantity > 0) {
        return {
          ...state,
          technicianStocks: [
            ...state.technicianStocks,
            { id: `ts-${Date.now()}-${Math.random()}`, technicianId, partId, quantity },
          ],
        };
      }
      return state;
    }
    case "ADD_USER":
      return { ...state, users: [...state.users, action.payload] };
    case "UPDATE_USER": {
      const updatedCurrentUser = state.currentUser?.id === action.payload.id ? action.payload : state.currentUser;
      if (updatedCurrentUser && state.currentUser?.id === action.payload.id) {
        localStorage.setItem("phonehouse_user", JSON.stringify(updatedCurrentUser));
      }
      return {
        ...state,
        users: state.users.map((u) =>
          u.id === action.payload.id ? action.payload : u,
        ),
        currentUser: updatedCurrentUser
      };
    }
    case "DELETE_USER":
      return {
        ...state,
        users: state.users.filter((u) => u.id !== action.payload),
      };
    case "ADD_SUPPLIER":
      return { ...state, suppliers: [...state.suppliers, action.payload] };
    case "UPDATE_SUPPLIER":
      return {
        ...state,
        suppliers: state.suppliers.map((s) =>
          s.id === action.payload.id ? action.payload : s,
        ),
      };
    case "ADD_PART":
      return { ...state, parts: [...state.parts, action.payload] };
    case "UPDATE_PART":
      return {
        ...state,
        parts: state.parts.map((p) =>
          p.id === action.payload.id ? action.payload : p,
        ),
      };
    case "ADD_PRODUCT":
      return { ...state, products: [...state.products, action.payload] };
    case "UPDATE_PRODUCT":
      return {
        ...state,
        products: state.products.map((p) =>
          p.id === action.payload.id ? action.payload : p,
        ),
      };
    case "DELETE_PRODUCT":
      return {
        ...state,
        products: state.products.filter((p) => p.id !== action.payload),
      };
    case "ADD_NOTIFICATION":
      return { ...state, notifications: [action.payload, ...state.notifications] };
    case "UPDATE_NOTIFICATION":
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === action.payload.id ? action.payload : n
        ),
      };
    case "DELETE_NOTIFICATION":
      return {
        ...state,
        notifications: state.notifications.filter((n) => n.id !== action.payload),
      };
    case "ADD_CUSTOMER_GROUP":
      return { ...state, customerGroups: [...state.customerGroups, action.payload] };
    case "UPDATE_CUSTOMER_GROUP":
      return {
        ...state,
        customerGroups: state.customerGroups.map(p =>
          p.id === action.payload.id ? action.payload : p
        ),
      };
    case "DELETE_CUSTOMER_GROUP":
      return {
        ...state,
        customerGroups: state.customerGroups.filter(p => p.id !== action.payload),
      };
    case "ADD_ATTENDANCE":
      return { ...state, attendanceRecords: [...state.attendanceRecords, action.payload] };
    case "UPDATE_ATTENDANCE":
      return {
        ...state,
        attendanceRecords: state.attendanceRecords.map((a) =>
          a.id === action.payload.id ? action.payload : a
        ),
      };
    case "SET_FULL_STATE": {
      const newState = { ...state, ...action.payload };
      if (action.payload.users && state.currentUser) {
        const updatedUser = action.payload.users.find((u: User) => u.id === state.currentUser!.id);
        if (updatedUser) {
          newState.currentUser = updatedUser;
          localStorage.setItem("phonehouse_user", JSON.stringify(updatedUser));
        }
      }
      return newState;
    }
    default:
      return state;
  }
};

const AppContext = createContext<
  { state: AppState; dispatch: React.Dispatch<Action> } | undefined
>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const stateRef = useRef(state);
  stateRef.current = state;
  const [isFirebaseLoaded, setIsFirebaseLoaded] = useState(!db);

  useEffect(() => {
    if (!db) return;

    const initializeMockData = async () => {
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        if (usersSnap.empty) {
          console.log("Initializing mock data to Firestore...");
          for (const u of MOCK_USERS) await setDoc(doc(db, 'users', u.id), u);
          for (const p of MOCK_PARTS) await setDoc(doc(db, 'parts', p.id), p);
          for (const s of MOCK_SUPPLIERS) await setDoc(doc(db, 'suppliers', s.id), s);
          for (const pr of MOCK_PRODUCTS) await setDoc(doc(db, 'products', pr.id), pr);
        }
      } catch (error) {
        console.error("Error initializing mock data:", error);
      }
    };

    initializeMockData();

    // Load user from localStorage
    const savedUser = localStorage.getItem("phonehouse_user");
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        dispatch({ type: "SET_USER", payload: user });
      } catch (e) {
        console.error("Error parsing saved user", e);
      }
    }

    const collections = [
      { key: 'users', name: 'users' },
      { key: 'devices', name: 'devices' },
      { key: 'tasks', name: 'tasks' },
      { key: 'parts', name: 'parts' },
      { key: 'partRequests', name: 'partRequests' },
      { key: 'incidents', name: 'incidents' },
      { key: 'qcReports', name: 'qcReports' },
      { key: 'technicianStocks', name: 'technicianStocks' },
      { key: 'suppliers', name: 'suppliers' },
      { key: 'products', name: 'products' },
      { key: 'notifications', name: 'notifications' },
      { key: 'importReceipts', name: 'importReceipts' },
      { key: 'orders', name: 'orders' },
      { key: 'customers', name: 'customers' },
      { key: 'customerGroups', name: 'customerGroups' },
      { key: 'transactions', name: 'transactions' },
      { key: 'attendanceRecords', name: 'attendanceRecords' },
    ];

    const unsubscribes = collections.map(({ key, name }) => {
      return onSnapshot(collection(db, name), (snapshot) => {
        const data = snapshot.docs.map(doc => doc.data());
        dispatch({ type: 'SET_FULL_STATE', payload: { [key]: data } });
      });
    });

    // Assume loaded after a short delay to allow initial snapshots
    const timer = setTimeout(() => setIsFirebaseLoaded(true), 1000);

    return () => {
      clearTimeout(timer);
      unsubscribes.forEach(unsub => unsub());
    };
  }, []);

  const firestoreDispatch = async (action: Action) => {
    // Optimistic update
    dispatch(action);

    if (!db) return;

    try {
      switch (action.type) {
        case 'ADD_DEVICE':
        case 'UPDATE_DEVICE':
          await setDoc(doc(db, 'devices', action.payload.id), action.payload);
          break;
        case 'DELETE_DEVICE':
          await deleteDoc(doc(db, 'devices', action.payload));
          break;
        case 'ADD_TASK':
        case 'UPDATE_TASK':
          await setDoc(doc(db, 'tasks', action.payload.id), action.payload);
          break;
        case 'ADD_PART_REQUEST':
        case 'UPDATE_PART_REQUEST':
          await setDoc(doc(db, 'partRequests', action.payload.id), action.payload);
          break;
        case 'ADD_INCIDENT':
        case 'UPDATE_INCIDENT':
          await setDoc(doc(db, 'incidents', action.payload.id), action.payload);
          break;
        case 'ADD_QC_REPORT':
          await setDoc(doc(db, 'qcReports', action.payload.id), action.payload);
          break;
        case 'ADD_USER':
        case 'UPDATE_USER':
          await setDoc(doc(db, 'users', action.payload.id), action.payload);
          break;
        case 'DELETE_USER':
          await deleteDoc(doc(db, 'users', action.payload));
          break;
        case 'ADD_SUPPLIER':
        case 'UPDATE_SUPPLIER':
          await setDoc(doc(db, 'suppliers', action.payload.id), action.payload);
          break;
        case 'ADD_PART':
        case 'UPDATE_PART':
          await setDoc(doc(db, 'parts', action.payload.id), action.payload);
          break;
        case 'ADD_PRODUCT':
        case 'UPDATE_PRODUCT':
          await setDoc(doc(db, 'products', action.payload.id), action.payload);
          break;
        case 'DELETE_PRODUCT':
          await deleteDoc(doc(db, 'products', action.payload));
          break;
        case 'ADD_NOTIFICATION':
        case 'UPDATE_NOTIFICATION':
          await setDoc(doc(db, 'notifications', action.payload.id), action.payload);
          break;
        case 'DELETE_NOTIFICATION':
          await deleteDoc(doc(db, 'notifications', action.payload));
          break;
        case 'ADD_IMPORT_RECEIPT':
        case 'UPDATE_IMPORT_RECEIPT':
          await setDoc(doc(db, 'importReceipts', action.payload.id), action.payload);
          break;
        case 'DELETE_IMPORT_RECEIPT':
          await deleteDoc(doc(db, 'importReceipts', action.payload));
          break;
        case 'ADD_ORDER':
        case 'UPDATE_ORDER':
          await setDoc(doc(db, 'orders', action.payload.id), action.payload);
          break;
        case 'ADD_CUSTOMER':
        case 'UPDATE_CUSTOMER':
          await setDoc(doc(db, 'customers', action.payload.id), action.payload);
          break;
        case 'ADD_TRANSACTION':
        case 'UPDATE_TRANSACTION':
          await setDoc(doc(db, 'transactions', action.payload.id), action.payload);
          break;
        case 'DELETE_TRANSACTION':
          await deleteDoc(doc(db, 'transactions', action.payload));
          break;
        case 'ADD_CUSTOMER_GROUP':
        case 'UPDATE_CUSTOMER_GROUP':
          await setDoc(doc(db, 'customerGroups', action.payload.id), action.payload);
          break;
        case 'DELETE_CUSTOMER_GROUP':
          await deleteDoc(doc(db, 'customerGroups', action.payload));
          break;
        case 'ADD_ATTENDANCE':
        case 'UPDATE_ATTENDANCE':
          await setDoc(doc(db, 'attendanceRecords', action.payload.id), action.payload);
          break;
        case 'UPDATE_PART_STOCK': {
          const part = stateRef.current.parts.find(p => p.id === action.payload.partId);
          if (part) {
            await setDoc(doc(db, 'parts', part.id), { ...part, stock: part.stock + action.payload.quantity });
          }
          break;
        }
        case 'UPDATE_TECH_STOCK': {
          const { technicianId, partId, quantity } = action.payload;
          const existing = stateRef.current.technicianStocks.find(ts => ts.technicianId === technicianId && ts.partId === partId);
          if (existing) {
            const newQuantity = existing.quantity + quantity;
            if (newQuantity <= 0) {
              await deleteDoc(doc(db, 'technicianStocks', existing.id));
            } else {
              await setDoc(doc(db, 'technicianStocks', existing.id), { ...existing, quantity: newQuantity });
            }
          } else if (quantity > 0) {
            const newId = `ts-${Date.now()}-${Math.random()}`;
            await setDoc(doc(db, 'technicianStocks', newId), { id: newId, technicianId, partId, quantity });
          }
          break;
        }
      }
    } catch (error) {
      console.error("Firestore write error:", error);
    }
  };

  if (!isFirebaseLoaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-dark-bg text-neon-cyan">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-cyan"></div>
        <span className="ml-3 font-medium">Đang tải dữ liệu...</span>
      </div>
    );
  }

  return (
    <AppContext.Provider value={{ state, dispatch: firestoreDispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context)
    throw new Error("useAppContext must be used within AppProvider");
  return context;
};
