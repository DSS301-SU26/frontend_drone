import React from "react";

export default function DroneFleet() {
  return (
    <div className="flex flex-col gap-lg h-full">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-sm">
        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface">Quản lý Hạm đội Drone</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">Trạng thái và thông tin đo từ xa theo thời gian thực của các UAV nông nghiệp.</p>
        </div>
        <div className="flex gap-sm">
          <button className="px-md py-sm bg-surface-container-high border border-outline-variant text-on-surface rounded font-label-caps text-label-caps uppercase hover:bg-surface-variant transition-colors flex items-center gap-xs">
            <span className="material-symbols-outlined text-[16px]">filter_list</span> Lọc
          </button>
          <button className="px-md py-sm bg-primary text-on-primary rounded font-label-caps text-label-caps uppercase font-bold hover:bg-primary-fixed transition-colors flex items-center gap-xs shadow-[0_0_12px_rgba(0,184,148,0.3)]">
            <span className="material-symbols-outlined text-[16px]">add</span> Thêm Drone
          </button>
        </div>
      </header>

      {/* Fleet Overview Cards (Bento style top row) */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-gutter">
        {/* Stats Card 1 */}
        <div className="bg-surface-container-low border border-outline-variant rounded-lg p-md flex flex-col justify-between">
          <div className="flex justify-between items-start mb-sm">
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">Tổng Hạm đội</span>
            <span className="material-symbols-outlined text-on-surface-variant text-[20px]">flight_takeoff</span>
          </div>
          <div className="flex items-baseline gap-xs">
            <span className="font-display-lg text-display-lg text-on-surface">12</span>
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">Thiết bị</span>
          </div>
        </div>

        {/* Stats Card 2 */}
        <div className="bg-surface-container-low border border-outline-variant rounded-lg p-md flex flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/5"></div>
          <div className="relative z-10 flex justify-between items-start mb-sm">
            <span className="font-label-caps text-label-caps text-primary uppercase">Nhiệm vụ Đang chạy</span>
            <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>radar</span>
          </div>
          <div className="relative z-10 flex items-baseline gap-xs">
            <span className="font-display-lg text-display-lg text-primary drop-shadow-[0_0_8px_rgba(0,184,148,0.5)]">4</span>
            <span className="font-label-caps text-label-caps text-primary uppercase">Đang bay</span>
          </div>
        </div>

        {/* Stats Card 3 */}
        <div className="bg-surface-container-low border border-outline-variant rounded-lg p-md flex flex-col justify-between">
          <div className="flex justify-between items-start mb-sm">
            <span className="font-label-caps text-label-caps text-tertiary uppercase">Đến hạn Bảo trì</span>
            <span className="material-symbols-outlined text-tertiary text-[20px]">build</span>
          </div>
          <div className="flex items-baseline gap-xs">
            <span className="font-display-lg text-display-lg text-tertiary">2</span>
            <span className="font-label-caps text-label-caps text-tertiary uppercase">Cảnh báo</span>
          </div>
        </div>

        {/* Stats Card 4 */}
        <div className="bg-surface-container-low border border-outline-variant rounded-lg p-md flex flex-col justify-between">
          <div className="flex justify-between items-start mb-sm">
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">Hiệu suất Hạm đội</span>
            <span className="material-symbols-outlined text-on-surface-variant text-[20px]">speed</span>
          </div>
          <div className="flex items-baseline gap-xs">
            <span className="font-display-lg text-display-lg text-on-surface">94</span>
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">%</span>
          </div>
          <div className="w-full bg-surface-container-highest h-1 mt-sm rounded-full overflow-hidden">
            <div className="bg-primary h-full rounded-full" style={{ width: "94%" }}></div>
          </div>
        </div>
      </section>

      {/* Detailed Drone List (Bento Grid Main) */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-gutter">
        
        {/* Drone Card 1: DJI Agras T30 (Active) */}
        <div className="bg-surface-container-low border border-outline-variant rounded-lg overflow-hidden flex flex-col">
          {/* Image Header */}
          <div className="h-48 w-full relative border-b border-outline-variant">
            <div 
              className="w-full h-full bg-cover bg-center" 
              style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDKiSItZRSetivdLPRqdaN7l8Mm67iGr3T8QsFUCrf2nNOFizgGlIygNKGtfkW6ykyzl-37o1IwbudNkjaBxN_-as_ksgX3AV6c1WoiHFCXpf7O5S_0jNOxF-wafAb_geszLK2L3k6XNyEU5eqOc_X4nhr7s8RSmrUtNBRvSVh9J80Cyai1bKsCd6GeH8ZQsqxF1SWrkoZVaTFUuqgRV9yej-eDygECWIgazemEN4mIXAzxuoBPoVNoXw')" }}
            ></div>
            <div className="absolute top-sm right-sm bg-surface-container-lowest/80 backdrop-blur px-sm py-xs rounded flex items-center gap-xs border border-outline-variant">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              <span className="font-label-caps text-label-caps text-primary uppercase font-bold">Hoạt động</span>
            </div>
          </div>
          {/* Content */}
          <div className="p-md flex-1 flex flex-col gap-sm">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">AG-Alpha-T30</h3>
                <p className="font-label-caps text-label-caps text-on-surface-variant uppercase mt-1">DJI Agras T30</p>
              </div>
              <span className="font-data-mono text-data-mono text-primary bg-primary/10 px-xs py-[2px] rounded border border-primary/30">ID: T30-014</span>
            </div>
            {/* Telemetry */}
            <div className="grid grid-cols-2 gap-sm mt-xs">
              <div className="bg-surface-container-highest p-sm rounded border border-outline-variant flex flex-col">
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-1">Mức Pin</span>
                <div className="flex items-center gap-xs">
                  <span className="material-symbols-outlined text-primary text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>battery_4_bar</span>
                  <span className="font-data-mono text-data-mono text-on-surface">78%</span>
                </div>
              </div>
              <div className="bg-surface-container-highest p-sm rounded border border-outline-variant flex flex-col">
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-1">Tải trọng</span>
                <div className="flex items-center gap-xs">
                  <span className="material-symbols-outlined text-on-surface text-[16px]">water_drop</span>
                  <span className="font-data-mono text-data-mono text-on-surface">12 L</span>
                </div>
              </div>
            </div>
            {/* Status Sliders */}
            <div className="mt-xs flex flex-col gap-xs">
              <div className="flex justify-between items-end mb-1">
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">Tiến độ Nhiệm vụ</span>
                <span className="font-data-mono text-[10px] text-primary">65%</span>
              </div>
              <div className="w-full bg-surface-container-highest h-[2px] rounded-full overflow-hidden">
                <div className="bg-primary h-full" style={{ width: "65%" }}></div>
              </div>
            </div>
            <div className="mt-auto pt-sm flex gap-sm border-t border-outline-variant">
              <button className="flex-1 py-xs bg-surface-container-high border border-outline-variant text-on-surface rounded font-label-caps text-label-caps uppercase hover:bg-surface-variant transition-colors">Chi tiết</button>
              <button className="flex-1 py-xs bg-primary/10 border border-primary text-primary rounded font-label-caps text-label-caps uppercase hover:bg-primary/20 transition-colors font-bold shadow-[0_0_8px_rgba(0,184,148,0.2)]">Xem trực tiếp</button>
            </div>
          </div>
        </div>

        {/* Drone Card 2: XAG P100 Pro (Charging) */}
        <div className="bg-surface-container-low border border-outline-variant rounded-lg overflow-hidden flex flex-col">
          {/* Image Header */}
          <div className="h-48 w-full relative border-b border-outline-variant">
            <div 
              className="w-full h-full bg-cover bg-center grayscale opacity-80" 
              style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAZUf8n6ioLPmZEy1pewUrraTvgxogC5huBOTJUXdAVNmhnhBYvz197s9jwkNIbOZgS3RRNhD5wxLHbEvfbe_ESWwSh_aBq3QKc9pqQSNlu-54f21MfASjmKjAUZ9jaKXIoVl3zNbfmNn7RZ_HlFPo7YT-xSrapTxQzP31JkjOxDAOptHAMqfsxXRaLkcxCc8A0XleHCTDQwd_O79wcNnO5lj2f6Ye-PCHTkpncvjEVjYee_o4D_v9mEA')" }}
            ></div>
            <div className="absolute top-sm right-sm bg-surface-container-lowest/80 backdrop-blur px-sm py-xs rounded flex items-center gap-xs border border-outline-variant">
              <span className="material-symbols-outlined text-tertiary text-[14px]">bolt</span>
              <span className="font-label-caps text-label-caps text-tertiary uppercase font-bold">Đang sạc</span>
            </div>
          </div>
          {/* Content */}
          <div className="p-md flex-1 flex flex-col gap-sm">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">AG-Bravo-P100</h3>
                <p className="font-label-caps text-label-caps text-on-surface-variant uppercase mt-1">XAG P100 Pro</p>
              </div>
              <span className="font-data-mono text-data-mono text-on-surface-variant bg-surface-container-highest px-xs py-[2px] rounded border border-outline-variant">ID: P100-08</span>
            </div>
            {/* Telemetry */}
            <div className="grid grid-cols-2 gap-sm mt-xs">
              <div className="bg-surface-container-highest p-sm rounded border border-outline-variant flex flex-col">
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-1">Mức Pin</span>
                <div className="flex items-center gap-xs">
                  <span className="material-symbols-outlined text-tertiary text-[16px]">battery_charging_full</span>
                  <span className="font-data-mono text-data-mono text-on-surface">42%</span>
                </div>
              </div>
              <div className="bg-surface-container-highest p-sm rounded border border-outline-variant flex flex-col">
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-1">Tổng giờ bay</span>
                <div className="flex items-center gap-xs">
                  <span className="material-symbols-outlined text-on-surface text-[16px]">schedule</span>
                  <span className="font-data-mono text-data-mono text-on-surface">142h</span>
                </div>
              </div>
            </div>
            {/* Status Text */}
            <div className="mt-xs bg-surface-container-highest p-sm rounded border border-outline-variant">
              <span className="font-label-caps text-label-caps text-on-surface-variant uppercase block mb-1">Vị trí</span>
              <div className="flex items-center gap-xs text-on-surface font-data-mono text-[12px]">
                <span className="material-symbols-outlined text-[14px]">home_pin</span>
                Trạm Cơ sở Alpha - Bãi 2
              </div>
            </div>
            <div className="mt-auto pt-sm flex gap-sm border-t border-outline-variant">
              <button className="w-full py-xs bg-surface-container-high border border-outline-variant text-on-surface rounded font-label-caps text-label-caps uppercase hover:bg-surface-variant transition-colors">Nhật ký Bảo trì</button>
            </div>
          </div>
        </div>

        {/* Drone Card 3: DJI Agras T40 (Maintenance Required) */}
        <div className="bg-surface-container-low border border-error-container rounded-lg overflow-hidden flex flex-col">
          {/* Image Header */}
          <div className="h-48 w-full relative border-b border-error-container">
            <div 
              className="w-full h-full bg-cover bg-center grayscale opacity-60 mix-blend-luminosity" 
              style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuC1OUHB1ijDUGHpZntllfkJ3A-_JHa18hnycIAJdGFSbplulnOaU7aimH57uvftPL-rATp_YAoHQyla4n9pz1-Sq8Mtdq_ip8s-tiIjOx-NY0w3x6DVgoZ-a_I9MUbHNDS-bG9zvK_66H1hupvocI5ZFf8BX6BR1r89yrCIOWFCtmo4DlXT56bECfLHNiW7NAw1oXiLJubK0lxJjCjBMLIc63JGTLRJ6bvGHDQubsUoZi5Ge91o3awtxQ')" }}
            ></div>
            <div className="absolute top-sm right-sm bg-error-container/80 backdrop-blur px-sm py-xs rounded flex items-center gap-xs border border-error">
              <span className="material-symbols-outlined text-on-error-container text-[14px]">warning</span>
              <span className="font-label-caps text-label-caps text-on-error-container uppercase font-bold">Cần Bảo trì</span>
            </div>
          </div>
          {/* Content */}
          <div className="p-md flex-1 flex flex-col gap-sm">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">AG-Charlie-T40</h3>
                <p className="font-label-caps text-label-caps text-on-surface-variant uppercase mt-1">DJI Agras T40</p>
              </div>
              <span className="font-data-mono text-data-mono text-error bg-error-container/20 px-xs py-[2px] rounded border border-error/50">ID: T40-022</span>
            </div>
            {/* Error Log */}
            <div className="mt-xs bg-[#241314] p-sm rounded border border-error/30 flex flex-col">
              <span className="font-label-caps text-label-caps text-error uppercase mb-1 flex items-center gap-xs">
                <span className="material-symbols-outlined text-[14px]">build_circle</span>
                Rung động bất thường Rotor 3
              </span>
              <p className="font-body-md text-[12px] text-on-surface-variant mt-1">Cảm biến phát hiện rung động quá mức ở cụm Rotor 3. Yêu cầu kiểm tra ngay lập tức trước chuyến bay tiếp theo.</p>
            </div>
            <div className="grid grid-cols-2 gap-sm mt-xs">
              <div className="bg-surface-container-highest p-sm rounded border border-outline-variant flex flex-col">
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-1">Giờ bay</span>
                <div className="flex items-center gap-xs">
                  <span className="font-data-mono text-data-mono text-on-surface">285h</span>
                  <span className="text-[10px] text-error">(Quá hạn)</span>
                </div>
              </div>
              <div className="bg-surface-container-highest p-sm rounded border border-outline-variant flex flex-col">
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-1">Trạng thái</span>
                <div className="flex items-center gap-xs">
                  <span className="font-data-mono text-data-mono text-error">Nằm đất</span>
                </div>
              </div>
            </div>
            <div className="mt-auto pt-sm flex gap-sm border-t border-outline-variant">
              <button className="w-full py-xs bg-surface-container-high border border-error/50 text-error rounded font-label-caps text-label-caps uppercase hover:bg-error-container/20 transition-colors">Lên lịch Dịch vụ</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
