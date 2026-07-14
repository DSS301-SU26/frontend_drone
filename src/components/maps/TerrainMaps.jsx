import React, { useState, useMemo } from "react";
import { useApp } from "../../context/AppContext";
import { editPlot } from "../../api/dashboard";

const getRiceSvg = (color) => {
  return `data:image/svg+xml;utf8,` + encodeURIComponent(`
    <svg width="60" height="100" viewBox="0 0 60 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M30,100 Q15,60 5,35 M30,100 Q45,60 55,35 M30,100 L30,20" stroke="${color}" stroke-width="4.5" fill="none" stroke-linecap="round"/>
      <circle cx="30" cy="20" r="3.5" fill="${color}"/>
      <circle cx="5" cy="35" r="3" fill="${color}"/>
      <circle cx="55" cy="35" r="3" fill="${color}"/>
      <path d="M30,85 Q10,65 2,75 M30,85 Q50,65 58,75" stroke="${color}" stroke-width="3" fill="none" stroke-linecap="round"/>
    </svg>
  `);
};

export default function TerrainMaps() {
  const { locationId, locations, droneState } = useApp();
  const activePlot = locations.find((l) => l.id === locationId) || locations[0];

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ area: "", current_crop_stage: "", current_pesticide: "" });
  const [isSaving, setIsSaving] = useState(false);

  if (!activePlot) return null;

  const isAirborne = droneState === "FLYING" || droneState === "SPRAYING" || droneState === "RETURNING";
  const cropStage = activePlot.current_crop_stage || activePlot.cropStage || "TILLERING";
  const pesticide = activePlot.current_pesticide || activePlot.pesticide;
  const area = activePlot.area_hectares || activePlot.area;

  const getCropInfo = (stage) => {
    switch (stage) {
      case "SEEDLING":
        return { label: "Gieo mạ", color: "#7bed9f", rowColor: "#218c74", height: 0.35 };
      case "TILLERING":
        return { label: "Đẻ nhánh", color: "#2ed573", rowColor: "#006266", height: 0.55 };
      case "BOOTING":
        return { label: "Đòng - Trổ", color: "#badc58", rowColor: "#6ab04c", height: 0.75 };
      case "GRAIN_FILLING":
        return { label: "Chín", color: "#f1c40f", rowColor: "#d35400", height: 0.95 };
      default:
        return { label: "Đang phát triển", color: "#2ed573", rowColor: "#006266", height: 0.5 };
    }
  };
  const cropInfo = getCropInfo(cropStage);

  const translateCropStage = (stage) => cropInfo.label;

  // Generate a random but stable set of plants
  const plantPositions = useMemo(() => {
    const plants = [];
    const rows = 6;
    const cols = 6;
    for(let r = 1; r <= rows; r++) {
      for(let c = 1; c <= cols; c++) {
        // Random slight offsets for natural look
        const left = (c / (cols+1)) * 100 + (Math.random() * 6 - 3);
        const top = (r / (rows+1)) * 100 + (Math.random() * 6 - 3);
        const baseRotation = Math.random() * 180;
        plants.push({ id: `${r}-${c}`, left, top, baseRotation });
      }
    }
    return plants;
  }, [locationId]); // recalculate if location changes

  const handleEditClick = () => {
    setEditForm({
      area: area || "",
      current_crop_stage: cropStage,
      current_pesticide: pesticide || "Tricyclazole"
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await editPlot(activePlot.id, {
        area_hectares: parseFloat(editForm.area) || 0,
        current_crop_stage: editForm.current_crop_stage,
        current_pesticide: editForm.current_pesticide
      });
      setIsEditing(false);
      window.location.reload();
    } catch (e) {
      alert("Lỗi khi lưu thông tin: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 relative w-full h-[calc(100vh-64px)] md:h-full overflow-hidden rounded-xl border border-outline-variant flex items-center justify-center" style={{ backgroundColor: "#1e2124" }}>
      
      {/* 3D Symbolic Map Container */}
      <div 
        className="relative w-[600px] h-[600px] transition-all duration-700 ease-in-out"
        style={{ 
          transform: "rotateX(60deg) rotateZ(-45deg) scale(1.1)",
          transformStyle: "preserve-3d"
        }}
      >
        {/* Farm Base Background (Dirt/Earth) */}
        <div className="absolute inset-4 rounded-xl shadow-[0_30px_60px_rgba(0,0,0,0.6)] border-4 border-[#3d2b1f]"
             style={{
               backgroundColor: "#4a3525",
               transform: "translateZ(-15px)",
               transformStyle: "preserve-3d"
             }}
        />

        {/* Crop Field Layer */}
        <div className={`absolute inset-8 rounded-lg overflow-visible transition-all duration-700 ease-in-out border-2 border-[#5c8a3b]`}
             style={{
               backgroundColor: "#3b5323", 
               // Crop rows pattern painted on ground
               backgroundImage: `
                   repeating-linear-gradient(
                     90deg,
                     transparent,
                     transparent 16px,
                     rgba(0,0,0,0.2) 16px,
                     rgba(0,0,0,0.2) 20px
                   ),
                   repeating-linear-gradient(
                     0deg,
                     ${cropInfo.rowColor},
                     ${cropInfo.rowColor} 12px,
                     transparent 12px,
                     transparent 20px
                   )
                 `,
               transformStyle: "preserve-3d"
             }}
        >
          {/* True 3D Rice Plants */}
          {plantPositions.map(plant => (
            <div 
              key={plant.id}
              className="absolute"
              style={{
                left: `${plant.left}%`,
                top: `${plant.top}%`,
                width: 0,
                height: 0,
                transformStyle: "preserve-3d"
              }}
            >
              <div 
                className="absolute transition-all duration-1000 ease-in-out"
                style={{
                  width: "50px",
                  height: `${100 * cropInfo.height}px`,
                  left: "-25px",
                  bottom: "0px",
                  backgroundImage: `url('${getRiceSvg(cropInfo.color)}')`,
                  backgroundSize: "100% 100%",
                  backgroundRepeat: "no-repeat",
                  transform: `rotateX(-90deg) rotateY(${plant.baseRotation}deg)`,
                  transformOrigin: "bottom center"
                }}
              />
              <div 
                className="absolute transition-all duration-1000 ease-in-out"
                style={{
                  width: "50px",
                  height: `${100 * cropInfo.height}px`,
                  left: "-25px",
                  bottom: "0px",
                  backgroundImage: `url('${getRiceSvg(cropInfo.color)}')`,
                  backgroundSize: "100% 100%",
                  backgroundRepeat: "no-repeat",
                  transform: `rotateX(-90deg) rotateY(${plant.baseRotation + 90}deg)`,
                  transformOrigin: "bottom center"
                }}
              />
            </div>
          ))}

          {/* Add a subtle shadow to the field edges */}
          <div className="absolute inset-0 shadow-[inset_0_0_50px_rgba(0,0,0,0.6)] pointer-events-none transform-style-flat"></div>
        </div>

        {/* Overlay Grid Layer */}
        <div className={`absolute inset-4 rounded-xl pointer-events-none transition-opacity duration-500`}
             style={{
               backgroundImage: "linear-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.08) 1px, transparent 1px)",
               backgroundSize: "40px 40px",
               transform: "translateZ(1px)"
             }}
        />

        {/* Floating Drone Object */}
        {isAirborne && (
          <div 
            className="absolute left-1/2 top-1/2 w-12 h-12 -ml-6 -mt-6 flex items-center justify-center transition-all duration-1000 ease-in-out"
            style={{
              transform: "translateZ(150px) rotateZ(45deg)", 
              transformStyle: "preserve-3d",
              animation: "hover-drone 3s ease-in-out infinite alternate"
            }}
          >
            {/* Drone shadow cast on the field */}
            <div className="absolute top-[150px] w-12 h-6 bg-black/50 rounded-full blur-md" style={{ transform: "rotateX(-60deg)" }}></div>
            
            {/* Drone Icon/Body */}
            <div className="relative bg-[#333] border border-primary text-primary p-2 rounded-full shadow-[0_0_15px_rgba(75,221,183,0.5)] flex items-center justify-center">
              <span className="material-symbols-outlined text-[28px] animate-spin-slow" style={{ animationDuration: '3s' }}>flight</span>
            </div>
            
            {/* Scanning beam */}
            {droneState === "SPRAYING" && (
              <div className="absolute top-full left-1/2 -ml-[40px] w-[80px] h-[200px] bg-gradient-to-b from-primary/30 to-transparent blur-[2px]" style={{ clipPath: "polygon(50% 0, 100% 100%, 0 100%)" }}></div>
            )}
          </div>
        )}
      </div>

      {/* Floating Control Panels (Right Side) */}
      <div className="absolute top-md right-md flex flex-col gap-sm z-50 w-[320px]">
        
        {/* Plot Info Card */}
        <div className="bg-surface-container-low/95 backdrop-blur-xl border border-outline-variant rounded-xl p-md shadow-2xl">
          <div className="flex items-center justify-between mb-4 border-b border-outline-variant pb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">info</span>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Thông tin Lô đất</h3>
            </div>
            <button 
              onClick={handleEditClick}
              className="text-primary hover:text-primary-hover transition-colors"
              title="Chỉnh sửa"
            >
              <span className="material-symbols-outlined text-[20px]">edit</span>
            </button>
          </div>
          
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <span className="font-label-md text-on-surface-variant">Khu vực:</span>
              <span className="font-body-md text-on-surface font-semibold text-right max-w-[180px] truncate" title={activePlot.name}>{activePlot.name}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="font-label-md text-on-surface-variant">Diện tích:</span>
              <div className="flex items-baseline gap-1">
                <span className="font-data-mono text-lg font-bold text-primary">{area}</span>
                <span className="font-label-caps text-[10px] text-on-surface-variant uppercase">Hecta</span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="font-label-md text-on-surface-variant">Giai đoạn:</span>
              <span className="font-body-md" style={{ color: cropInfo.color, fontWeight: "bold" }}>{cropInfo.label}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="font-label-md text-on-surface-variant">Hóa chất:</span>
              <span className="font-data-mono text-sm text-[#f0bf63] text-right">{pesticide || "Không rõ"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-container rounded-xl w-[400px] shadow-2xl border border-outline-variant overflow-hidden">
            <div className="p-4 border-b border-outline-variant bg-surface flex justify-between items-center">
              <h3 className="font-headline-sm text-on-surface">Chỉnh sửa Lô đất</h3>
              <button onClick={() => setIsEditing(false)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-4 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="font-label-md text-on-surface-variant">Diện tích (Hecta)</label>
                <input 
                  type="number"
                  step="0.1"
                  value={editForm.area}
                  onChange={(e) => setEditForm({...editForm, area: e.target.value})}
                  className="bg-surface-container-highest border border-outline-variant rounded p-2 text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-label-md text-on-surface-variant">Giai đoạn phát triển</label>
                <select 
                  value={editForm.current_crop_stage}
                  onChange={(e) => setEditForm({...editForm, current_crop_stage: e.target.value})}
                  className="bg-surface-container-highest border border-outline-variant rounded p-2 text-on-surface focus:outline-none focus:border-primary"
                >
                  <option value="SEEDLING">Gieo mạ</option>
                  <option value="TILLERING">Đẻ nhánh</option>
                  <option value="BOOTING">Đòng - Trổ</option>
                  <option value="GRAIN_FILLING">Chín</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-label-md text-on-surface-variant">Hóa chất (Thuốc trừ sâu)</label>
                <select 
                  value={editForm.current_pesticide}
                  onChange={(e) => setEditForm({...editForm, current_pesticide: e.target.value})}
                  className="bg-surface-container-highest border border-outline-variant rounded p-2 text-on-surface focus:outline-none focus:border-primary"
                >
                  <option value="Tricyclazole">Tricyclazole (Trị Đạo ôn)</option>
                  <option value="Hexaconazole">Hexaconazole (Trị Khô vằn, Lem lép hạt)</option>
                  <option value="Abamectin">Abamectin (Trị Nhện đỏ, Sâu cuốn lá)</option>
                </select>
              </div>
            </div>

            <div className="p-4 border-t border-outline-variant bg-surface flex justify-end gap-2">
              <button 
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded text-on-surface hover:bg-surface-container-highest transition-colors font-label-md"
              >
                Hủy
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 rounded bg-primary text-on-primary hover:bg-primary-hover transition-colors font-label-md disabled:opacity-50"
              >
                {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Global styles for hover animation */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes hover-drone {
          0% { transform: translateZ(150px) rotateZ(45deg); }
          100% { transform: translateZ(170px) rotateZ(45deg); }
        }
        .transform-style-flat { transform-style: flat; }
      `}} />
    </div>
  );
}
