import React from "react";

export default function TerrainMaps() {
  return (
    <div className="flex-1 relative w-full h-[calc(100vh-64px)] md:h-full bg-surface-dim overflow-hidden rounded-xl border border-outline-variant">
      {/* Map Background Layer */}
      <div 
        className="absolute inset-0 bg-cover bg-center" 
        style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBESXJY4fL-Q1FrGq5Mvzp02FtPPSVhz_JBuwWrufaPmu37jUYT-HLIi_sDwcs6ttWiGlI-mV4ebcHMa-ymmE5xVhG0fKG9ZeP7YPyzDFnjh_t6nM4QmiJFqCHVkeqJ1PZFk5GZybme0QXvhoNsfAdhRtu0iyV2Av4TmSf-Gxaho-q5GoQETwwaNBSu1lAv-a4A0MKvhaUQSwiP_1pyayrXJNxpa5fQZjkYVE4pKh_DTeTLRaKUcWxbmg')" }}
      ></div>
      
      {/* Technical Grid Overlay */}
      <div className="absolute inset-0 opacity-30 pointer-events-none mix-blend-overlay" style={{ backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgMGg0MHY0MEgwem0zOSAzaC0zdjM0aDNWM3ptLTQgMHYzNGgtM3YtMzRoM3ptLTQgMHYzNGgtM3YtMzRoM3ptLTQgMHYzNGgtM3YtMzRoM3ptLTQgMHYzNGgtM3YtMzRoM3ptLTQgMHYzNGgtM3YtMzRoM3ptLTQgMHYzNGgtM3YtMzRoM3ptLTQgMHYzNGgtM3YtMzRoM3ptLTQgMHYzNGgtM3YtMzRoM3oiIGZpbGw9IiMzYzRhNDQiIGZpbGwtb3BhY2l0eT0iMC4xIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiLz48L3N2Zz4=')" }}></div>
      
      {/* Fake Data Overlays (Plot Boundaries & NDVI) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-80" preserveAspectRatio="none" viewBox="0 0 1000 800">
        {/* Plot Boundaries */}
        <path d="M 100 100 L 400 120 L 450 300 L 150 280 Z" fill="none" stroke="#4bddb7" strokeDasharray="8 4" strokeWidth="2"></path>
        <path d="M 450 130 L 800 90 L 850 400 L 500 350 Z" fill="none" stroke="#4bddb7" strokeDasharray="8 4" strokeWidth="2"></path>
        <path d="M 120 320 L 480 370 L 400 700 L 80 650 Z" fill="none" stroke="#3c4a44" strokeDasharray="8 4" strokeWidth="2"></path>
        
        {/* NDVI Heatmap effect in one plot */}
        <polygon fill="url(#ndviGradient)" opacity="0.6" points="450,130 800,90 850,400 500,350" style={{ mixBlendMode: "overlay" }}></polygon>
        
        <defs>
          <linearGradient id="ndviGradient" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#00b894"></stop>
            <stop offset="50%" stopColor="#f0bf63"></stop>
            <stop offset="100%" stopColor="#ffb4ab"></stop>
          </linearGradient>
        </defs>
      </svg>

      {/* Floating Control Panels (Right Side) */}
      <div className="absolute top-md right-md flex flex-col gap-sm z-20 w-[320px]">
        
        {/* Data Layers Card */}
        <div className="bg-surface-container-low/95 backdrop-blur-xl border border-outline-variant rounded-xl p-md shadow-2xl">
          <div className="flex items-center gap-2 mb-4 border-b border-outline-variant pb-3">
            <span className="material-symbols-outlined text-primary">layers</span>
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Các Lớp Dữ liệu</h3>
          </div>
          <div className="flex flex-col gap-5">
            {/* Toggle 1: Plot Boundaries */}
            <div className="flex items-center justify-between group cursor-pointer">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors text-sm">dashboard</span>
                <span className="font-body-md text-body-md text-on-surface">Ranh giới Lô đất</span>
              </div>
              <button className="w-10 h-5 bg-primary-container rounded-full relative transition-colors shadow-[0_0_8px_rgba(0,184,148,0.3)]">
                <span className="absolute right-0.5 top-0.5 w-4 h-4 bg-on-primary rounded-full"></span>
              </button>
            </div>
            
            {/* Toggle 2: NDVI */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between group cursor-pointer">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors text-sm">compost</span>
                  <span className="font-body-md text-body-md text-on-surface">NDVI (Sức khỏe Cây trồng)</span>
                </div>
                <button className="w-10 h-5 bg-primary-container rounded-full relative transition-colors shadow-[0_0_8px_rgba(0,184,148,0.3)]">
                  <span className="absolute right-0.5 top-0.5 w-4 h-4 bg-on-primary rounded-full"></span>
                </button>
              </div>
              {/* Opacity Slider */}
              <div className="pl-8 flex items-center gap-3">
                <span className="material-symbols-outlined text-on-surface-variant text-xs">opacity</span>
                <div className="flex-1 h-1 bg-surface-container-highest rounded-full relative cursor-pointer">
                  <div className="absolute left-0 top-0 h-full w-[65%] bg-primary rounded-full"></div>
                  <div className="absolute left-[65%] top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 bg-primary border-2 border-surface-container-low rounded-full shadow-sm hover:scale-125 transition-transform"></div>
                </div>
                <span className="font-data-mono text-[10px] text-on-surface-variant">65%</span>
              </div>
            </div>

            {/* Toggle 3: Elevation */}
            <div className="flex items-center justify-between group cursor-pointer">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors text-sm">terrain</span>
                <span className="font-body-md text-body-md text-on-surface-variant">Bản đồ Độ cao</span>
              </div>
              <button className="w-10 h-5 bg-surface-container-highest border border-outline-variant rounded-full relative transition-colors">
                <span className="absolute left-0.5 top-0.5 w-4 h-4 bg-outline-variant rounded-full"></span>
              </button>
            </div>
          </div>
        </div>

        {/* Measurement Tools Card */}
        <div className="bg-surface-container-low/95 backdrop-blur-xl border border-outline-variant rounded-xl p-md shadow-2xl mt-2">
          <div className="flex items-center gap-2 mb-4 border-b border-outline-variant pb-3">
            <span className="material-symbols-outlined text-primary">architecture</span>
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Đo lường</h3>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button className="flex flex-col items-center justify-center p-3 rounded-lg bg-surface-container-high border border-outline-variant hover:border-primary hover:text-primary text-on-surface-variant transition-all group">
              <span className="material-symbols-outlined mb-1 text-[20px] group-hover:scale-110 transition-transform">straighten</span>
              <span className="font-label-caps text-[10px] uppercase">Khoảng cách</span>
            </button>
            <button className="flex flex-col items-center justify-center p-3 rounded-lg bg-primary/10 border border-primary text-primary transition-all shadow-[0_0_12px_rgba(0,184,148,0.4)]">
              <span className="material-symbols-outlined mb-1 text-[20px]">area_chart</span>
              <span className="font-label-caps text-[10px] uppercase">Diện tích</span>
            </button>
            <button className="flex flex-col items-center justify-center p-3 rounded-lg bg-surface-container-high border border-outline-variant hover:border-primary hover:text-primary text-on-surface-variant transition-all group">
              <span className="material-symbols-outlined mb-1 text-[20px] group-hover:scale-110 transition-transform">location_on</span>
              <span className="font-label-caps text-[10px] uppercase">Đánh dấu</span>
            </button>
          </div>
          
          {/* Active Measurement Readout */}
          <div className="mt-4 p-3 bg-surface-container-lowest rounded-lg border border-outline-variant flex flex-col gap-1">
            <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider">Khu vực Alpha được chọn</span>
            <div className="flex items-baseline gap-2">
              <span className="font-data-mono text-xl font-bold text-primary">142.5</span>
              <span className="font-label-caps text-label-caps text-on-surface-variant">Hecta</span>
            </div>
          </div>
        </div>
      </div>

      {/* Map View Controls (Bottom Right) */}
      <div className="absolute bottom-md right-md flex flex-col gap-2 z-20">
        <div className="bg-surface-container-low/90 backdrop-blur-md border border-outline-variant rounded-lg flex flex-col overflow-hidden shadow-lg">
          <button className="w-10 h-10 flex items-center justify-center text-on-surface hover:bg-surface-variant hover:text-primary transition-colors border-b border-outline-variant">
            <span className="material-symbols-outlined">add</span>
          </button>
          <button className="w-10 h-10 flex items-center justify-center text-on-surface hover:bg-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined">remove</span>
          </button>
        </div>
        <button className="w-10 h-10 bg-surface-container-low/90 backdrop-blur-md border border-outline-variant rounded-lg flex items-center justify-center text-on-surface hover:bg-surface-variant hover:text-primary transition-colors shadow-lg mt-1">
          <span className="material-symbols-outlined">my_location</span>
        </button>
        <button className="w-10 h-10 bg-surface-container-low/90 backdrop-blur-md border border-outline-variant rounded-lg flex items-center justify-center text-on-surface hover:bg-surface-variant hover:text-primary transition-colors shadow-lg mt-1">
          <span className="material-symbols-outlined">layers_clear</span>
        </button>
      </div>
    </div>
  );
}
