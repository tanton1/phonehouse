import React, { useState, useMemo } from "react";
import { useAppContext } from "../store/AppContext";
import { Product } from "../types";
import { Plus, Search, Edit, Trash2, Box, Smartphone, Wrench, Settings, ChevronDown, ChevronRight, Sparkles } from "lucide-react";
import SearchableSelect from "../components/SearchableSelect";
import DeviceHistoryModal from "../components/DeviceHistoryModal";

const SERIES_DATA = [
  { series: "iPhone 17 Series", models: ["iPhone 17", "iPhone 17 Plus"], capacities: ["128GB", "256GB", "512GB"], colors: ["Đen", "Trắng", "Xanh", "Hồng", "Xanh lá"] },
  { series: "iPhone 17 Pro Series", models: ["iPhone 17 Pro", "iPhone 17 Pro Max"], capacities: ["256GB", "512GB", "1TB"], colors: ["Titan Đen", "Titan Trắng", "Titan Tự Nhiên", "Titan Sa Mạc"] },
  { series: "iPhone 16 Series", models: ["iPhone 16", "iPhone 16 Plus"], capacities: ["128GB", "256GB", "512GB"], colors: ["Đen", "Trắng", "Hồng", "Xanh Lưu Ly", "Xanh Mòng Két"] },
  { series: "iPhone 16 Pro Series", models: ["iPhone 16 Pro", "iPhone 16 Pro Max"], capacities: ["256GB", "512GB", "1TB"], colors: ["Titan Đen", "Titan Trắng", "Titan Tự Nhiên", "Titan Sa Mạc"] },
  { series: "iPhone 15 Series", models: ["iPhone 15", "iPhone 15 Plus"], capacities: ["128GB", "256GB", "512GB"], colors: ["Đen", "Xanh Dương", "Xanh Lá", "Vàng", "Hồng"] },
  { series: "iPhone 15 Pro Series", models: ["iPhone 15 Pro", "iPhone 15 Pro Max"], capacities: ["256GB", "512GB", "1TB"], colors: ["Titan Đen", "Titan Trắng", "Titan Xanh", "Titan Tự Nhiên"] },
  { series: "iPhone 14 Series", models: ["iPhone 14", "iPhone 14 Plus"], capacities: ["128GB", "256GB", "512GB"], colors: ["Đen", "Trắng", "Xanh Dương", "Tím", "Vàng", "Đỏ"] },
  { series: "iPhone 14 Pro Series", models: ["iPhone 14 Pro", "iPhone 14 Pro Max"], capacities: ["128GB", "256GB", "512GB", "1TB"], colors: ["Đen", "Bạc", "Vàng", "Tím"] },
  { series: "iPhone 13 Series", models: ["iPhone 13 Mini", "iPhone 13"], capacities: ["128GB", "256GB", "512GB"], colors: ["Đen", "Trắng", "Đỏ", "Xanh Dương", "Hồng", "Xanh Lá"] },
  { series: "iPhone 13 Pro Series", models: ["iPhone 13 Pro", "iPhone 13 Pro Max"], capacities: ["128GB", "256GB", "512GB", "1TB"], colors: ["Đen", "Bạc", "Vàng", "Xanh Sierra", "Xanh Lá"] },
  { series: "iPhone 12 Series", models: ["iPhone 12 Mini", "iPhone 12"], capacities: ["64GB", "128GB", "256GB"], colors: ["Đen", "Trắng", "Đỏ", "Xanh Dương", "Xanh Lá", "Tím"] },
  { series: "iPhone 12 Pro Series", models: ["iPhone 12 Pro", "iPhone 12 Pro Max"], capacities: ["128GB", "256GB", "512GB"], colors: ["Xám", "Bạc", "Vàng", "Xanh Thái Bình Dương"] },
  { series: "iPhone 11 Series", models: ["iPhone 11"], capacities: ["64GB", "128GB", "256GB"], colors: ["Đen", "Trắng", "Đỏ", "Vàng", "Tím", "Xanh Lá"] },
  { series: "iPhone 11 Pro Series", models: ["iPhone 11 Pro", "iPhone 11 Pro Max"], capacities: ["64GB", "256GB", "512GB"], colors: ["Xám", "Bạc", "Vàng", "Xanh Bóng Đêm"] },
  { series: "iPhone X Series", models: ["iPhone X", "iPhone XR", "iPhone XS", "iPhone XS Max"], capacities: ["64GB", "128GB", "256GB", "512GB"], colors: ["Đen", "Trắng", "Vàng", "Xanh", "Đỏ", "Cam"] },
  { series: "iPhone 8 Series", models: ["iPhone 8", "iPhone 8 Plus"], capacities: ["64GB", "128GB", "256GB"], colors: ["Xám", "Bạc", "Vàng", "Đỏ"] },
  { series: "iPhone 7 Series", models: ["iPhone 7", "iPhone 7 Plus"], capacities: ["32GB", "128GB", "256GB"], colors: ["Đen Nhám", "Đen Bóng", "Bạc", "Vàng", "Vàng Hồng", "Đỏ"] },
];

const getModelAbbreviation = (model: string) => {
  let abbr = model.replace("iPhone ", "IP").replace(" Plus", "PL").replace(" Pro Max", "PM").replace(" Pro", "P").replace(" Mini", "M").replace(" ", "");
  return abbr;
};

const getSeriesGrouping = (model: string) => {
  for (const group of SERIES_DATA) {
    if (group.models.includes(model)) return group.series;
  }
  if (model.includes("17")) return "iPhone 17 Series";
  if (model.includes("16")) return "iPhone 16 Series";
  if (model.includes("15")) return "iPhone 15 Series";
  if (model.includes("14")) return "iPhone 14 Series";
  if (model.includes("13")) return "iPhone 13 Series";
  if (model.includes("12")) return "iPhone 12 Series";
  if (model.includes("11")) return "iPhone 11 Series";
  if (model.includes("XS") || model.includes("XR") || model.includes("X")) return "iPhone X Series";
  if (model.includes("8")) return "iPhone 8 Series";
  if (model.includes("7")) return "iPhone 7 Series";
  return "Khác";
};

export default function HangHoa() {
  const { state, dispatch } = useAppContext();
  const [isAdding, setIsAdding] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<"ALL" | "DEVICE" | "PART" | "SERVICE">("DEVICE");
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [expandedSeries, setExpandedSeries] = useState<Record<string, boolean>>({});

  const [formData, setFormData] = useState<Partial<Product>>({
    id: "",
    name: "",
    category: "DEVICE",
    model: "",
    costPrice: 0,
    sellPrice: 0,
    commission: 0,
    notes: "",
  });

  const filteredProducts = state.products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.model.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "ALL" || p.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedDeviceProducts = useMemo(() => {
    const groups: Record<string, Product[]> = {};
    const devices = filteredProducts.filter(p => p.category === "DEVICE");
    devices.forEach(product => {
      const series = getSeriesGrouping(product.model);
      if (!groups[series]) groups[series] = [];
      groups[series].push(product);
    });
    // Sort SERIES_DATA order
    const sortedGroups: Record<string, Product[]> = {};
    SERIES_DATA.forEach(s => {
      if (groups[s.series]) {
        sortedGroups[s.series] = groups[s.series].sort((a,b) => a.name.localeCompare(b.name));
      }
    });
    if (groups["Khác"]) sortedGroups["Khác"] = groups["Khác"].sort((a,b) => a.name.localeCompare(b.name));
    return sortedGroups;
  }, [filteredProducts]);

  const uniqueModels: string[] = Array.from(new Set(state.products.map(p => p.model))).filter((m): m is string => !!m).sort();

  const handleGenerateSeries = (series: string) => {
    const seriesConfig = SERIES_DATA.find(s => s.series === series);
    if (!seriesConfig) return;

    if (!window.confirm(`Bạn có muốn tự động tạo tất cả mã SKU cho ${series}? (Quá trình này có thể tạo ra hàng chục mã SP)`)) return;

    let addedCount = 0;
    seriesConfig.models.forEach(model => {
      seriesConfig.capacities.forEach(capacity => {
        seriesConfig.colors.forEach(color => {
          // Replace spacing and standardise ID 
          const colorAbbr = color.toUpperCase().replace(/\s/g, '');
          const id = `${getModelAbbreviation(model)}-${capacity}-${colorAbbr}`;
          
          // check if already exists
          if (!state.products.find(p => p.id === id)) {
             const newProduct: Product = {
               id,
               name: `${model} ${capacity} ${color}`,
               category: "DEVICE",
               model,
               capacity,
               color,
               costPrice: 0,
               sellPrice: 0,
             };
             dispatch({ type: "ADD_PRODUCT", payload: newProduct });
             addedCount++;
          }
        });
      });
    });

    if (addedCount > 0) {
      alert(`Đã tạo thành công ${addedCount} mã sản phẩm mới cho ${series}!`);
    } else {
      alert(`Tất cả mã sản phẩm của ${series} đã tồn tại.`);
    }
  };

  const toggleSeries = (series: string) => {
    setExpandedSeries(prev => ({ ...prev, [series]: !prev[series] }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id || !formData.name || !formData.model) {
      return alert("Vui lòng điền đầy đủ Mã SP, Tên SP và Model");
    }

    if (editingProduct) {
      dispatch({ type: "UPDATE_PRODUCT", payload: formData as Product });
      alert("Đã cập nhật hàng hóa!");
    } else {
      const exists = state.products.find(p => p.id === formData.id);
      if (exists) return alert("Mã sản phẩm đã tồn tại!");
      dispatch({ type: "ADD_PRODUCT", payload: formData as Product });
      alert("Đã thêm hàng hóa mới!");
    }

    setIsAdding(false);
    setEditingProduct(null);
    setFormData({ id: "", name: "", category: "DEVICE", model: "", costPrice: 0, sellPrice: 0, commission: 0, notes: "", color: "", capacity: "" });
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData(product);
    setIsAdding(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa hàng hóa này?")) {
      dispatch({ type: "DELETE_PRODUCT", payload: id });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-neon-cyan neon-text flex items-center">
          <Box className="w-6 h-6 mr-2" />
          Danh Mục Hàng Hóa
        </h1>
        <button
          onClick={() => {
            setIsAdding(true);
            setEditingProduct(null);
            setFormData({ id: "", name: "", category: "DEVICE", model: "", costPrice: 0, sellPrice: 0, notes: "", color: "", capacity: "" });
          }}
          className="w-full sm:w-auto px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center neon-button"
        >
          <Plus className="w-4 h-4 mr-2" />
          Thêm Hàng Hóa
        </button>
      </div>

      {isAdding && (
        <div className="bg-dark-card p-6 rounded-xl shadow-sm border border-neon-cyan/50">
          <h2 className="text-lg font-semibold mb-4 text-neon-cyan">
            {editingProduct ? "Cập Nhật Hàng Hóa" : "Thêm Hàng Hóa Mới"}
          </h2>
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-muted mb-1">Mã SP (ID) *</label>
              <input
                type="text" required disabled={!!editingProduct}
                className="w-full rounded-md p-2 text-sm dark-input disabled:opacity-50"
                placeholder="VD: SP-IP12, LK-PIN-IP12"
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-muted mb-1">Tên Hàng Hóa *</label>
              <input
                type="text" required
                className="w-full rounded-md p-2 text-sm dark-input"
                placeholder="VD: iPhone 12 Pro Max, Pin iPhone 12"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-muted mb-1">Danh Mục *</label>
              <select
                className="w-full rounded-md p-2 text-sm dark-input"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
              >
                <option value="DEVICE">Máy (Điện thoại, Tablet...)</option>
                <option value="PART">Linh Kiện (Pin, Màn hình...)</option>
                <option value="SERVICE">Task Kỹ Thuật (Sửa chữa, Ép kính...)</option>
              </select>
            </div>
            <div>
              <SearchableSelect
                label="Model Tương Thích"
                required
                options={uniqueModels}
                value={formData.model || ""}
                onChange={(val) => setFormData({ ...formData, model: val })}
                placeholder="VD: iPhone 12 Pro Max"
              />
            </div>
            {formData.category === 'DEVICE' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-dark-muted mb-1">Dung lượng</label>
                  <input
                    type="text"
                    className="w-full rounded-md p-2 text-sm dark-input"
                    placeholder="VD: 128GB, 256GB"
                    value={formData.capacity || ""}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-muted mb-1">Màu sắc</label>
                  <input
                    type="text"
                    className="w-full rounded-md p-2 text-sm dark-input"
                    placeholder="VD: Titan Đen, Titan Trắng"
                    value={formData.color || ""}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  />
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium text-dark-muted mb-1">Giá Vốn Dự Kiến (VNĐ)</label>
              <input
                type="number" min="0"
                className="w-full rounded-md p-2 text-sm dark-input"
                value={formData.costPrice || ''}
                onChange={(e) => setFormData({ ...formData, costPrice: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-muted mb-1">Giá Bán Dự Kiến (VNĐ)</label>
              <input
                type="number" min="0"
                className="w-full rounded-md p-2 text-sm dark-input"
                value={formData.sellPrice || ''}
                onChange={(e) => setFormData({ ...formData, sellPrice: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-muted mb-1 text-neon-pink">Hoa Hồng KTV (VNĐ)</label>
              <input
                type="number" min="0"
                className="w-full rounded-md p-2 text-sm dark-input border-neon-pink/30"
                placeholder="VD: 50000"
                value={formData.commission || ''}
                onChange={(e) => setFormData({ ...formData, commission: Number(e.target.value) })}
              />
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-dark-muted mb-1">Ghi Chú</label>
              <textarea
                className="w-full rounded-md p-2 text-sm dark-input"
                rows={2}
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
            <div className="md:col-span-2 flex justify-end space-x-3 mt-4">
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setEditingProduct(null);
                }}
                className="px-4 py-2 border border-dark-border rounded-md text-sm font-medium text-dark-muted hover:bg-dark-border hover:text-dark-text"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-md shadow-sm text-sm font-medium neon-button-green"
              >
                {editingProduct ? "Cập Nhật" : "Lưu Hàng Hóa"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-dark-card rounded-xl shadow-sm border border-dark-border">
        <div className="p-4 border-b border-dark-border bg-dark-bg/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-t-xl">
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => setFilterCategory("ALL")}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${filterCategory === "ALL" ? "bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30" : "text-dark-muted hover:bg-dark-border"}`}
            >
              Tất Cả
            </button>
            <button 
              onClick={() => setFilterCategory("DEVICE")}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors flex items-center ${filterCategory === "DEVICE" ? "bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30" : "text-dark-muted hover:bg-dark-border"}`}
            >
              <Smartphone className="w-4 h-4 mr-1" />
              Máy
            </button>
            <button 
              onClick={() => setFilterCategory("PART")}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors flex items-center ${filterCategory === "PART" ? "bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30" : "text-dark-muted hover:bg-dark-border"}`}
            >
              <Wrench className="w-4 h-4 mr-1" />
              Linh Kiện
            </button>
            <button 
              onClick={() => setFilterCategory("SERVICE")}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors flex items-center ${filterCategory === "SERVICE" ? "bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30" : "text-dark-muted hover:bg-dark-border"}`}
            >
              <Settings className="w-4 h-4 mr-1" />
              Task Kỹ Thuật
            </button>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-muted" />
            <input
              type="text"
              placeholder="Tìm mã, tên, model..."
              className="w-full pl-9 pr-4 py-2 rounded-md text-sm dark-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto rounded-b-xl">
          <table className="min-w-full dark-table">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Mã SP</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Tên Hàng Hóa</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Danh Mục</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Model</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Giá Vốn</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Giá Bán</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neon-pink">Hoa Hồng</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Tồn Kho</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filterCategory === 'DEVICE' ? (
                Object.entries(groupedDeviceProducts).map(([series, products]) => {
                  const isExpanded = expandedSeries[series] || false;
                  return (
                    <React.Fragment key={series}>
                      <tr className="bg-dark-border/20 border-y border-dark-border cursor-pointer hover:bg-dark-border/40 transition-colors" onClick={() => toggleSeries(series)}>
                        <td colSpan={9} className="px-6 py-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center text-neon-cyan font-bold text-sm">
                              {isExpanded ? <ChevronDown className="w-5 h-5 mr-2" /> : <ChevronRight className="w-5 h-5 mr-2" />}
                              {series} ({products.length} mã)
                            </div>
                            {SERIES_DATA.some(s => s.series === series) && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleGenerateSeries(series); }}
                                className="px-3 py-1 flex items-center text-xs bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30 rounded-md hover:bg-neon-cyan hover:text-dark-bg transition-colors"
                              >
                                <Sparkles className="w-3 h-3 mr-1" /> Sinh mã tự động
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {isExpanded && products.map(product => {
                        const hasCapacityInName = product.capacity || ["16GB", "32GB", "64GB", "128GB", "256GB", "512GB", "1TB"].find(cap => product.name.includes(cap));
                        const hasColorInName = product.color || ["Đen", "Trắng", "Xanh", "Vàng", "Hồng", "Đỏ", "Tím", "Titan", "Bạc", "Xám", "Cam"].find(c => product.name.includes(c));
                        
                        const inventory = state.devices.filter(d => {
                          if (d.model !== product.model || d.status === 'DA_BAN') return false;
                          if (hasCapacityInName && d.capacity !== hasCapacityInName) return false;
                          if (hasColorInName && d.color && !d.color.includes(hasColorInName) && !hasColorInName.includes(d.color)) return false;
                          return true;
                        }).length;

                        return (
                          <tr key={product.id} className="hover:bg-dark-border/30 bg-dark-bg/20">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neon-cyan pl-10">
                              {product.id}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-text font-medium">
                              {product.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className="px-2 py-1 text-xs rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">Máy</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-muted">
                              {product.model}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-muted">
                              {product.costPrice.toLocaleString('vi-VN')} đ
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-neon-green">
                              {product.sellPrice.toLocaleString('vi-VN')} đ
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-neon-pink font-bold">
                              {product.commission?.toLocaleString('vi-VN') || 0} đ
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-dark-text">
                              <button 
                                onClick={() => setSelectedModel(product.model)}
                                className="hover:text-neon-cyan underline decoration-neon-cyan/50 underline-offset-4"
                              >
                                {inventory}
                              </button>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => handleEdit(product)}
                                className="text-dark-muted hover:text-neon-cyan mr-3 transition-colors"
                                title="Sửa"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(product.id)}
                                className="text-dark-muted hover:text-neon-pink transition-colors"
                                title="Xóa"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })
              ) : (
                filteredProducts.map((product) => {
                  const hasCapacityInName = product.capacity || ["16GB", "32GB", "64GB", "128GB", "256GB", "512GB", "1TB"].find(cap => product.name.includes(cap));
                  const hasColorInName = product.color || ["Đen", "Trắng", "Xanh", "Vàng", "Hồng", "Đỏ", "Tím", "Titan", "Bạc", "Xám", "Cam"].find(c => product.name.includes(c));
                  
                  const inventory = product.category === 'DEVICE'
                    ? state.devices.filter(d => {
                        if (d.model !== product.model || d.status === 'DA_BAN') return false;
                        if (hasCapacityInName && d.capacity !== hasCapacityInName) return false;
                        if (hasColorInName && d.color && !d.color.includes(hasColorInName) && !hasColorInName.includes(d.color)) return false;
                        return true;
                      }).length
                    : product.category === 'PART'
                      ? state.parts.find(p => p.id === product.id)?.stock || 0
                      : 0;
  
                  return (
                    <tr key={product.id} className="hover:bg-dark-border/30">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neon-cyan">
                        {product.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-text font-medium">
                        {product.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          product.category === 'DEVICE' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' : 
                          product.category === 'PART' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30' :
                          'bg-neon-pink/10 text-neon-pink border border-neon-pink/30'
                        }`}>
                          {product.category === 'DEVICE' ? 'Máy' : product.category === 'PART' ? 'Linh Kiện' : 'Task Kỹ Thuật'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-muted">
                        {product.model}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-muted">
                        {product.costPrice.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neon-green">
                        {product.sellPrice.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neon-pink font-bold">
                        {product.commission?.toLocaleString('vi-VN') || 0} đ
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-dark-text">
                        {product.category === 'DEVICE' ? (
                          <button 
                            onClick={() => setSelectedModel(product.model)}
                            className="hover:text-neon-cyan underline decoration-neon-cyan/50 underline-offset-4"
                          >
                            {inventory}
                          </button>
                        ) : (
                          inventory
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(product)}
                          className="text-dark-muted hover:text-neon-cyan mr-3 transition-colors"
                          title="Sửa"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="text-dark-muted hover:text-neon-pink transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-sm text-dark-muted">
                    Không tìm thấy hàng hóa nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {selectedModel && (
        <DeviceHistoryModal 
          devices={state.devices} 
          model={selectedModel} 
          onClose={() => setSelectedModel(null)} 
        />
      )}
    </div>
  );
}
