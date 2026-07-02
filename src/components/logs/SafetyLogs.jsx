import React from "react";

export default function SafetyLogs() {
  return (
    <div className="flex flex-col gap-lg h-full">
      {/* Header */}
      <header className="flex justify-between items-end mb-sm">
        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface">Nhật ký Pin & An toàn</h2>
          <div className="flex items-center gap-xs text-on-surface-variant font-label-caps text-label-caps mt-1">
            <span className="material-symbols-outlined text-[16px]">battery_charging_full</span>
            <span>Đồng bộ Hệ thống: OK</span>
          </div>
        </div>
        <div className="flex items-center gap-sm">
          <button className="hidden lg:flex px-sm py-xs border border-outline-variant rounded font-label-caps text-label-caps text-on-surface hover:bg-surface-container-highest transition-all duration-200">
            Khu vườn Alpha
          </button>
          <button className="hidden lg:flex px-sm py-xs border border-primary text-primary rounded font-label-caps text-label-caps hover:bg-primary/10 transition-all duration-200">
            DJI Agras T30
          </button>
        </div>
      </header>

      {/* Quick Stats Row */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter mb-md">
        <div className="bg-surface-container-low/70 backdrop-blur-md border border-outline-variant rounded-lg p-md flex flex-col gap-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-sm opacity-20 group-hover:opacity-100 transition-opacity">
            <span className="material-symbols-outlined text-primary text-[48px]">battery_saver</span>
          </div>
          <span className="font-label-caps text-label-caps text-on-surface-variant">Tổng số Pin</span>
          <div className="flex items-end gap-sm">
            <span className="font-display-lg text-display-lg text-on-surface">124</span>
            <span className="font-label-caps text-label-caps text-primary mb-2 flex items-center">
              <span className="material-symbols-outlined text-[14px]">arrow_upward</span> 12
            </span>
          </div>
        </div>

        <div className="bg-surface-container-low/70 backdrop-blur-md border border-outline-variant rounded-lg p-md flex flex-col gap-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-sm opacity-20 group-hover:opacity-100 transition-opacity">
            <span className="material-symbols-outlined text-error text-[48px]">battery_alert</span>
          </div>
          <span className="font-label-caps text-label-caps text-on-surface-variant">Cần Thay thế Khẩn cấp</span>
          <div className="flex items-end gap-sm">
            <span className="font-display-lg text-display-lg text-error">3</span>
            <span className="font-label-caps text-label-caps text-on-surface-variant mb-2">SOH &lt; 70%</span>
          </div>
        </div>

        <div className="bg-surface-container-low/70 backdrop-blur-md border border-outline-variant rounded-lg p-md flex flex-col gap-sm relative overflow-hidden">
          <span className="font-label-caps text-label-caps text-on-surface-variant">Nhiệt độ TB Hạm đội</span>
          <div className="flex items-end gap-sm">
            <span className="font-display-lg text-display-lg text-tertiary">42°C</span>
            <span className="font-label-caps text-label-caps text-on-surface-variant mb-2">Định mức &lt; 45°C</span>
          </div>
          {/* Mini progress bar */}
          <div className="w-full h-1 bg-surface-container-highest mt-auto rounded-full overflow-hidden">
            <div className="h-full bg-tertiary w-[80%]"></div>
          </div>
        </div>

        <div className="bg-surface-container-low/70 backdrop-blur-md border border-outline-variant rounded-lg p-md flex flex-col gap-sm relative overflow-hidden">
          <span className="font-label-caps text-label-caps text-on-surface-variant">Chu kỳ Sạc đang hoạt động</span>
          <div className="flex items-end gap-sm">
            <span className="font-display-lg text-display-lg text-secondary">18</span>
            <span className="font-label-caps text-label-caps text-on-surface-variant mb-2">Trạm</span>
          </div>
          {/* Mini progress bar */}
          <div className="w-full h-1 bg-surface-container-highest mt-auto rounded-full overflow-hidden">
            <div className="h-full bg-secondary w-[45%]"></div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="grid grid-cols-12 gap-gutter flex-1">
        
        {/* Main Log Table Section */}
        <div className="col-span-12 lg:col-span-8 bg-surface-container-low/70 backdrop-blur-md border border-outline-variant rounded-lg flex flex-col">
          <div className="p-md border-b border-outline-variant flex justify-between items-center">
            <div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Nhật ký Đo lường Pin</h3>
              <p className="font-body-md text-body-md text-on-surface-variant mt-1">Theo dõi SOH và chu kỳ thời gian thực trên toàn hạm đội.</p>
            </div>
            <div className="flex gap-xs">
              <button className="p-xs border border-outline-variant rounded hover:bg-surface-variant text-on-surface-variant transition-colors">
                <span className="material-symbols-outlined text-[20px]">filter_list</span>
              </button>
              <button className="p-xs border border-outline-variant rounded hover:bg-surface-variant text-on-surface-variant transition-colors">
                <span className="material-symbols-outlined text-[20px]">download</span>
              </button>
            </div>
          </div>
          <div className="overflow-x-auto custom-scrollbar flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-low/50">
                  <th className="py-sm px-md font-label-caps text-label-caps text-on-surface-variant">MÃ PIN</th>
                  <th className="py-sm px-md font-label-caps text-label-caps text-on-surface-variant">Drone Được Giao</th>
                  <th className="py-sm px-md font-label-caps text-label-caps text-on-surface-variant">SOH</th>
                  <th className="py-sm px-md font-label-caps text-label-caps text-on-surface-variant">Chu kỳ</th>
                  <th className="py-sm px-md font-label-caps text-label-caps text-on-surface-variant">Nhiệt độ</th>
                  <th className="py-sm px-md font-label-caps text-label-caps text-on-surface-variant text-right">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="font-data-mono text-data-mono text-on-surface divide-y divide-outline-variant/50">
                {/* Critical Row */}
                <tr className="hover:bg-error-container/10 transition-colors">
                  <td className="py-sm px-md">B-T30-042</td>
                  <td className="py-sm px-md text-on-surface-variant">Agras-7</td>
                  <td className="py-sm px-md text-error font-bold">68%</td>
                  <td className="py-sm px-md">412</td>
                  <td className="py-sm px-md text-tertiary">47°C</td>
                  <td className="py-sm px-md text-right">
                    <span className="inline-flex items-center gap-xs px-2 py-1 rounded bg-error-container text-on-error-container font-label-caps text-[10px]">
                      <span className="material-symbols-outlined text-[12px]">warning</span> Thay thế
                    </span>
                  </td>
                </tr>
                {/* Warning Row */}
                <tr className="hover:bg-surface-variant transition-colors">
                  <td className="py-sm px-md">B-T30-108</td>
                  <td className="py-sm px-md text-on-surface-variant">Agras-2</td>
                  <td className="py-sm px-md text-tertiary">78%</td>
                  <td className="py-sm px-md">350</td>
                  <td className="py-sm px-md">41°C</td>
                  <td className="py-sm px-md text-right">
                    <span className="inline-flex items-center gap-xs px-2 py-1 rounded bg-tertiary-container text-on-tertiary-container font-label-caps text-[10px]">
                      Theo dõi
                    </span>
                  </td>
                </tr>
                {/* Normal Rows */}
                <tr className="hover:bg-surface-variant transition-colors">
                  <td className="py-sm px-md">B-T30-205</td>
                  <td className="py-sm px-md text-on-surface-variant">Agras-12</td>
                  <td className="py-sm px-md text-primary">94%</td>
                  <td className="py-sm px-md">85</td>
                  <td className="py-sm px-md">38°C</td>
                  <td className="py-sm px-md text-right">
                    <span className="inline-flex items-center gap-xs px-2 py-1 rounded border border-outline-variant text-on-surface-variant font-label-caps text-[10px]">
                      Tốt
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-surface-variant transition-colors">
                  <td className="py-sm px-md">B-T30-089</td>
                  <td className="py-sm px-md text-on-surface-variant">Agras-4</td>
                  <td className="py-sm px-md text-primary">88%</td>
                  <td className="py-sm px-md">190</td>
                  <td className="py-sm px-md text-tertiary">44°C</td>
                  <td className="py-sm px-md text-right">
                    <span className="inline-flex items-center gap-xs px-2 py-1 rounded border border-outline-variant text-on-surface-variant font-label-caps text-[10px]">
                      Tốt
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-surface-variant transition-colors opacity-60">
                  <td className="py-sm px-md">B-T30-112</td>
                  <td className="py-sm px-md text-on-surface-variant">--</td>
                  <td className="py-sm px-md text-primary">98%</td>
                  <td className="py-sm px-md">12</td>
                  <td className="py-sm px-md text-secondary">22°C</td>
                  <td className="py-sm px-md text-right">
                    <span className="inline-flex items-center gap-xs px-2 py-1 rounded bg-surface-container-high text-secondary font-label-caps text-[10px]">
                      Đang sạc
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="p-sm border-t border-outline-variant flex justify-center">
            <button className="font-label-caps text-label-caps text-primary hover:text-primary-fixed transition-colors">Tải thêm Dữ liệu</button>
          </div>
        </div>

        {/* Degradation Chart & Details Panel */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-gutter">
          {/* Degradation Chart Placeholder */}
          <div className="bg-surface-container-low/70 backdrop-blur-md border border-outline-variant rounded-lg p-md flex flex-col">
            <div className="flex justify-between items-start mb-md">
              <div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">Suy giảm Dung lượng</h3>
                <p className="font-label-caps text-label-caps text-on-surface-variant mt-1">TB Hạm đội vs Mô hình Dự kiến</p>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant">timeline</span>
            </div>
            
            {/* Simulated Chart Area */}
            <div className="relative w-full h-48 bg-surface-container-lowest border border-outline-variant rounded flex items-end p-2 gap-1 mb-sm">
              {/* Y-axis labels */}
              <div className="absolute left-2 top-2 bottom-2 flex flex-col justify-between font-data-mono text-[10px] text-on-surface-variant">
                <span>100%</span>
                <span>80%</span>
                <span>60%</span>
              </div>
              
              {/* Simulated Line/Area via CSS */}
              <div className="w-full h-full relative ml-8 border-l border-b border-outline-variant">
                {/* Expected Curve (Dashed) */}
                <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                  <path d="M0,10 L50,20 L100,35 L150,55 L200,80 L250,110" fill="none" stroke="#3c4a44" strokeDasharray="4 4" strokeWidth="2" vectorEffect="non-scaling-stroke"></path>
                </svg>
                {/* Actual Curve (Solid Primary) */}
                <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                  <path d="M0,12 L50,25 L100,45 L150,70 L200,105 L250,140" fill="none" filter="drop-shadow(0 0 4px rgba(75,221,183,0.4))" stroke="#4bddb7" strokeWidth="3" vectorEffect="non-scaling-stroke"></path>
                </svg>
              </div>
            </div>
            <div className="flex justify-between font-label-caps text-[10px] text-on-surface-variant px-10">
              <span>0 Chu kỳ</span>
              <span>200 C</span>
              <span>400 C</span>
            </div>
          </div>

          {/* Selected Battery Detail */}
          <div className="bg-surface-container-low/70 backdrop-blur-md border border-error-container p-md flex flex-col relative overflow-hidden flex-1">
            {/* Subtle red glow background for context */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-error-container/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
            
            <h3 className="font-headline-sm text-headline-sm text-on-surface mb-xs flex items-center gap-xs">
              <span className="material-symbols-outlined text-error">warning</span>
              Cảnh báo: B-T30-042
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant mb-md relative z-10">Thiết bị này đã suy giảm quá ngưỡng an toàn cho các nhiệm vụ tải trọng cao.</p>
            
            <div className="grid grid-cols-2 gap-sm mb-md relative z-10">
              <div className="bg-surface-container-low p-sm border border-outline-variant rounded">
                <span className="font-label-caps text-[10px] text-on-surface-variant block mb-1">Tình trạng Sức khỏe</span>
                <span className="font-data-mono text-headline-md text-error">68%</span>
              </div>
              <div className="bg-surface-container-low p-sm border border-outline-variant rounded">
                <span className="font-label-caps text-[10px] text-on-surface-variant block mb-1">Nội trở</span>
                <span className="font-data-mono text-headline-md text-tertiary">14mΩ</span>
              </div>
            </div>
            
            <div className="mt-auto flex gap-sm relative z-10">
              <button className="flex-1 bg-surface-variant border border-outline-variant text-on-surface font-label-caps text-label-caps py-sm rounded hover:bg-surface-container-highest transition-colors">
                Xem Lịch sử
              </button>
              <button className="flex-1 bg-error text-on-error font-label-caps text-label-caps py-sm rounded hover:bg-error/90 transition-colors shadow-[0_0_12px_rgba(255,180,171,0.3)]">
                Ngừng Hoạt động
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
