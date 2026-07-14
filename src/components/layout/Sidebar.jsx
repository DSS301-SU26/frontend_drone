import { useApp } from "../../context/AppContext";

const navItems = [
  { id: "mission-control", label: "Mission Control", icon: "precision_manufacturing" },
  { id: "drone-fleet", label: "Drone Fleet", icon: "flight" },
  { id: "terrain-maps", label: "Terrain Maps", icon: "layers" },
];

export default function Sidebar() {
  const { activeNav, setActiveNav, setSidebarOpen } = useApp();

  const navigate = (id) => {
    setActiveNav(id);
    setSidebarOpen(false);
  };

  return (
    <nav className="hidden md:flex flex-col h-screen w-64 fixed left-0 top-0 border-r border-outline-variant bg-surface-container-low py-lg px-sm gap-xs z-40">
      <div className="px-md mb-lg">
        <h1 className="font-headline-sm text-headline-sm font-bold text-on-surface">Control Center</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">Precision Ag v2.4</p>
      </div>

      {/* 
      <button
        onClick={() => navigate("mission-control")}
        className="w-full bg-primary-container hover:bg-primary text-on-primary-container py-sm px-md rounded-lg font-bold mb-md transition-colors flex items-center justify-center gap-xs"
      >
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
        Initiate Mission
      </button>
      */}

      <div className="flex-1 flex flex-col gap-xs">
        {navItems.map((item) => {
          const isActive = activeNav === item.id;
          return (
            <a
              key={item.id}
              href="#"
              onClick={(e) => { e.preventDefault(); navigate(item.id); }}
              className={`flex items-center gap-md px-md py-sm rounded-lg transition-colors duration-150 ${
                isActive
                  ? "bg-primary-container text-on-primary-container font-bold"
                  : "text-on-surface-variant hover:bg-surface-variant"
              }`}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
              >
                {item.icon}
              </span>
              <span className="font-label-caps text-label-caps">{item.label}</span>
            </a>
          );
        })}
      </div>

    </nav>
  );
}
