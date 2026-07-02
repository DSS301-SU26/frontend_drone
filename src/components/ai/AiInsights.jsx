import React from "react";

export default function AiInsights() {
  return (
    <div className="flex flex-col gap-lg h-full">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-sm gap-sm">
        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-xs">Dự báo & Phân tích AI</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">Phân tích dự đoán theo thời gian thực cho Khu vực 7G (Khu vườn Alpha).</p>
        </div>
        <div className="flex gap-sm w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
            <input 
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-xs pl-xl pr-sm font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" 
              placeholder="Tìm kiếm khu vực, mô hình..." 
              type="text"
            />
          </div>
          <button className="bg-surface-variant border border-outline-variant text-on-surface rounded-lg p-xs hover:bg-surface-container-highest transition-colors">
            <span className="material-symbols-outlined">filter_list</span>
          </button>
        </div>
      </header>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter auto-rows-[minmax(180px,auto)] flex-1">
        
        {/* Pest Forecast (Large Span) */}
        <section className="bg-surface-container-low/70 backdrop-blur-md border border-outline-variant rounded-lg p-md md:col-span-8 flex flex-col transition-all duration-300 hover:shadow-[0_0_15px_rgba(0,184,148,0.2)] hover:border-primary/50">
          <header className="flex justify-between items-center mb-md border-b border-outline-variant pb-xs">
            <div className="flex items-center gap-xs">
              <span className="material-symbols-outlined text-error">bug_report</span>
              <h3 className="font-label-caps text-label-caps text-on-surface uppercase tracking-wider">Dự báo Dịch hại (7 Ngày)</h3>
            </div>
            <span className="font-label-caps text-label-caps text-error-container bg-error/20 px-2 py-1 rounded">Nguy cơ cao: Rệp</span>
          </header>
          
          <div className="flex-1 relative w-full h-full min-h-[200px] flex items-end gap-2">
            {/* Faux Bar Chart */}
            <div className="flex-1 flex flex-col items-center justify-end h-full gap-2 relative group">
              <div className="w-full max-w-[40px] bg-surface-container-highest rounded-t-sm h-[20%] transition-all group-hover:bg-primary/50 relative overflow-hidden">
                <div className="absolute bottom-0 w-full bg-primary h-1"></div>
              </div>
              <span className="font-data-mono text-data-mono text-on-surface-variant text-xs">T2</span>
            </div>
            <div className="flex-1 flex flex-col items-center justify-end h-full gap-2 group">
              <div className="w-full max-w-[40px] bg-surface-container-highest rounded-t-sm h-[35%] transition-all group-hover:bg-primary/50 relative overflow-hidden">
                <div className="absolute bottom-0 w-full bg-primary h-1"></div>
              </div>
              <span className="font-data-mono text-data-mono text-on-surface-variant text-xs">T3</span>
            </div>
            <div className="flex-1 flex flex-col items-center justify-end h-full gap-2 group">
              <div className="w-full max-w-[40px] bg-surface-container-highest rounded-t-sm h-[45%] transition-all group-hover:bg-tertiary/50 relative overflow-hidden">
                <div className="absolute bottom-0 w-full bg-tertiary h-1"></div>
              </div>
              <span className="font-data-mono text-data-mono text-on-surface-variant text-xs">T4</span>
            </div>
            <div className="flex-1 flex flex-col items-center justify-end h-full gap-2 group">
              {/* High Risk Bar */}
              <div className="w-full max-w-[40px] bg-error/30 border border-error/50 rounded-t-sm h-[85%] transition-all group-hover:bg-error/50 relative overflow-hidden">
                <div className="absolute top-0 w-full bg-error h-1 shadow-[0_0_8px_rgba(255,180,171,0.8)]"></div>
              </div>
              <span className="font-data-mono text-data-mono text-error font-bold text-xs">T5</span>
            </div>
            <div className="flex-1 flex flex-col items-center justify-end h-full gap-2 group">
              <div className="w-full max-w-[40px] bg-error/20 rounded-t-sm h-[70%] transition-all group-hover:bg-error/40 relative overflow-hidden">
                <div className="absolute bottom-0 w-full bg-error h-1"></div>
              </div>
              <span className="font-data-mono text-data-mono text-on-surface-variant text-xs">T6</span>
            </div>
            <div className="flex-1 flex flex-col items-center justify-end h-full gap-2 group">
              <div className="w-full max-w-[40px] bg-surface-container-highest rounded-t-sm h-[40%] transition-all group-hover:bg-primary/50 relative overflow-hidden">
                <div className="absolute bottom-0 w-full bg-primary h-1"></div>
              </div>
              <span className="font-data-mono text-data-mono text-on-surface-variant text-xs">T7</span>
            </div>
            <div className="flex-1 flex flex-col items-center justify-end h-full gap-2 group">
              <div className="w-full max-w-[40px] bg-surface-container-highest rounded-t-sm h-[25%] transition-all group-hover:bg-primary/50 relative overflow-hidden">
                <div className="absolute bottom-0 w-full bg-primary h-1"></div>
              </div>
              <span className="font-data-mono text-data-mono text-on-surface-variant text-xs">CN</span>
            </div>
          </div>
        </section>

        {/* Yield Estimation (Small Span) */}
        <section className="bg-surface-container-low/70 backdrop-blur-md border border-outline-variant rounded-lg p-md md:col-span-4 flex flex-col justify-between transition-all duration-300 hover:shadow-[0_0_15px_rgba(0,184,148,0.2)] hover:border-primary/50">
          <header className="flex items-center gap-xs mb-sm">
            <span className="material-symbols-outlined text-primary">monitoring</span>
            <h3 className="font-label-caps text-label-caps text-on-surface uppercase tracking-wider">Ước tính Sản lượng vs Lịch sử</h3>
          </header>
          
          <div className="flex flex-col items-center justify-center flex-1">
            <div className="relative w-32 h-32 rounded-full border-4 border-surface-container-highest flex items-center justify-center mb-sm">
              {/* Faux Donut Progress */}
              <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent border-r-transparent transform rotate-45"></div>
              <div className="text-center">
                <span className="font-display-lg text-display-lg text-primary block leading-none">+12%</span>
              </div>
            </div>
            <div className="w-full space-y-2 mt-sm">
              <div className="flex justify-between items-center text-sm">
                <span className="font-body-md text-on-surface-variant">Dự kiến Hiện tại</span>
                <span className="font-data-mono text-on-surface">4.2 Tấn/Ha</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="font-body-md text-on-surface-variant">TB Lịch sử</span>
                <span className="font-data-mono text-on-surface">3.8 Tấn/Ha</span>
              </div>
            </div>
          </div>
        </section>

        {/* Optimal Spray Schedule (Wide Span) */}
        <section className="bg-surface-container-low/70 backdrop-blur-md border border-outline-variant rounded-lg p-md md:col-span-12 transition-all duration-300 hover:shadow-[0_0_15px_rgba(0,184,148,0.2)] hover:border-primary/50">
          <header className="flex justify-between items-center mb-md border-b border-outline-variant pb-xs">
            <div className="flex items-center gap-xs">
              <span className="material-symbols-outlined text-secondary">calendar_clock</span>
              <h3 className="font-label-caps text-label-caps text-on-surface uppercase tracking-wider">Lịch trình Phun tối ưu bởi AI</h3>
            </div>
            <button className="text-primary hover:text-primary-fixed transition-colors font-label-caps text-label-caps flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">sync</span> Cập nhật Mô hình
            </button>
          </header>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
            {/* Schedule Card 1 */}
            <div className="bg-surface-container-lowest border border-outline-variant p-sm rounded-lg relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-error"></div>
              <div className="pl-2">
                <div className="flex justify-between items-start mb-xs">
                  <div>
                    <span className="font-label-caps text-label-caps text-error block mb-1">Hành động Khẩn cấp</span>
                    <h4 className="font-headline-sm text-headline-sm text-on-surface">Phòng trừ Rệp</h4>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant">flight_takeoff</span>
                </div>
                <div className="space-y-1 mb-sm mt-xs">
                  <div className="flex items-center gap-2 font-data-mono text-data-mono text-on-surface-variant">
                    <span className="material-symbols-outlined text-[16px]">schedule</span> Ngày mai, 05:30 SA
                  </div>
                  <div className="flex items-center gap-2 font-data-mono text-data-mono text-on-surface-variant">
                    <span className="material-symbols-outlined text-[16px]">air</span> Gió: 2 m/s (Lý tưởng)
                  </div>
                </div>
                <button className="w-full bg-surface-variant hover:bg-surface-container-highest border border-outline-variant text-on-surface py-1 rounded transition-colors font-label-caps text-label-caps">Giao cho Drone 1</button>
              </div>
            </div>

            {/* Schedule Card 2 */}
            <div className="bg-surface-container-lowest border border-outline-variant p-sm rounded-lg relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
              <div className="pl-2">
                <div className="flex justify-between items-start mb-xs">
                  <div>
                    <span className="font-label-caps text-label-caps text-primary block mb-1">Định kỳ</span>
                    <h4 className="font-headline-sm text-headline-sm text-on-surface">Dinh dưỡng qua lá</h4>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant">opacity</span>
                </div>
                <div className="space-y-1 mb-sm mt-xs">
                  <div className="flex items-center gap-2 font-data-mono text-data-mono text-on-surface-variant">
                    <span className="material-symbols-outlined text-[16px]">schedule</span> Thứ Sáu, 18:00 CH
                  </div>
                  <div className="flex items-center gap-2 font-data-mono text-data-mono text-on-surface-variant">
                    <span className="material-symbols-outlined text-[16px]">thermostat</span> Nhiệt độ: 22°C (Tối ưu)
                  </div>
                </div>
                <button className="w-full bg-surface-variant hover:bg-surface-container-highest border border-outline-variant text-on-surface py-1 rounded transition-colors font-label-caps text-label-caps">Giao cho Drone 2</button>
              </div>
            </div>

            {/* Environment Mini-Widget */}
            <div className="bg-surface-container-lowest border border-outline-variant p-sm rounded-lg flex flex-col justify-center items-center text-center">
              <span className="material-symbols-outlined text-tertiary text-[48px] mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>partly_cloudy_day</span>
              <h4 className="font-headline-sm text-headline-sm text-on-surface">Dữ liệu Vi khí hậu</h4>
              <p className="font-body-md text-body-md text-on-surface-variant mt-1">Điều kiện thuận lợi cho việc phun trong 48h tới. Độ ẩm có xu hướng giảm.</p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
