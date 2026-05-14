import React from "react";
import { 
  BookOpen, 
  Smartphone, 
  ClipboardCheck, 
  Wrench, 
  Package, 
  ShieldCheck, 
  Store, 
  Settings,
  UserPlus,
  HelpCircle,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

const SECTIONS = [
  {
    role: "KHO_MAY / TIẾP NHẬN",
    icon: UserPlus,
    color: "text-blue-400",
    steps: [
      "Vào mục 'Tiếp Nhận Máy' để nhập thông tin máy mới về.",
      "Nhập IMEI, Model, Nguồn hàng (Nhập kho, Thu cũ, Bảo hành).",
      "Ghi chú tình trạng ngoại quan (LN, 99%, 98%) và chụp ảnh nếu cần.",
      "Sau khi lưu, máy sẽ tự động chuyển sang trạng thái 'Chờ Test' trong Kho Máy."
    ]
  },
  {
    role: "TESTER (KIỂM TRA ĐẦU VÀO)",
    icon: ClipboardCheck,
    color: "text-purple-400",
    steps: [
      "Vào mục 'Test Đầu Vào' để xem danh sách máy đang chờ kiểm tra.",
      "Kiểm tra chi tiết: Màn hình, Cảm ứng, Camera, Pin, FaceID/TouchID, Loa, Mic...",
      "Ghi nhận kết quả test chi tiết vào hệ thống.",
      "Sau khi hoàn tất, máy sẽ chuyển sang trạng thái 'Chờ Quyết Định'."
    ]
  },
  {
    role: "TRƯỞNG KỸ THUẬT (ĐIỀU PHỐI)",
    icon: Settings,
    color: "text-orange-400",
    steps: [
      "Vào 'Duyệt Quyết Định' để xem kết quả test và đưa ra phương án xử lý.",
      "Các phương án: 'Bán ngay' (nếu máy ngon), 'Sửa chữa' (nếu lỗi), 'Rã xác' (nếu nát).",
      "Nếu chọn 'Sửa chữa', vào mục 'Điều Phối Task' để giao việc cho Kỹ thuật viên cụ thể.",
      "Theo dõi tiến độ sửa chữa và hỗ trợ KTV khi có phát sinh sự cố."
    ]
  },
  {
    role: "KỸ THUẬT VIÊN (KTV)",
    icon: Wrench,
    color: "text-green-400",
    steps: [
      "Vào mục 'Kỹ Thuật' để xem các Task được giao.",
      "Nhấn 'Nhận Task' để bắt đầu làm việc.",
      "Nếu cần linh kiện, nhấn 'Yêu cầu linh kiện' để Kho Linh Kiện xuất hàng.",
      "Nếu gặp lỗi phát sinh trong quá trình sửa, nhấn 'Báo cáo sự cố' để Trưởng KT xử lý.",
      "Sửa xong nhấn 'Hoàn thành' để máy chuyển sang bộ phận QC."
    ]
  },
  {
    role: "KHO LINH KIỆN",
    icon: Package,
    color: "text-yellow-400",
    steps: [
      "Vào 'Kho Linh Kiện' để quản lý số lượng tồn kho (Màn hình, Pin, Vỏ...).",
      "Xem danh sách 'Yêu cầu linh kiện' từ các KTV.",
      "Nhấn 'Xác nhận xuất' để trừ kho và giao linh kiện cho KTV.",
      "Nhập hàng mới từ nhà cung cấp để cập nhật số lượng tồn."
    ]
  },
  {
    role: "QC (KIỂM SOÁT CHẤT LƯỢNG)",
    icon: ShieldCheck,
    color: "text-red-400",
    steps: [
      "Vào mục 'QC' để kiểm tra lại các máy vừa được KTV sửa xong.",
      "Nếu đạt yêu cầu (PASS), máy sẽ chuyển sang trạng thái 'Chờ Bán'.",
      "Nếu không đạt (FAIL), ghi chú lỗi và trả về cho KTV đó sửa lại."
    ]
  },
  {
    role: "SALE / PHÂN PHỐI",
    icon: Store,
    color: "text-pink-400",
    steps: [
      "Vào 'Phân Phối & Bán Hàng' để xem danh sách máy đã sẵn sàng bán.",
      "Thực hiện lệnh 'Bán hàng' (Nhập thông tin khách, giá bán).",
      "Hoặc thực hiện 'Chuyển kho' sang các chi nhánh khác (Đà Nẵng, Huế, Quảng Ngãi).",
      "Máy sau khi bán sẽ chuyển sang trạng thái 'Đã Bán' và lưu lịch sử."
    ]
  },
  {
    role: "ADMIN (QUẢN TRỊ)",
    icon: ShieldCheck,
    color: "text-neon-cyan",
    steps: [
      "Quản lý danh sách 'Nhân Viên' và phân quyền truy cập.",
      "Quản lý danh mục 'Hàng Hóa' (Model máy, giá nhập/bán tham khảo).",
      "Xem báo cáo tổng quát về doanh thu, lợi nhuận và hiệu suất làm việc của từng bộ phận.",
      "Sử dụng tính năng 'Chuyển quyền nhanh' để hỗ trợ các bộ phận khi cần thiết."
    ]
  }
];

export default function Guide() {
  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-dark-text tracking-tight flex items-center">
            <BookOpen className="mr-3 text-neon-cyan w-8 h-8" />
            Hướng Dẫn Sử Dụng Hệ Thống
          </h1>
          <p className="text-dark-muted mt-2">
            Quy trình vận hành chi tiết cho từng bộ phận tại Phone House
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {SECTIONS.map((section, idx) => (
          <div key={idx} className="bg-dark-card border border-dark-border rounded-2xl p-6 hover:border-neon-cyan/30 transition-all shadow-lg group">
            <div className="flex items-center mb-6">
              <div className={`p-3 rounded-xl bg-dark-bg border border-dark-border group-hover:border-neon-cyan/20 transition-colors ${section.color}`}>
                <section.icon className="w-6 h-6" />
              </div>
              <h2 className="ml-4 text-lg font-bold text-dark-text tracking-wide uppercase">
                {section.role}
              </h2>
            </div>

            <ul className="space-y-4">
              {section.steps.map((step, sIdx) => (
                <li key={sIdx} className="flex items-start">
                  <div className="mt-1 mr-3">
                    <CheckCircle2 className="w-4 h-4 text-neon-cyan/60" />
                  </div>
                  <span className="text-sm text-dark-muted leading-relaxed">
                    {step}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="bg-neon-cyan/5 border border-neon-cyan/20 rounded-2xl p-6 flex items-start">
        <AlertCircle className="w-6 h-6 text-neon-cyan mr-4 shrink-0 mt-0.5" />
        <div>
          <h3 className="text-neon-cyan font-bold mb-1">Lưu ý quan trọng:</h3>
          <p className="text-sm text-dark-muted">
            Hệ thống hoạt động theo luồng khép kín. Trạng thái của máy sẽ tự động thay đổi dựa trên hành động của từng bộ phận. 
            Vui lòng cập nhật đúng trạng thái để các bộ phận tiếp theo có thể nhận máy và xử lý kịp thời.
          </p>
        </div>
      </div>
    </div>
  );
}
