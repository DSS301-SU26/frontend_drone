import { Suspense, lazy } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import Sidebar from "./components/layout/Sidebar";
import TopNav from "./components/layout/TopNav";
import MissionControl from "./components/dashboard/MissionControl";
import DroneFleet from "./components/fleet/DroneFleet";
import TerrainMaps from "./components/maps/TerrainMaps";

function MainLayout() {
  const { activeNav } = useApp();

  return (
    <div className="flex bg-background min-h-screen text-on-surface">
      <Sidebar />
      <div className="flex-1 md:ml-64 flex flex-col h-screen overflow-hidden">
        <TopNav />
        <main className={`flex-1 overflow-y-auto overflow-x-hidden relative ${activeNav === 'terrain-maps' ? 'p-0 h-full' : 'p-margin-mobile md:p-margin-desktop'}`}>
          
          {/* Main Content Area based on Active Nav */}
          {activeNav === "mission-control" && <MissionControl />}
          {activeNav === "drone-fleet" && <DroneFleet />}
          {activeNav === "terrain-maps" && <TerrainMaps />}
          {activeNav === "ai-insights" && (
            <div className="p-lg bg-surface-container rounded-xl border border-surface-variant flex flex-col items-center justify-center text-on-surface-variant h-64">
              <span className="material-symbols-outlined text-[48px] mb-md opacity-50">psychology</span>
              <h2 className="font-headline-md font-bold mb-xs text-on-surface">AI Training & Insights</h2>
              <p>Mô-đun theo dõi quá trình huấn luyện AI.</p>
            </div>
          )}
          {activeNav === "safety-logs" && (
            <div className="p-lg bg-surface-container rounded-xl border border-surface-variant flex flex-col items-center justify-center text-on-surface-variant h-64">
              <span className="material-symbols-outlined text-[48px] mb-md opacity-50">security</span>
              <h2 className="font-headline-md font-bold mb-xs text-on-surface">Safety & Compliance Logs</h2>
              <p>Lưu trữ nhật ký bay và báo cáo an toàn.</p>
            </div>
          )}
        </main>
      </div>


    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}

export default App;
