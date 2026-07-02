import { Suspense, lazy } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import Sidebar from "./components/layout/Sidebar";
import TopNav from "./components/layout/TopNav";
import MissionControl from "./components/dashboard/MissionControl";
import DroneFleet from "./components/fleet/DroneFleet";
import TerrainMaps from "./components/maps/TerrainMaps";
import AiInsights from "./components/ai/AiInsights";
import SafetyLogs from "./components/logs/SafetyLogs";

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
          {activeNav === "ai-insights" && <AiInsights />}
          {activeNav === "safety-logs" && <SafetyLogs />}
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
