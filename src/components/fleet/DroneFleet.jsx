import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { addDrone, getDronesList, deleteDrone, editDrone } from "../../api/dashboard";

export default function DroneFleet() {
  const { droneList, setDroneList, notify } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [viewDrone, setViewDrone] = useState(null);
  const [editingDroneId, setEditingDroneId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  const initialForm = {
    model_name: "", max_wind_resistance_kph: 36.0, max_gust_resistance_kph: 45.0,
    tank_capacity_liters: 30.0, spray_system_type: "CENTRIFUGAL", ip_rating: "IP67", image_url: "", notes: ""
  };
  const [formData, setFormData] = useState(initialForm);

  const openAddModal = () => {
    setEditingDroneId(null);
    setFormData(initialForm);
    setModalOpen(true);
  };

  const openEditModal = (drone) => {
    if (!drone.drone_id) return notify("Không thể sửa Drone mặc định");
    setEditingDroneId(drone.drone_id);
    setFormData({
      model_name: drone.model_name || "",
      max_wind_resistance_kph: drone.max_wind_resistance_kph || 36.0,
      max_gust_resistance_kph: drone.max_gust_resistance_kph || 45.0,
      tank_capacity_liters: drone.tank_capacity_liters || 30.0,
      spray_system_type: drone.spray_system_type || "CENTRIFUGAL",
      ip_rating: drone.ip_rating || "IP67",
      image_url: drone.image_url || "",
      notes: drone.notes || ""
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.model_name.trim()) return notify("Vui lòng nhập tên Model.");
    setSubmitting(true);
    try {
      if (editingDroneId) {
        await editDrone(editingDroneId, formData);
        notify(`Đã cập nhật Drone ${formData.model_name} thành công!`);
      } else {
        await addDrone(formData);
        notify(`Đã thêm Drone ${formData.model_name} thành công!`);
      }
      setModalOpen(false);
      const updatedDrones = await getDronesList();
      setDroneList(updatedDrones);
      setFormData(initialForm);
      setEditingDroneId(null);
    } catch (err) {
      notify(`Lỗi lưu Drone: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (droneId) => {
    if (!droneId) return notify("Không thể xóa Drone mặc định.");
    if (!window.confirm("Bạn có chắc chắn muốn xóa Drone này?")) return;
    try {
      await deleteDrone(droneId);
      notify("Đã xóa Drone thành công!");
      const updatedDrones = await getDronesList();
      setDroneList(updatedDrones);
    } catch (err) {
      notify(`Lỗi xóa Drone: ${err.message}`);
    }
  };
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
          <button 
            onClick={openAddModal}
            className="px-md py-sm bg-primary text-on-primary rounded font-label-caps text-label-caps uppercase font-bold hover:bg-primary-fixed transition-colors flex items-center gap-xs shadow-[0_0_12px_rgba(0,184,148,0.3)]"
          >
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
        {droneList?.length > 0 ? droneList.map((drone) => (
          <div key={drone.drone_id || drone.model_name} className="bg-surface-container-low border border-outline-variant rounded-lg overflow-hidden flex flex-col">
            {/* Image Header */}
            <div className="h-48 w-full relative border-b border-outline-variant">
              {drone.image_url ? (
                <div 
                  className="w-full h-full bg-cover bg-center" 
                  style={{ backgroundImage: `url('${drone.image_url}')` }}
                ></div>
              ) : (
                <div className="w-full h-full bg-surface-variant flex items-center justify-center">
                  <span className="material-symbols-outlined text-[64px] text-on-surface-variant/50">flight</span>
                </div>
              )}
              <div className="absolute top-sm right-sm bg-surface-container-lowest/80 backdrop-blur px-sm py-xs rounded flex items-center gap-xs border border-outline-variant">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                <span className="font-label-caps text-label-caps text-primary uppercase font-bold">Hoạt động</span>
              </div>
            </div>
            {/* Content */}
            <div className="p-md flex-1 flex flex-col gap-sm">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface">{drone.model_name}</h3>
                  <p className="font-label-caps text-label-caps text-on-surface-variant uppercase mt-1">Hạm đội Nông nghiệp</p>
                </div>
                {drone.drone_id && <span className="font-data-mono text-data-mono text-primary bg-primary/10 px-xs py-[2px] rounded border border-primary/30">ID: {drone.drone_id}</span>}
              </div>
              {/* Telemetry */}
              <div className="grid grid-cols-2 gap-sm mt-xs">
                <div className="bg-surface-container-highest p-sm rounded border border-outline-variant flex flex-col">
                  <span className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-1">Kháng gió tối đa</span>
                  <div className="flex items-center gap-xs">
                    <span className="material-symbols-outlined text-on-surface text-[16px]">air</span>
                    <span className="font-data-mono text-data-mono text-on-surface">{drone.max_wind_resistance_kph} km/h</span>
                  </div>
                </div>
                <div className="bg-surface-container-highest p-sm rounded border border-outline-variant flex flex-col">
                  <span className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-1">Tải trọng bình</span>
                  <div className="flex items-center gap-xs">
                    <span className="material-symbols-outlined text-on-surface text-[16px]">water_drop</span>
                    <span className="font-data-mono text-data-mono text-on-surface">{drone.tank_capacity_liters} Lít</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-auto pt-sm flex gap-sm border-t border-outline-variant">
                <button onClick={() => setViewDrone(drone)} className="flex-1 py-xs bg-surface-container-high border border-outline-variant text-on-surface rounded font-label-caps text-label-caps uppercase hover:bg-surface-variant transition-colors flex items-center justify-center gap-xs">
                  <span className="material-symbols-outlined text-[16px]">info</span> Chi tiết
                </button>
                <button onClick={() => openEditModal(drone)} className="py-xs px-md bg-surface-container-high border border-outline-variant text-on-surface rounded hover:bg-surface-variant transition-colors flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                </button>
                <button onClick={() => handleDelete(drone.drone_id)} className="py-xs px-md bg-error/10 border border-error/50 text-error rounded hover:bg-error/20 transition-colors flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            </div>
          </div>
        )) : (
          <div className="col-span-full py-xl text-center text-on-surface-variant">
            Chưa có Drone nào trong hệ thống.
          </div>
        )}
      </section>

      {/* View Drone Details Modal */}
      {viewDrone && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex justify-center items-center p-md">
          <div className="bg-surface-container border border-outline-variant rounded-xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
            <div className="h-48 w-full relative border-b border-outline-variant">
              {viewDrone.image_url ? (
                <div 
                  className="w-full h-full bg-cover bg-center" 
                  style={{ backgroundImage: `url('${viewDrone.image_url}')` }}
                ></div>
              ) : (
                <div className="w-full h-full bg-surface-variant flex items-center justify-center">
                  <span className="material-symbols-outlined text-[64px] text-on-surface-variant/50">flight</span>
                </div>
              )}
              <button onClick={() => setViewDrone(null)} className="absolute top-sm right-sm bg-surface-container-lowest/80 backdrop-blur p-xs rounded text-on-surface-variant hover:text-error transition-colors">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="p-lg flex flex-col gap-md">
              <div>
                <h3 className="font-headline-md text-headline-md text-on-surface">{viewDrone.model_name}</h3>
                <p className="font-body-md text-on-surface-variant">Hạm đội Nông nghiệp {viewDrone.drone_id ? `- ID: ${viewDrone.drone_id}` : ""}</p>
              </div>
              <div className="grid grid-cols-2 gap-sm">
                <div className="bg-surface-container-highest p-sm rounded border border-outline-variant">
                  <span className="font-label-caps text-label-caps text-on-surface-variant uppercase block mb-1">Kháng gió Tối đa</span>
                  <span className="font-data-mono text-data-mono text-on-surface">{viewDrone.max_wind_resistance_kph} km/h</span>
                </div>
                <div className="bg-surface-container-highest p-sm rounded border border-outline-variant">
                  <span className="font-label-caps text-label-caps text-on-surface-variant uppercase block mb-1">Gió giật Tối đa</span>
                  <span className="font-data-mono text-data-mono text-on-surface">{viewDrone.max_gust_resistance_kph} km/h</span>
                </div>
                <div className="bg-surface-container-highest p-sm rounded border border-outline-variant">
                  <span className="font-label-caps text-label-caps text-on-surface-variant uppercase block mb-1">Dung tích Bình</span>
                  <span className="font-data-mono text-data-mono text-on-surface">{viewDrone.tank_capacity_liters} Lít</span>
                </div>
                <div className="bg-surface-container-highest p-sm rounded border border-outline-variant">
                  <span className="font-label-caps text-label-caps text-on-surface-variant uppercase block mb-1">Vòi phun</span>
                  <span className="font-data-mono text-data-mono text-on-surface">{viewDrone.spray_system_type === "CENTRIFUGAL" ? "Ly tâm" : "Áp lực"}</span>
                </div>
                <div className="bg-surface-container-highest p-sm rounded border border-outline-variant col-span-2">
                  <span className="font-label-caps text-label-caps text-on-surface-variant uppercase block mb-1">Chuẩn kháng nước/bụi</span>
                  <span className="font-data-mono text-data-mono text-on-surface">{viewDrone.ip_rating || "IP67"}</span>
                </div>
                {viewDrone.notes && (
                  <div className="bg-surface-container-highest p-sm rounded border border-outline-variant col-span-2">
                    <span className="font-label-caps text-label-caps text-on-surface-variant uppercase block mb-1">Ghi chú</span>
                    <span className="font-body-md text-on-surface whitespace-pre-wrap">{viewDrone.notes}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Drone Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex justify-center items-center p-md">
          <div className="bg-surface-container border border-outline-variant rounded-xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-screen">
            <header className="px-lg py-md border-b border-outline-variant flex justify-between items-center bg-surface-container-low shrink-0">
              <h3 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-sm">
                <span className="material-symbols-outlined text-primary">{editingDroneId ? 'edit' : 'add_circle'}</span> {editingDroneId ? 'Chỉnh sửa Drone' : 'Thêm Drone Mới'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-on-surface-variant hover:text-error transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </header>
            <form onSubmit={handleSave} className="flex flex-col p-lg gap-md overflow-y-auto">
              <div className="flex flex-col gap-xs">
                <label className="font-label-caps text-label-caps text-on-surface-variant uppercase">Tên Model</label>
                <input type="text" className="bg-surface-container-highest border border-outline-variant rounded px-sm py-xs text-on-surface focus:outline-none focus:border-primary" 
                  value={formData.model_name} onChange={e => setFormData({...formData, model_name: e.target.value})} placeholder="Vd: DJI_T40" required />
              </div>
              <div className="flex flex-col gap-xs">
                <label className="font-label-caps text-label-caps text-on-surface-variant uppercase">Link Ảnh (URL)</label>
                <input type="url" className="bg-surface-container-highest border border-outline-variant rounded px-sm py-xs text-on-surface focus:outline-none focus:border-primary" 
                  value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} placeholder="https://example.com/drone.jpg" />
              </div>
              <div className="flex flex-col gap-xs">
                <label className="font-label-caps text-label-caps text-on-surface-variant uppercase">Ghi chú</label>
                <textarea className="bg-surface-container-highest border border-outline-variant rounded px-sm py-xs text-on-surface focus:outline-none focus:border-primary min-h-[80px] resize-y" 
                  value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Các ghi chú đặc biệt về Drone này..."></textarea>
              </div>
              <div className="grid grid-cols-2 gap-md">
                <div className="flex flex-col gap-xs">
                  <label className="font-label-caps text-label-caps text-on-surface-variant uppercase">Kháng gió (km/h)</label>
                  <input type="number" step="0.1" className="bg-surface-container-highest border border-outline-variant rounded px-sm py-xs text-on-surface focus:outline-none focus:border-primary" 
                    value={formData.max_wind_resistance_kph} onChange={e => setFormData({...formData, max_wind_resistance_kph: parseFloat(e.target.value)})} required />
                </div>
                <div className="flex flex-col gap-xs">
                  <label className="font-label-caps text-label-caps text-on-surface-variant uppercase">Kháng gió giật (km/h)</label>
                  <input type="number" step="0.1" className="bg-surface-container-highest border border-outline-variant rounded px-sm py-xs text-on-surface focus:outline-none focus:border-primary" 
                    value={formData.max_gust_resistance_kph} onChange={e => setFormData({...formData, max_gust_resistance_kph: parseFloat(e.target.value)})} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-md">
                <div className="flex flex-col gap-xs">
                  <label className="font-label-caps text-label-caps text-on-surface-variant uppercase">Dung tích bình (Lít)</label>
                  <input type="number" step="0.1" className="bg-surface-container-highest border border-outline-variant rounded px-sm py-xs text-on-surface focus:outline-none focus:border-primary" 
                    value={formData.tank_capacity_liters} onChange={e => setFormData({...formData, tank_capacity_liters: parseFloat(e.target.value)})} required />
                </div>
                <div className="flex flex-col gap-xs">
                  <label className="font-label-caps text-label-caps text-on-surface-variant uppercase">Loại vòi phun</label>
                  <select className="bg-surface-container-highest border border-outline-variant rounded px-sm py-xs text-on-surface focus:outline-none focus:border-primary" 
                    value={formData.spray_system_type} onChange={e => setFormData({...formData, spray_system_type: e.target.value})}>
                    <option value="CENTRIFUGAL">Ly tâm (CENTRIFUGAL)</option>
                    <option value="PRESSURE">Áp lực (PRESSURE)</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-xs">
                <label className="font-label-caps text-label-caps text-on-surface-variant uppercase">Chuẩn kháng nước/bụi</label>
                <input type="text" className="bg-surface-container-highest border border-outline-variant rounded px-sm py-xs text-on-surface focus:outline-none focus:border-primary" 
                  value={formData.ip_rating} onChange={e => setFormData({...formData, ip_rating: e.target.value})} placeholder="Vd: IP67" />
              </div>
              <footer className="mt-sm pt-md border-t border-outline-variant flex justify-end gap-sm shrink-0">
                <button type="button" onClick={() => setModalOpen(false)} className="px-md py-sm rounded border border-outline-variant text-on-surface hover:bg-surface-variant font-label-caps text-label-caps uppercase transition-colors">Hủy</button>
                <button type="submit" disabled={submitting} className="px-md py-sm rounded bg-primary text-on-primary font-label-caps text-label-caps uppercase font-bold hover:bg-primary-fixed disabled:opacity-50 transition-colors shadow-md flex items-center gap-xs">
                  {submitting ? "Đang lưu..." : <><span className="material-symbols-outlined text-[16px]">save</span> Lưu Drone</>}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
