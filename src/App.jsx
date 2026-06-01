import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  BatteryCharging,
  Bell,
  Bot,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Clock3,
  CloudRain,
  Droplets,
  Gauge,
  Grid2X2,
  History,
  House,
  LayoutDashboard,
  Lock,
  Map,
  MapPin,
  Menu,
  Navigation,
  Plane,
  Play,
  Plus,
  Radio,
  RefreshCw,
  Route,
  Search,
  ShieldAlert,
  Sparkles,
  ThermometerSun,
  TrendingDown,
  Wind,
  X,
  Zap,
} from "lucide-react";
import { getDashboard, getLocations } from "./api/dashboard";

const navItems = [
  { id: "overview", label: "Tổng quan", icon: LayoutDashboard },
  { id: "fields", label: "Điều kiện theo giờ", icon: Map },
  { id: "missions", label: "Lịch vận hành", icon: CalendarDays },
  { id: "analytics", label: "Phân tích & KPI", icon: Activity },
  { id: "history", label: "Nhật ký quyết định", icon: History },
];

const actionConfig = {
  TAKE_OFF: {
    title: "Có thể cất cánh",
    short: "Cất cánh",
    risk: "Thấp",
    tone: "healthy",
    description: "Điều kiện thời tiết nằm trong ngưỡng vận hành. UAV có thể thực hiện nhiệm vụ theo kế hoạch.",
  },
  DELAY_FLIGHT: {
    title: "Nên hoãn chuyến bay",
    short: "Hoãn bay",
    risk: "Trung bình",
    tone: "stress",
    description: "Nhiệt độ hoặc khả năng mưa đang tăng. Hệ thống khuyến nghị chờ khung giờ an toàn tiếp theo.",
  },
  LOCK_SPRAY: {
    title: "Khóa lệnh phun",
    short: "Khóa phun",
    risk: "Cao",
    tone: "dry",
    description: "Gió hoặc gió giật đã vượt ngưỡng an toàn. Khóa phun giúp tránh trôi dạt hóa chất và mất ổn định UAV.",
  },
  RETURN_TO_CHARGING: {
    title: "Đưa UAV về trạm sạc",
    short: "Về trạm sạc",
    risk: "Cao",
    tone: "dry",
    description: "Mưa hoặc thời tiết nguy hiểm đang hiện diện. UAV cần quay về trạm sạc để bảo vệ thiết bị.",
  },
};

const droneStateConfig = {
  DOCKED: { label: "Đang ở trạm", short: "Sẵn sàng tại Dock 01" },
  FLYING: { label: "Đang bay giám sát", short: "Telemetry đang truyền trực tiếp" },
  SPRAYING: { label: "Đang phun thuốc", short: "Vòi phun đang hoạt động" },
  RETURNING: { label: "Đang quay về trạm", short: "Đang điều hướng về Dock 01" },
};

function App() {
  const [locations, setLocations] = useState([]);
  const [locationId, setLocationId] = useState("Dong Thap");
  const [dashboard, setDashboard] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(0);
  const [activeNav, setActiveNav] = useState("overview");
  const [droneOpen, setDroneOpen] = useState(false);
  const [operationTimestamp, setOperationTimestamp] = useState("");
  const [droneState, setDroneState] = useState("DOCKED");
  const [sprayLocked, setSprayLocked] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [missionOpen, setMissionOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  const [syncing, setSyncing] = useState(false);

  const notify = useCallback((message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3200);
  }, []);

  const loadDashboard = useCallback(async (showToast = false) => {
    setSyncing(true);
    setError("");
    try {
      const payload = await getDashboard(locationId);
      setDashboard(payload);
      setSelectedSlot(0);
      setDroneOpen(false);
      setOperationTimestamp(payload.current.timestamp);
      setDroneState("DOCKED");
      setSprayLocked(false);
      if (showToast) notify("Đã đồng bộ dữ liệu mới nhất từ Agricultural Drone Scheduler.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSyncing(false);
    }
  }, [locationId, notify]);

  useEffect(() => {
    getLocations().then(setLocations).catch((requestError) => setError(requestError.message));
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const current = dashboard?.current;
  const action = actionConfig[current?.decision_action] ?? actionConfig.DELAY_FLIGHT;
  const slots = dashboard?.recommended_slots ?? [];
  const selectedRecommendedSlot = slots[selectedSlot] ?? slots[0];
  const canSchedule = Boolean(selectedRecommendedSlot?.schedule_eligible);
  const timelineTiles = useMemo(
    () => (dashboard?.timeline_tiles ?? []).map((tile) => ({
      ...tile,
      tone: actionConfig[tile.decision_action]?.tone ?? "stress",
      label: actionConfig[tile.decision_action]?.short ?? tile.decision_action,
    })),
    [dashboard],
  );
  const operationTile = timelineTiles.find((tile) => tile.timestamp === operationTimestamp) ?? current;
  const operationAction = actionConfig[operationTile?.decision_action] ?? actionConfig.DELAY_FLIGHT;
  const nextSafeSlot = timelineTiles.find((tile) => tile.schedule_eligible) ?? slots.find((tile) => tile.schedule_eligible);
  const isAirborne = droneState !== "DOCKED";
  const canControlFlight = droneState === "FLYING" || droneState === "SPRAYING";
  const weatherUnsafe = operationTile?.decision_action !== "TAKE_OFF";
  const isSpraying = droneState === "SPRAYING" && !sprayLocked;
  const droneMotion = droneState === "DOCKED" || droneState === "RETURNING"
    ? { left: "11%", top: "59%" }
    : droneState === "SPRAYING"
      ? { left: "48%", top: "48%" }
      : { left: "38%", top: "34%" };
  const countdown = formatCountdown(dashboard?.source.reference_time, nextSafeSlot?.timestamp);
  const sceneStatus = getSceneStatus({ droneState, nextSafeSlot, countdown, weatherUnsafe, sprayLocked });
  const sceneVariant = Math.max(locations.findIndex((location) => location.id === dashboard?.location.id), 0) % 3;
  const recentActivity = useMemo(() => {
    if (!dashboard || !current) return [];
    return [
      { time: current.time, title: action.title, detail: `${dashboard.location.name}: ${current.weather_description || current.decision_action}`, tone: action.tone === "healthy" ? "success" : "warning" },
      { time: current.time, title: "Decision Engine đã tính flow-rate", detail: `Mức đề xuất: ${current.dynamic_flow_rate_pct}% theo điều kiện hiện tại`, tone: "success" },
      { time: slots[0]?.time ?? "--:--", title: "Đã tìm khung giờ vận hành phù hợp", detail: slots[0] ? `${slots[0].time} - ${slots[0].end_time}, điểm bay ${slots[0].flyability_score}/100` : "Chưa có slot phù hợp", tone: "success" },
    ];
  }, [action, current, dashboard, slots]);

  const scrollTo = (id) => {
    setActiveNav(id);
    setSidebarOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const openMission = () => {
    if (!canSchedule) {
      notify("Chưa có slot TAKE_OFF an toàn. Decision Engine đã khóa thao tác lên lịch.");
      return;
    }
    setMissionOpen(true);
  };

  const selectSimulationTime = (tile) => {
    setOperationTimestamp(tile.timestamp);
    if (isAirborne && tile.decision_action !== "TAKE_OFF") {
      notify(`Cảnh báo: thời tiết lúc ${tile.time} chuyển xấu khi UAV đang hoạt động.`);
    }
  };

  const launchDrone = () => {
    if (!operationTile.schedule_eligible) {
      notify(`Không thể cất cánh lúc ${operationTile.time}: ${operationAction.title}.`);
      return;
    }
    setSprayLocked(false);
    setDroneState("FLYING");
    notify(`UAV-01 đã cất cánh theo forecast lúc ${operationTile.time}.`);
  };

  const toggleSpraying = () => {
    if (droneState === "SPRAYING") {
      setDroneState("FLYING");
      notify("Đã dừng vòi phun. UAV tiếp tục bay giám sát.");
      return;
    }
    if (weatherUnsafe || sprayLocked) {
      notify("Không thể bật phun: điều kiện hiện tại không an toàn hoặc vòi phun đang bị khóa.");
      return;
    }
    setDroneState("SPRAYING");
    notify("Đã bật phun thuốc theo dynamic flow-rate của Decision Engine.");
  };

  const lockSpray = () => {
    setSprayLocked(true);
    if (droneState === "SPRAYING") setDroneState("FLYING");
    notify("Đã khóa vòi phun. UAV không tiếp tục phun thuốc.");
  };

  const returnToStation = () => {
    setSprayLocked(true);
    setDroneState("RETURNING");
    notify("UAV-01 đang quay về trạm Dock 01.");
  };

  if (!dashboard && error) {
    return <ErrorScreen error={error} retry={() => loadDashboard()} />;
  }

  if (!dashboard) {
    return <LoadingScreen />;
  }

  const weatherMetrics = [
    { label: "Nhiệt độ", value: current.temperature, unit: "°C", icon: ThermometerSun, tone: "orange", note: `Ngưỡng an toàn ≤ 35°C` },
    { label: "Tốc độ gió", value: current.wind_speed, unit: " km/h", icon: Wind, tone: "blue", note: `Gió giật ${current.wind_gust} km/h` },
    { label: "Độ ẩm", value: current.humidity, unit: "%", icon: Droplets, tone: "cyan", note: "Dữ liệu WeatherAPI" },
    { label: "Khả năng mưa", value: current.rain_probability, unit: "%", icon: CloudRain, tone: "purple", note: `${current.precipitation} mm lượng mưa` },
  ];

  return (
    <div className="app-shell">
      <AnimatePresence>
        {sidebarOpen && <motion.button className="mobile-overlay" aria-label="Đóng menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSidebarOpen(false)} />}
      </AnimatePresence>

      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-symbol"><Plane size={19} /></div>
          <div><b>AgriFlight</b><span>Decision Support</span></div>
        </div>
        <div className="sidebar-label">Không gian làm việc</div>
        <nav className="side-nav">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button className={activeNav === id ? "active" : ""} onClick={() => scrollTo(id)} key={id}><Icon size={17} /><span>{label}</span></button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="support-card">
            <div className="support-icon"><Bot size={17} /></div>
            <b>Decision Engine</b>
            <p>Khuyến nghị được tính từ forecast sạch và rule an toàn UAV.</p>
            <button onClick={() => scrollTo("assistant")}>Xem giải thích <ChevronRight size={14} /></button>
          </div>
          <button className="profile"><span className="avatar">HN</span><span><b>Hoàng Nam</b><small>Agri Service Manager</small></span><ChevronDown size={15} /></button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button className="icon-btn menu-btn" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
          <div><h1>Trung tâm điều hành</h1><p>Agricultural Drone Scheduler <span className="live-dot" /> <b>Dữ liệu pipeline trực tiếp</b></p></div>
          <div className="topbar-actions">
            <label className="search-box"><Search size={17} /><input placeholder="Tìm điểm giám sát..." /></label>
            <div className="notification-wrap">
              <button className="icon-btn notification-btn" onClick={() => setNotificationOpen(!notificationOpen)}><Bell size={18} /><i /></button>
              <AnimatePresence>
                {notificationOpen && (
                  <motion.div className="notification-popover" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                    <b>Cảnh báo Decision Engine</b>
                    <p><ShieldAlert size={15} /> {action.title} tại {dashboard.location.name}.</p>
                    <p><CloudRain size={15} /> Khả năng mưa hiện tại: {current.rain_probability}%.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button className="primary-btn" disabled={!canSchedule} onClick={openMission}><Plus size={17} /> Tạo nhiệm vụ bay</button>
          </div>
        </header>

        <section className="field-toolbar">
          <div>
            <small>Điểm giám sát đang theo dõi</small>
            <label className="field-select">
              <MapPin size={16} />
              <select value={locationId} onChange={(event) => setLocationId(event.target.value)}>
                {locations.map((location) => <option value={location.id} key={location.id}>{location.name}</option>)}
              </select>
              <ChevronDown size={15} />
            </label>
          </div>
          <div className="toolbar-right">
            <span>Nguồn: {dashboard.source.dataset}</span>
            <button className="outline-btn" onClick={() => loadDashboard(true)}><RefreshCw className={syncing ? "spin" : ""} size={15} /> Đồng bộ dữ liệu</button>
          </div>
        </section>

        {error && <div className="inline-error"><CircleAlert size={15} /> {error}</div>}

        <section className="decision-hero" id="overview">
          <div className="hero-glow glow-one" /><div className="hero-glow glow-two" />
          <div className="hero-copy">
            <span className="eyebrow"><span className="pulse-ring"><ShieldAlert size={14} /></span> {current.decision_action} · Decision Engine</span>
            <h2>{action.title}</h2>
            <p>{action.description}</p>
            <div className="hero-actions">
              <button className="hero-primary" onClick={() => scrollTo("missions")}><CalendarDays size={17} /> Xem khung giờ phù hợp</button>
              <button className="hero-secondary" onClick={() => scrollTo("assistant")}><Bot size={17} /> Xem giải thích</button>
            </div>
          </div>
          <div className="hero-score">
            <div className="score-orbit"><span /><span /><span /></div>
            <div className="score-circle"><small>Điểm bay</small><strong>{current.flyability_score}</strong><em>/100</em></div>
            <div className="risk-pill"><TrendingDown size={14} /> Rủi ro vận hành: {action.risk}</div>
          </div>
        </section>

        <section className="metric-grid">
          {weatherMetrics.map(({ label, value, unit, icon: Icon, tone, note }, index) => (
            <motion.article className="metric-card" key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }}>
              <div className={`metric-icon ${tone}`}><Icon size={18} /></div>
              <div className="metric-heading"><span>{label}</span><small className={current.risk_level === "LOW" ? "stable" : ""}>{current.risk_level}</small></div>
              <strong>{value}<em>{unit}</em></strong><p>{note}</p>
            </motion.article>
          ))}
        </section>

        <section className="content-grid">
          <article className="panel weather-panel">
            <PanelHeading eyebrow="WeatherAPI forecast" title={`Xu hướng vi khí hậu · ${dashboard.location.name}`} action={<span className="source-pill">{current.time}</span>} />
            <WeatherChart forecast={dashboard.forecast} />
          </article>
          <article className="panel slots-panel" id="missions">
            <PanelHeading eyebrow="Rule-based scheduling" title={dashboard.has_safe_slot ? "Khung giờ TAKE_OFF phù hợp" : "Chưa có slot TAKE_OFF an toàn"} action={<Sparkles size={18} className="sparkle" />} />
            <div className="slot-list">
              {slots.map((slot, index) => (
                <button className={`time-slot ${selectedSlot === index ? "selected" : ""} ${slot.schedule_eligible ? "" : "unsafe"}`} onClick={() => setSelectedSlot(index)} key={slot.timestamp}>
                  <span className="slot-radio">{selectedSlot === index && <Check size={12} />}</span>
                  <span className="slot-time"><b>{slot.time}</b><small>{slot.schedule_eligible ? `đến ${slot.end_time}` : actionConfig[slot.decision_action]?.short}</small></span>
                  <span className="slot-weather"><Wind size={13} />{slot.wind_speed} km/h<ThermometerSun size={13} />{slot.temperature}°C</span>
                  <span className="slot-score"><b>{slot.flyability_score}</b><small>điểm</small></span>
                </button>
              ))}
            </div>
            <button className="full-btn" disabled={!canSchedule} onClick={openMission}>{canSchedule ? "Lên lịch nhiệm vụ" : "Đã khóa lịch bay"} <Route size={15} /></button>
          </article>
        </section>

        <section className="content-grid map-row" id="fields">
          <article className="panel field-panel">
            <PanelHeading eyebrow="Digital twin · WeatherAPI → Decision Engine" title={`Mô phỏng vận hành 2D · ${dashboard.location.name}`} action={<span className="simulation-live"><i /> Mô phỏng trực tiếp</span>} />
            <div className={`field-map scene-variant-${sceneVariant} ${weatherUnsafe ? "scene-weather-alert" : ""}`}>
              <div className="scene-field field-a"><i /><i /><i /><i /><i /></div>
              <div className="scene-field field-b"><i /><i /><i /><i /></div>
              <div className="scene-field field-c"><i /><i /><i /><i /><i /></div>
              <div className="scene-field field-d"><i /><i /><i /><i /></div>
              <div className="scene-river"><span /><span /><span /></div>
              <div className="scene-road road-main" />
              <div className="scene-road road-side" />
              <div className="scene-station">
                <span><BatteryCharging size={15} /></span>
                <b>Trạm UAV</b>
                <small>Dock 01</small>
              </div>
              <div className="scene-weather"><CloudRain size={14} /><span>Mưa {operationTile.rain_probability}%</span><Wind size={14} /><span>{operationTile.wind_speed} km/h</span></div>
              <div className={`scene-status-banner ${sceneStatus.tone}`}><Clock3 size={14} /><span><b>{sceneStatus.title}</b><small>{sceneStatus.detail}</small></span></div>
              {weatherUnsafe && <div className="weather-layer">{Array.from({ length: 11 }, (_, index) => <i style={{ left: `${index * 10 - 5}%`, animationDelay: `${index * -.17}s` }} key={index} />)}</div>}
              {isAirborne && <div className="flight-path" />}
              {isSpraying && <div className="spray-trail">{Array.from({ length: 8 }, (_, index) => <i style={{ left: `${index * 12}%`, animationDelay: `${index * -.12}s` }} key={index} />)}</div>}
              <motion.button
                aria-label="Xem trạng thái UAV-01"
                className={`drone-marker drone-${operationAction.tone} state-${droneState.toLowerCase()} ${droneOpen ? "active" : ""}`}
                onClick={() => setDroneOpen(true)}
                animate={droneMotion}
                transition={{ duration: droneState === "RETURNING" ? 2.1 : 1.25, ease: "easeInOut" }}
                onAnimationComplete={() => {
                  if (droneState === "RETURNING") {
                    setDroneState("DOCKED");
                    notify("UAV-01 đã về trạm Dock 01 an toàn.");
                  }
                }}
                whileHover={{ scale: 1.06 }}
              >
                <span className="drone-pulse" />
                <DroneIllustration />
                <span className="drone-label"><b>UAV-01 · {droneStateConfig[droneState].label}</b><small>Click để điều khiển và xem telemetry</small></span>
              </motion.button>
              <AnimatePresence>
                {droneOpen && (
                  <motion.div className="drone-panel" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 18 }}>
                    <button className="drone-panel-close" aria-label="Đóng trạng thái UAV" onClick={() => setDroneOpen(false)}><X size={15} /></button>
                    <span className="drone-panel-eyebrow"><Radio size={13} /> UAV-01 · Telemetry trực tiếp</span>
                    <div className={`operation-alert ${weatherUnsafe ? "danger" : "safe"}`}>
                      {weatherUnsafe ? <CircleAlert size={14} /> : <Check size={14} />}
                      <span><b>{weatherUnsafe ? "Điều kiện vận hành thay đổi" : "Điều kiện vận hành ổn định"}</b><small>Mốc mô phỏng {operationTile.time}: {operationAction.title}</small></span>
                    </div>
                    <div className="drone-panel-heading">
                      <div><h3>{droneStateConfig[droneState].label}</h3><p>{dashboard.location.name} · {droneStateConfig[droneState].short}</p></div>
                      <strong className={`drone-score score-${operationTile.tone}`}>{operationTile.flyability_score}<small>/100</small></strong>
                    </div>
                    <div className="drone-stats">
                      <span><Wind size={13} /><b>{operationTile.wind_speed}</b><small>km/h gió</small></span>
                      <span><CloudRain size={13} /><b>{operationTile.rain_probability}%</b><small>khả năng mưa</small></span>
                      <span><Droplets size={13} /><b>{operationTile.dynamic_flow_rate_pct}%</b><small>flow-rate</small></span>
                    </div>
                    <div className="drone-controls">
                      {droneState === "DOCKED" && <button className="control-primary" disabled={!operationTile.schedule_eligible} onClick={launchDrone}><Play size={13} /> Cất cánh</button>}
                      {(droneState === "FLYING" || droneState === "SPRAYING") && <button className="control-primary" disabled={weatherUnsafe || sprayLocked} onClick={toggleSpraying}><Droplets size={13} /> {droneState === "SPRAYING" ? "Dừng phun" : "Bật phun thuốc"}</button>}
                      {canControlFlight && <button className="control-warning" disabled={sprayLocked} onClick={lockSpray}><Lock size={13} /> {sprayLocked ? "Đã khóa phun" : "Khóa phun"}</button>}
                      {canControlFlight && <button className="control-danger" onClick={returnToStation}><House size={13} /> Quay về trạm</button>}
                    </div>
                    <p className="simulation-hint">Thử tình huống: chọn giờ xanh → cất cánh → bật phun → chuyển sang giờ cam hoặc đỏ để xử lý cảnh báo.</p>
                    <div className="drone-timeline-heading"><b>Dự báo vận hành trong ngày</b><small><i /> hiện tại · chọn giờ để mô phỏng</small></div>
                    <div className="drone-timeline">
                      {timelineTiles.map((tile) => (
                        <button className={`timeline-hour hour-${tile.tone} ${operationTile.timestamp === tile.timestamp ? "active" : ""} ${current.timestamp === tile.timestamp ? "is-current" : ""}`} onClick={() => selectSimulationTime(tile)} key={tile.timestamp}>
                          <span>{tile.time}</span><i /><small>{tile.flyability_score}</small>
                        </button>
                      ))}
                    </div>
                    <p className="drone-recommendation">{operationTile.recommendation_text}</p>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="map-location"><Navigation size={13} /> {dashboard.location.latitude}° N, {dashboard.location.longitude}° E</div>
            </div>
            <div className="map-footer">
              <div className="map-legend"><span className="legend healthy" />Có thể bay <span className="legend stress" />Nên hoãn <span className="legend dry" />Khóa phun / về trạm</div>
              <span className="data-note">Mô phỏng 2D · {timelineTiles.length} giờ dự báo</span>
            </div>
          </article>

          <article className="panel insight-panel" id="assistant">
            <div className="assistant-heading">
              <div className="assistant-icon"><Bot size={19} /></div>
              <div><span>AgriFlight Explainability</span><small><i /> Rule engine đang hoạt động</small></div><Sparkles size={17} />
            </div>
            <div className="ai-message">
              <span>Khuyến nghị mới nhất</span><h3>{action.title}</h3>
              <p>{action.description} Dữ liệu đầu vào: gió <b>{current.wind_speed} km/h</b>, gió giật <b>{current.wind_gust} km/h</b>, xác suất mưa <b>{current.rain_probability}%</b>.</p>
              <div className="ai-recommendation"><Zap size={15} /><span>Dynamic flow-rate đề xuất: <b>{current.dynamic_flow_rate_pct}%</b>. {dashboard.has_safe_slot ? <>Slot TAKE_OFF gần nhất: <b>{slots[0]?.time}</b>.</> : <b>Chưa có slot TAKE_OFF an toàn trong forecast.</b>}</span></div>
            </div>
            <div className="quick-prompts">
              <button onClick={() => notify(`Action hiện tại: ${current.decision_action}`)}>Xem mã quyết định hiện tại <ChevronRight size={13} /></button>
              <button onClick={() => notify(`Nguồn dữ liệu: ${dashboard.source.dataset}`)}>Kiểm tra nguồn forecast <ChevronRight size={13} /></button>
            </div>
            <div className="engine-output"><b>Engine output</b><span>{current.recommendation_text}</span></div>
          </article>
        </section>

        <section className="kpi-section" id="analytics">
          <div className="section-heading"><div><span>Backtesting report</span><h2>KPI mô phỏng của Decision Engine</h2></div><button className="outline-btn" onClick={() => notify("KPI lấy từ reports/backtesting_summary.json")}><Gauge size={15} /> Nguồn báo cáo thật</button></div>
          <div className="kpi-grid">
            {dashboard.kpis.map((kpi) => (
              <article className={`kpi-card ${kpi.tone}`} key={kpi.key}><span>{kpi.label}</span><strong>{kpi.value}{kpi.suffix}</strong><small><Check size={13} /> {kpi.note}</small><MiniBars tone={kpi.tone} /></article>
            ))}
          </div>
          <p className="backtest-note"><CircleAlert size={14} /> {dashboard.backtesting_note}</p>
        </section>

        <section className="panel activity-panel" id="history">
          <PanelHeading eyebrow="Decision audit" title="Hoạt động pipeline gần đây" action={<span className="source-pill">{dashboard.source.dataset}</span>} />
          <div className="activity-list">
            {recentActivity.map((item) => <div className="activity-item" key={item.title}><span className={`activity-marker ${item.tone}`} /><time>{item.time}</time><div><b>{item.title}</b><small>{item.detail}</small></div></div>)}
          </div>
        </section>
      </main>

      <AnimatePresence>
        {missionOpen && canSchedule && <MissionModal slot={selectedRecommendedSlot} location={dashboard.location} onClose={() => setMissionOpen(false)} onConfirm={() => { setMissionOpen(false); notify("Đã tạo lịch vận hành UAV từ slot Decision Engine đề xuất."); }} />}
      </AnimatePresence>
      <AnimatePresence>{toast && <motion.div className="toast" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}><Check size={16} />{toast}</motion.div>}</AnimatePresence>
    </div>
  );
}

function PanelHeading({ eyebrow, title, action }) {
  return <div className="panel-heading"><div><span>{eyebrow}</span><h2>{title}</h2></div>{action}</div>;
}

function formatCountdown(referenceTime, slotTimestamp) {
  if (!referenceTime || !slotTimestamp) return "";
  const minutes = Math.round((new Date(slotTimestamp) - new Date(referenceTime)) / 60000);
  if (minutes <= 0) return "đang trong khung giờ bay";
  if (minutes < 60) return `còn ${minutes} phút`;
  return `còn ${Math.floor(minutes / 60)} giờ ${minutes % 60} phút`;
}

function getSceneStatus({ droneState, nextSafeSlot, countdown, weatherUnsafe, sprayLocked }) {
  if (droneState === "RETURNING") return { tone: "danger", title: "UAV đang quay về trạm", detail: "Đường bay về Dock 01 đã được kích hoạt" };
  if (droneState === "SPRAYING" && weatherUnsafe) return { tone: "danger", title: "Thời tiết xấu khi đang phun", detail: "Khóa vòi phun hoặc đưa UAV về trạm ngay" };
  if (droneState === "FLYING" && weatherUnsafe) return { tone: "danger", title: "Thời tiết thay đổi khi đang bay", detail: "Kiểm tra telemetry và cân nhắc quay về trạm" };
  if (sprayLocked && droneState !== "DOCKED") return { tone: "warning", title: "Vòi phun đã bị khóa", detail: "UAV vẫn bay nhưng không còn phun thuốc" };
  if (droneState === "SPRAYING") return { tone: "safe", title: "Đang phun theo flow-rate", detail: "Decision Engine đang giám sát điều kiện vận hành" };
  if (droneState === "FLYING") return { tone: "safe", title: "UAV đang bay giám sát", detail: "Chọn một mốc giờ xấu để mô phỏng thay đổi thời tiết" };
  if (nextSafeSlot) return { tone: "safe", title: `Sắp tới giờ bay · ${nextSafeSlot.time}`, detail: countdown };
  return { tone: "warning", title: "UAV đang chờ tại trạm", detail: "Chưa có slot TAKE_OFF an toàn trong forecast" };
}

function WeatherChart({ forecast }) {
  const temperatures = forecast.map((slot) => slot.temperature);
  const min = Math.floor(Math.min(...temperatures) - 1);
  const max = Math.ceil(Math.max(...temperatures) + 1);
  const range = Math.max(max - min, 1);
  const width = 550;
  const points = forecast.map((slot, index) => `${index * (width / Math.max(forecast.length - 1, 1))},${115 - ((slot.temperature - min) / range) * 92}`).join(" ");
  return (
    <div className="chart-wrap">
      <div className="chart-labels"><span>{max}°</span><span>{Math.round((max + min) / 2)}°</span><span>{min}°</span></div>
      <svg className="weather-chart" viewBox="0 0 550 140" preserveAspectRatio="none">
        <defs><linearGradient id="chartArea" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#e69952" stopOpacity=".28" /><stop offset="100%" stopColor="#e69952" stopOpacity="0" /></linearGradient></defs>
        {[20, 52, 84, 116].map((y) => <line x1="0" x2="550" y1={y} y2={y} key={y} />)}
        <polygon points={`${points} 550,122 0,122`} fill="url(#chartArea)" /><polyline points={points} fill="none" stroke="#db7c34" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {forecast.map((slot, index) => <circle cx={index * (width / Math.max(forecast.length - 1, 1))} cy={115 - ((slot.temperature - min) / range) * 92} r="4" key={slot.timestamp} />)}
      </svg>
      <div className="chart-times">{forecast.map((slot) => <span key={slot.timestamp}>{slot.time}</span>)}</div>
      <div className="chart-summary"><span><i className="temp-line" /> Nhiệt độ</span><span><Wind size={13} /> Gió mạnh nhất <b>{Math.max(...forecast.map((slot) => slot.wind_speed))} km/h</b></span><span><CloudRain size={13} /> Mưa cao nhất <b>{Math.max(...forecast.map((slot) => slot.rain_probability))}%</b></span></div>
    </div>
  );
}

function DroneIllustration() {
  return (
    <svg className="drone-illustration" viewBox="0 0 124 78" aria-hidden="true">
      <g className="drone-propellers">
        <ellipse cx="24" cy="17" rx="21" ry="6" />
        <ellipse cx="100" cy="17" rx="21" ry="6" />
        <ellipse cx="24" cy="60" rx="21" ry="6" />
        <ellipse cx="100" cy="60" rx="21" ry="6" />
      </g>
      <g className="drone-frame">
        <path d="M35 27 23 18M89 27l12-9M35 51 23 60M89 51l12 9" />
        <circle cx="23" cy="18" r="7" /><circle cx="101" cy="18" r="7" /><circle cx="23" cy="60" r="7" /><circle cx="101" cy="60" r="7" />
        <path d="M48 25h28l12 13-12 14H48L36 38Z" />
        <path d="M53 52h18l-3 10H56Z" />
      </g>
      <circle className="drone-camera" cx="62" cy="39" r="7" />
      <circle className="drone-camera-lens" cx="62" cy="39" r="3" />
    </svg>
  );
}

function MiniBars({ tone }) {
  return <div className={`mini-bars ${tone}`}>{[28, 42, 36, 53, 48, 66, 58, 72, 76, 90].map((height, index) => <i style={{ height: `${height}%` }} key={index} />)}</div>;
}

function MissionModal({ slot, location, onClose, onConfirm }) {
  return (
    <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="mission-modal" initial={{ opacity: 0, scale: .96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: .96, y: 12 }}>
        <button className="modal-close" onClick={onClose}><X size={18} /></button><span className="modal-eyebrow"><Plane size={14} /> Nhiệm vụ mới</span><h2>Lập lịch vận hành UAV</h2><p>Khung giờ được điền từ kết quả tính toán của Agricultural Drone Scheduler.</p>
        <div className="mission-fields">
          <label><span>Điểm giám sát</span><b><MapPin size={15} /> {location.name}</b></label>
          <label><span>Khung giờ cất cánh</span><b><CalendarDays size={15} /> {slot.time} - {slot.end_time}</b></label>
          <label><span>Loại nhiệm vụ</span><select><option>Tưới chính xác</option><option>Phun bảo vệ thực vật</option><option>Trinh sát hình ảnh</option></select></label>
          <label><span>Dynamic flow-rate</span><b><Grid2X2 size={15} /> {slot.dynamic_flow_rate_pct}%</b></label>
        </div>
        <div className="mission-note"><CircleAlert size={16} /><span>Điểm bay {slot.flyability_score}/100. Hệ thống cần kiểm tra lại forecast trước khi cất cánh.</span></div>
        <div className="modal-actions"><button className="outline-btn" onClick={onClose}>Hủy bỏ</button><button className="primary-btn" onClick={onConfirm}><Check size={16} /> Xác nhận lịch bay</button></div>
      </motion.div>
    </motion.div>
  );
}

function LoadingScreen() {
  return <div className="loading-screen"><Plane size={24} /><h2>Đang kết nối Agricultural Drone Scheduler</h2><p>Đọc forecast sạch và chạy Decision Engine...</p></div>;
}

function ErrorScreen({ error, retry }) {
  return <div className="loading-screen error-screen"><CircleAlert size={26} /><h2>Chưa kết nối được backend</h2><p>{error}</p><button className="primary-btn" onClick={retry}><RefreshCw size={15} /> Thử lại</button></div>;
}

export default App;
