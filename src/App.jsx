import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
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
  RotateCcw,
  Route,
  Save,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  ThermometerSun,
  TrendingDown,
  Wind,
  X,
  Zap,
} from "lucide-react";
import { getDashboard, getDecisionConfig, getLocations, resetDecisionConfig, runPipeline, updateDecisionConfig } from "./api/dashboard";

const DroneScene3D = lazy(() => import("./components/DroneScene3D"));

const navItems = [
  { id: "overview", label: "Tổng quan", icon: LayoutDashboard },
  { id: "fields", label: "Điều kiện theo giờ", icon: Map },
  { id: "missions", label: "Lịch vận hành", icon: CalendarDays },
  { id: "rules", label: "Cấu hình rule", icon: SlidersHorizontal },
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

const DAILY_SYNC_KEY = "agriflight:last-daily-sync";

const ruleFields = [
  { key: "max_wind_speed", label: "Gió tối đa", unit: "km/h", min: 1, max: 80, step: 0.5, icon: Wind },
  { key: "max_wind_gust", label: "Gió giật tối đa", unit: "km/h", min: 1, max: 120, step: 0.5, icon: Wind },
  { key: "max_rain_probability", label: "Ngưỡng hoãn bay", unit: "% mưa", min: 0, max: 100, step: 1, icon: CloudRain },
  { key: "return_to_charging_rain_probability", label: "Ngưỡng về trạm", unit: "% mưa", min: 0, max: 100, step: 1, icon: House },
  { key: "max_safe_temperature", label: "Nhiệt độ tối đa", unit: "°C", min: 0, max: 60, step: 0.5, icon: ThermometerSun },
  { key: "max_cloud_cover", label: "Mây tối đa", unit: "%", min: 0, max: 100, step: 1, icon: CloudRain },
  { key: "min_visibility", label: "Tầm nhìn tối thiểu", unit: "m", min: 0, max: 50000, step: 100, icon: Navigation },
];

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
  const [savingRules, setSavingRules] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState("");
  const [pipelineRun, setPipelineRun] = useState(null);
  const [decisionConfig, setDecisionConfig] = useState(null);
  const [ruleForm, setRuleForm] = useState({});

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
      const syncedAt = new Date();
      setLastSyncedAt(syncedAt.toISOString());
      if (showToast) notify("Đã đồng bộ dữ liệu mới nhất từ Agricultural Drone Scheduler.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSyncing(false);
    }
  }, [locationId, notify]);

  const executePipelineRefresh = useCallback(async (showToast = true) => {
    setSyncing(true);
    setError("");
    try {
      if (showToast) notify("Backend đang chạy lại pipeline: fetch → clean → upload. Vui lòng chờ...");
      const pipelinePayload = await runPipeline({ days: 3 });
      setPipelineRun(pipelinePayload);
      window.localStorage.setItem(DAILY_SYNC_KEY, getLocalDateKey());
      await loadDashboard(false);
      if (showToast) notify(`Pipeline đã chạy xong. File mới: ${getFilename(pipelinePayload.clean_path)}.`);
    } catch (requestError) {
      setError(requestError.message);
      notify(`Chạy pipeline thất bại: ${requestError.message}`);
    } finally {
      setSyncing(false);
    }
  }, [loadDashboard, notify]);

  useEffect(() => {
    getLocations().then(setLocations).catch((requestError) => setError(requestError.message));
    getDecisionConfig()
      .then((config) => {
        setDecisionConfig(config);
        setRuleForm(config.thresholds ?? {});
      })
      .catch((requestError) => setError(requestError.message));
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (!dashboard?.decision_config?.thresholds) return;
    setDecisionConfig(dashboard.decision_config);
    setRuleForm(dashboard.decision_config.thresholds);
  }, [dashboard?.decision_config]);

  useEffect(() => {
    let midnightTimeout;

    const refreshIfNewDay = () => {
      if (window.localStorage.getItem(DAILY_SYNC_KEY) !== getLocalDateKey()) {
        executePipelineRefresh(false);
      }
    };

    const scheduleMidnightSync = () => {
      midnightTimeout = window.setTimeout(() => {
        refreshIfNewDay();
        scheduleMidnightSync();
      }, getMsUntilNextLocalDay());
    };

    refreshIfNewDay();
    scheduleMidnightSync();
    const wakeupCheck = window.setInterval(refreshIfNewDay, 5 * 60 * 1000);

    return () => {
      window.clearTimeout(midnightTimeout);
      window.clearInterval(wakeupCheck);
    };
  }, [executePipelineRefresh]);

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
  const analytics = useMemo(() => buildDashboardAnalytics(dashboard), [dashboard]);
  const operationTile = timelineTiles.find((tile) => tile.timestamp === operationTimestamp) ?? current;
  const operationAction = actionConfig[operationTile?.decision_action] ?? actionConfig.DELAY_FLIGHT;
  const nextSafeSlot = timelineTiles.find((tile) => tile.schedule_eligible) ?? slots.find((tile) => tile.schedule_eligible);
  const isAirborne = droneState !== "DOCKED";
  const canControlFlight = droneState === "FLYING" || droneState === "SPRAYING";
  const weatherUnsafe = operationTile?.decision_action !== "TAKE_OFF";
  const isSpraying = droneState === "SPRAYING" && !sprayLocked;
  const countdown = formatCountdown(dashboard?.source.reference_time, nextSafeSlot?.timestamp);
  const sceneWeather = getSceneWeather(operationTile);
  const sceneStatus = getSceneStatus({ droneState, nextSafeSlot, countdown, weatherUnsafe, sprayLocked });
  const pipelineStatus = syncing
    ? "Backend đang chạy pipeline..."
    : pipelineRun
      ? `Pipeline mới: ${getFilename(pipelineRun.clean_path)}`
      : "Pipeline sẵn sàng chạy lại";
  const notificationItems = useMemo(
    () => buildRealNotifications({ dashboard, pipelineRun, syncing, lastSyncedAt }),
    [dashboard, pipelineRun, syncing, lastSyncedAt],
  );
  const notificationAlertCount = notificationItems.filter((item) => item.tone === "danger" || item.tone === "warning").length;
  const recentActivity = useMemo(() => {
    if (!dashboard || !current) return [];
    return [
      { time: current.time, title: action.title, detail: `${dashboard.location.name}: ${translateWeatherDescription(current.weather_description)}`, tone: action.tone === "healthy" ? "success" : "warning" },
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

  const selectForecastTime = (slot) => {
    setOperationTimestamp(slot.timestamp);
    const recommendedIndex = slots.findIndex((recommendedSlot) => recommendedSlot.timestamp === slot.timestamp);
    if (recommendedIndex >= 0) setSelectedSlot(recommendedIndex);
    if (isAirborne && slot.decision_action !== "TAKE_OFF") {
      notify(`Cảnh báo: thời tiết lúc ${slot.time} chuyển xấu khi UAV đang hoạt động.`);
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

  const updateRuleField = (key, value) => {
    setRuleForm((currentForm) => ({ ...currentForm, [key]: value }));
  };

  const buildRulePayload = () => ({
    thresholds: ruleFields.reduce((payload, field) => {
      payload[field.key] = Number(ruleForm[field.key]);
      return payload;
    }, {}),
    unsafe_weather_codes: decisionConfig?.unsafe_weather_codes ?? [],
  });

  const saveDecisionRules = async () => {
    setSavingRules(true);
    setError("");
    try {
      const updatedConfig = await updateDecisionConfig(buildRulePayload());
      setDecisionConfig(updatedConfig);
      setRuleForm(updatedConfig.thresholds ?? {});
      await loadDashboard(false);
      notify("Đã lưu cấu hình rule và tính lại dashboard.");
    } catch (requestError) {
      setError(requestError.message);
      notify(`Lưu rule thất bại: ${requestError.message}`);
    } finally {
      setSavingRules(false);
    }
  };

  const resetDecisionRules = async () => {
    setSavingRules(true);
    setError("");
    try {
      const defaultConfig = await resetDecisionConfig();
      setDecisionConfig(defaultConfig);
      setRuleForm(defaultConfig.thresholds ?? {});
      await loadDashboard(false);
      notify("Đã đưa rule về mặc định backend.");
    } catch (requestError) {
      setError(requestError.message);
      notify(`Reset rule thất bại: ${requestError.message}`);
    } finally {
      setSavingRules(false);
    }
  };

  if (!dashboard && error) {
    return <ErrorScreen error={error} retry={() => loadDashboard()} />;
  }

  if (!dashboard) {
    return <LoadingScreen />;
  }

  const visibilityText = formatVisibility(current.visibility);
  const weatherDescription = translateWeatherDescription(current.weather_description);
  const precipitationText = current.precipitation > 0
    ? `Lượng mưa ${formatNumber(current.precipitation)} mm`
    : "Chưa ghi nhận mưa";
  const weatherMetrics = [
    { label: "Nhiệt độ", value: current.temperature, unit: "°C", icon: ThermometerSun, tone: "orange", note: weatherDescription },
    { label: "Tốc độ gió", value: current.wind_speed, unit: " km/h", icon: Wind, tone: "blue", note: `Gió giật ${formatNumber(current.wind_gust)} km/h` },
    { label: "Độ ẩm", value: current.humidity, unit: "%", icon: Droplets, tone: "cyan", note: `Mây ${formatNumber(current.cloud_cover)}% · Tầm nhìn ${visibilityText}` },
    { label: "Khả năng mưa", value: current.rain_probability, unit: "%", icon: CloudRain, tone: "purple", note: precipitationText },
  ];
  const activeDecisionConfig = decisionConfig ?? dashboard.decision_config;
  const ruleSourceLabel = activeDecisionConfig?.source === "file" ? "FE cấu hình" : "Mặc định backend";
  const unsafeWeatherCodeCount = activeDecisionConfig?.unsafe_weather_codes?.length ?? 0;

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
              <button className="icon-btn notification-btn" onClick={() => setNotificationOpen(!notificationOpen)} aria-label={`Mở ${notificationItems.length} thông báo dữ liệu thật`}>
                <Bell size={18} />
                {notificationAlertCount > 0 && <i>{notificationAlertCount > 9 ? "9+" : notificationAlertCount}</i>}
              </button>
              <AnimatePresence>
                {notificationOpen && (
                  <motion.div className="notification-popover" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                    <div className="notification-head">
                      <b>Thông báo dữ liệu thật</b>
                      <span>{dashboard.location.name}</span>
                    </div>
                    <div className="notification-list">
                      {notificationItems.map(({ id, icon: Icon, title, detail, time, tone }) => (
                        <div className={`notification-item ${tone}`} key={id}>
                          <span className="notification-icon"><Icon size={14} /></span>
                          <div>
                            <strong>{title}</strong>
                            <small>{detail}</small>
                            {time && <em>{time}</em>}
                          </div>
                        </div>
                      ))}
                    </div>
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
            <span>Cập nhật: {formatDateTime(dashboard.source.updated_at)}</span>
            <span>{pipelineStatus}</span>
            <button className="outline-btn" disabled={syncing} onClick={() => executePipelineRefresh(true)}><RefreshCw className={syncing ? "spin" : ""} size={15} /> {syncing ? "Đang chạy pipeline" : "Chạy lại dữ liệu"}</button>
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
              <div className="metric-heading"><span>{label}</span><small className={current.risk_level === "LOW" ? "stable" : ""}>{translateRiskLevel(current.risk_level)}</small></div>
              <strong>{value}<em>{unit}</em></strong><p>{note}</p>
            </motion.article>
          ))}
        </section>

        <section className="panel rule-config-panel" id="rules">
          <PanelHeading
            eyebrow="Dynamic rule config"
            title="Cấu hình ngưỡng quyết định từ FrontEnd"
            action={<span className="source-pill">{ruleSourceLabel}</span>}
          />
          <div className="rule-config-body">
            <div className="rule-config-copy">
              <span><SlidersHorizontal size={15} /> Rule engine đang dùng config động</span>
              <p>Thay đổi các ngưỡng bên dưới rồi lưu để backend tính lại action, điểm bay và slot đề xuất từ forecast hiện tại.</p>
              <div className="rule-config-meta">
                <b>{unsafeWeatherCodeCount}</b><small>mã thời tiết nguy hiểm</small>
                <b>{formatDateTime(activeDecisionConfig?.updated_at) || "--"}</b><small>lần cập nhật config</small>
              </div>
            </div>
            <div className="rule-form-grid">
              {ruleFields.map(({ key, label, unit, min, max, step, icon: Icon }) => (
                <label className="rule-input" key={key}>
                  <span><Icon size={13} />{label}</span>
                  <div>
                    <input
                      type="number"
                      min={min}
                      max={max}
                      step={step}
                      value={ruleForm[key] ?? ""}
                      onChange={(event) => updateRuleField(key, event.target.value)}
                    />
                    <em>{unit}</em>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <div className="rule-config-actions">
            <button className="outline-btn" disabled={savingRules} onClick={resetDecisionRules}><RotateCcw size={15} /> Về mặc định</button>
            <button className="primary-btn" disabled={savingRules} onClick={saveDecisionRules}><Save size={15} /> {savingRules ? "Đang lưu" : "Lưu và tính lại"}</button>
          </div>
        </section>

        <section className="content-grid">
          <article className="panel weather-panel">
            <PanelHeading eyebrow="WeatherAPI forecast" title={`Xu hướng vi khí hậu · ${dashboard.location.name}`} action={<span className="source-pill">{current.time}</span>} />
            <WeatherChart forecast={dashboard.forecast} selectedTimestamp={operationTimestamp} onSelect={selectForecastTime} />
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
            <PanelHeading eyebrow="Digital twin · WeatherAPI → Decision Engine" title={`Mô phỏng vận hành 3D · ${dashboard.location.name}`} action={<span className="simulation-live"><i /> 3D tương tác</span>} />
            <Suspense fallback={<div className="field-map three-field-map three-loading">Đang tải mô phỏng 3D...</div>}>
              <DroneScene3D
                weather={sceneWeather}
                droneState={droneState}
                isAirborne={isAirborne}
                isSpraying={isSpraying}
                location={dashboard.location}
                operationTile={operationTile}
                onOpenDrone={() => setDroneOpen(true)}
              >
                <div className={`scene-weather weather-${sceneWeather.type}`}>
                  {sceneWeather.type === "rain" ? <CloudRain size={14} /> : sceneWeather.type === "wind" ? <Wind size={14} /> : sceneWeather.type === "heat" ? <ThermometerSun size={14} /> : <Check size={14} />}
                  <span>{sceneWeather.label}</span>
                  <Wind size={14} /><span>{operationTile.wind_speed} km/h</span>
                </div>
                <div className={`scene-status-banner ${sceneStatus.tone}`}><Clock3 size={14} /><span><b>{sceneStatus.title}</b><small>{sceneStatus.detail}</small></span></div>
                <button className="drone-open-chip" onClick={() => setDroneOpen(true)}><Radio size={13} /> UAV-01 · {droneStateConfig[droneState].label}</button>
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
                      <p className="simulation-hint">Kéo trên bản đồ để xoay góc nhìn, cuộn để zoom. Click UAV trong scene để mở telemetry.</p>
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
              </DroneScene3D>
            </Suspense>
            <div className="map-footer">
              <div className="map-legend"><span className="legend healthy" />Có thể bay <span className="legend stress" />Nên hoãn <span className="legend dry" />Khóa phun / về trạm</div>
              <span className="data-note">Mô phỏng 3D · Google Maps theo tọa độ · {timelineTiles.length} giờ dự báo</span>
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
          <div className="section-heading">
            <div><span>Dữ liệu thật từ BackEnd</span><h2>Số liệu và biểu đồ quyết định mới nhất</h2></div>
            <button className="outline-btn" disabled={syncing} onClick={() => executePipelineRefresh(true)}><RefreshCw className={syncing ? "spin" : ""} size={15} /> {syncing ? "Đang chạy" : "Chạy lại"}</button>
          </div>
          <RealDataDashboard analytics={analytics} source={dashboard.source} lastSyncedAt={lastSyncedAt} pipelineRun={pipelineRun} />
          <div className="section-heading kpi-heading"><div><span>Backtesting report</span><h2>KPI mô phỏng của Decision Engine</h2></div><button className="outline-btn" onClick={() => notify("KPI lấy từ reports/backtesting_summary.json")}><Gauge size={15} /> Nguồn báo cáo thật</button></div>
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
        {missionOpen && canSchedule && (
          <MissionModal
            slot={selectedRecommendedSlot}
            slots={slots}
            selectedSlot={selectedSlot}
            onSelectSlot={(index) => setSelectedSlot(index)}
            location={dashboard.location}
            onClose={() => setMissionOpen(false)}
            onConfirm={() => { setMissionOpen(false); notify(`Đã tạo lịch vận hành UAV lúc ${selectedRecommendedSlot.time}.`); }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>{toast && <motion.div className="toast" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}><Check size={16} />{toast}</motion.div>}</AnimatePresence>
    </div>
  );
}

function PanelHeading({ eyebrow, title, action }) {
  return <div className="panel-heading"><div><span>{eyebrow}</span><h2>{title}</h2></div>{action}</div>;
}

function RealDataDashboard({ analytics, source, lastSyncedAt, pipelineRun }) {
  return (
    <div className="real-data-stack">
      <div className="real-summary-grid">
        {analytics.summary.map((item) => (
          <motion.article className="real-summary-card" key={item.label} whileHover={{ y: -4 }} whileTap={{ scale: .99 }}>
            <span>{item.label}</span>
            <strong>{item.value}<em>{item.suffix}</em></strong>
            <small>{item.note}</small>
          </motion.article>
        ))}
      </div>
      <div className="chart-grid analytics-charts">
        <motion.article className="panel chart-panel interactive-panel" whileHover={{ y: -4 }} whileTap={{ scale: .995 }}>
          <PanelHeading eyebrow="Biểu đồ cột" title="Xác suất mưa theo giờ" action={<span className="source-pill">{analytics.rows.length} mốc</span>} />
          <VerticalBarChart data={analytics.rows} valueKey="rain_probability" suffix="%" color="#4f8ca9" />
        </motion.article>
        <motion.article className="panel chart-panel interactive-panel" whileHover={{ y: -4 }} whileTap={{ scale: .995 }}>
          <PanelHeading eyebrow="Biểu đồ ngang" title="Điểm bay từng khung giờ" action={<Sparkles size={17} className="sparkle" />} />
          <HorizontalBarChart data={analytics.rows} valueKey="flyability_score" suffix="/100" />
        </motion.article>
        <motion.article className="panel chart-panel interactive-panel" whileHover={{ y: -4 }} whileTap={{ scale: .995 }}>
          <PanelHeading eyebrow="Biểu đồ đường" title="Nhiệt độ forecast trong ngày" action={<ThermometerSun size={17} className="sparkle" />} />
          <LineTrendChart data={analytics.rows} valueKey="temperature" suffix="°C" />
        </motion.article>
        <motion.article className="panel chart-panel interactive-panel" whileHover={{ y: -4 }} whileTap={{ scale: .995 }}>
          <PanelHeading eyebrow="Biểu đồ tròn" title="Tỷ trọng quyết định" action={<span className="source-pill">{source.dataset}</span>} />
          <DecisionDonutChart segments={analytics.actionSegments} />
        </motion.article>
      </div>
      <div className="data-freshness">
        <span><Radio size={13} /> Reference time: <b>{formatDateTime(source.reference_time)}</b></span>
        <span><Clock3 size={13} /> FE đồng bộ lần cuối: <b>{formatDateTime(lastSyncedAt)}</b></span>
        {pipelineRun && <span><Check size={13} /> Pipeline gần nhất: <b>{getFilename(pipelineRun.clean_path)}</b></span>}
        <span><RefreshCw size={13} /> Tự chạy lại 1 lần khi sang ngày mới</span>
      </div>
      {pipelineRun?.steps?.length > 0 && (
        <div className="pipeline-steps">
          {pipelineRun.steps.map((step, index) => (
            <span className={`pipeline-step ${step.status}`} key={step.name}>
              <b>{index + 1}</b>
              {formatPipelineStep(step)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function VerticalBarChart({ data, valueKey, suffix, color }) {
  const [activeIndex, setActiveIndex] = useState(null);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const maxValue = Math.max(...data.map((item) => Number(item[valueKey]) || 0), 1);
  const activeItem = activeIndex === null ? null : data[activeIndex];
  const handlePointerMove = (event) => {
    if (!data.length) return;
    setActiveIndex(getPointerIndex(event, data.length));
  };

  return (
    <div
      className={`bar-chart interactive-chart ${isScrubbing ? "scrubbing" : ""}`}
      onPointerDown={(event) => { setIsScrubbing(true); handlePointerMove(event); }}
      onPointerMove={handlePointerMove}
      onPointerUp={() => setIsScrubbing(false)}
      onPointerLeave={() => { setActiveIndex(null); setIsScrubbing(false); }}
    >
      {data.map((item, index) => {
        const value = Number(item[valueKey]) || 0;
        return (
          <div className={`bar-column ${activeIndex === index ? "active" : ""}`} onPointerEnter={() => setActiveIndex(index)} key={item.timestamp}>
            <b>{formatNumber(value)}{suffix}</b>
            <span style={{ height: `${Math.max((value / maxValue) * 100, 3)}%`, background: color }} />
            <small>{item.time}</small>
          </div>
        );
      })}
      {activeItem && (
        <div className="chart-tooltip" style={{ left: `${getTooltipLeft(activeIndex, data.length)}%` }}>
          <b>{activeItem.time}</b>
          <span>{formatNumber(activeItem[valueKey])}{suffix} mưa</span>
          <small>{actionConfig[activeItem.decision_action]?.short ?? activeItem.decision_action}</small>
        </div>
      )}
    </div>
  );
}

function HorizontalBarChart({ data, valueKey, suffix }) {
  const [activeIndex, setActiveIndex] = useState(null);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const activeItem = activeIndex === null ? null : data[activeIndex];
  const handlePointerMove = (event) => {
    if (!data.length) return;
    setActiveIndex(getPointerIndexByY(event, data.length));
  };

  return (
    <div
      className={`horizontal-bars interactive-chart ${isScrubbing ? "scrubbing" : ""}`}
      onPointerDown={(event) => { setIsScrubbing(true); handlePointerMove(event); }}
      onPointerMove={(event) => { if (isScrubbing) handlePointerMove(event); }}
      onPointerUp={() => setIsScrubbing(false)}
      onPointerLeave={() => { setActiveIndex(null); setIsScrubbing(false); }}
    >
      {data.map((item, index) => {
        const value = Number(item[valueKey]) || 0;
        const tone = actionConfig[item.decision_action]?.tone ?? "stress";
        return (
          <div className={`horizontal-row ${tone} ${activeIndex === index ? "active" : ""}`} onPointerEnter={() => setActiveIndex(index)} key={item.timestamp}>
            <span>{item.time}</span>
            <div><i style={{ width: `${clamp(value, 0, 100)}%` }} /></div>
            <b>{formatNumber(value)}{suffix}</b>
          </div>
        );
      })}
      {activeItem && (
        <div className="horizontal-tooltip">
          <b>{activeItem.time}</b>
          <span>{formatNumber(activeItem[valueKey])}{suffix}</span>
          <small>{actionConfig[activeItem.decision_action]?.title ?? activeItem.decision_action}</small>
        </div>
      )}
    </div>
  );
}

function LineTrendChart({ data, valueKey, suffix }) {
  const [activeIndex, setActiveIndex] = useState(null);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const values = data.map((item) => Number(item[valueKey]) || 0);
  if (!values.length) {
    return <div className="empty-chart">Chưa có dữ liệu forecast để vẽ biểu đồ.</div>;
  }
  const min = Math.floor(Math.min(...values, 0));
  const max = Math.ceil(Math.max(...values, 1));
  const range = Math.max(max - min, 1);
  const width = 520;
  const step = width / Math.max(values.length - 1, 1);
  const points = values.map((value, index) => `${index * step},${112 - ((value - min) / range) * 88}`).join(" ");
  const activeValue = activeIndex === null ? null : values[activeIndex];
  const activeX = activeIndex === null ? 0 : activeIndex * step;
  const activeY = activeValue === null ? 0 : 112 - ((activeValue - min) / range) * 88;
  const activeItem = activeIndex === null ? null : data[activeIndex];
  const handlePointerMove = (event) => {
    if (!data.length) return;
    setActiveIndex(getPointerIndex(event, data.length));
  };

  return (
    <div
      className={`line-chart interactive-chart ${isScrubbing ? "scrubbing" : ""}`}
      onPointerDown={(event) => { setIsScrubbing(true); handlePointerMove(event); }}
      onPointerMove={handlePointerMove}
      onPointerUp={() => setIsScrubbing(false)}
      onPointerLeave={() => { setActiveIndex(null); setIsScrubbing(false); }}
    >
      <svg viewBox="0 0 520 136" preserveAspectRatio="none">
        {[24, 56, 88, 120].map((y) => <line x1="0" x2="520" y1={y} y2={y} key={y} />)}
        {activeItem && <line className="line-guide" x1={activeX} x2={activeX} y1="18" y2="123" />}
        <polyline points={points} fill="none" stroke="#db7c34" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {values.map((value, index) => <circle className={activeIndex === index ? "active" : ""} cx={index * step} cy={112 - ((value - min) / range) * 88} r={activeIndex === index ? "6" : "4"} key={`${data[index]?.timestamp}-${value}`} />)}
        {activeItem && <circle className="line-pulse" cx={activeX} cy={activeY} r="10" />}
      </svg>
      {activeItem && (
        <div className="chart-tooltip line-tooltip" style={{ left: `${getTooltipLeft(activeIndex, data.length)}%` }}>
          <b>{activeItem.time}</b>
          <span>{formatNumber(activeValue)}{suffix}</span>
          <small>Gió {formatNumber(activeItem.wind_speed)} km/h · Mưa {formatNumber(activeItem.rain_probability)}%</small>
        </div>
      )}
      <div className="line-chart-meta">
        <span>Thấp nhất <b>{formatNumber(Math.min(...values))}{suffix}</b></span>
        <span>Cao nhất <b>{formatNumber(Math.max(...values))}{suffix}</b></span>
        <span>Trung bình <b>{formatNumber(average(values))}{suffix}</b></span>
      </div>
    </div>
  );
}

function DecisionDonutChart({ segments }) {
  const [activeKey, setActiveKey] = useState("");
  const gradient = buildDecisionGradient(segments);
  const total = segments.reduce((sum, segment) => sum + segment.count, 0);
  const activeSegment = segments.find((segment) => segment.key === activeKey);
  return (
    <div className="donut-chart-wrap interactive-chart">
      <motion.div className={`donut-chart ${activeSegment ? "active" : ""}`} style={{ background: gradient }} whileHover={{ scale: 1.04 }} whileTap={{ scale: .97 }}>
        <span><b>{total}</b><small>quyết định</small></span>
      </motion.div>
      <div className="donut-legend">
        {segments.map((segment) => (
          <span className={activeKey === segment.key ? "active" : ""} onPointerEnter={() => setActiveKey(segment.key)} onPointerLeave={() => setActiveKey("")} key={segment.key}><i style={{ background: segment.color }} /> {segment.label} <b>{segment.count}</b></span>
        ))}
      </div>
      {activeSegment && <div className="donut-tooltip"><b>{activeSegment.label}</b><span>{activeSegment.count}/{total} quyết định</span></div>}
    </div>
  );
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

function buildRealNotifications({ dashboard, pipelineRun, syncing, lastSyncedAt }) {
  if (!dashboard?.current) return [];

  const current = dashboard.current;
  const forecast = dashboard.forecast ?? [];
  const recommendedSlots = dashboard.recommended_slots ?? [];
  const action = actionConfig[current.decision_action] ?? actionConfig.DELAY_FLIGHT;
  const notifications = [
    {
      id: `decision-${current.timestamp}`,
      icon: current.decision_action === "TAKE_OFF" ? Check : ShieldAlert,
      tone: current.decision_action === "TAKE_OFF" ? "success" : "warning",
      title: action.title,
      detail: `${dashboard.location.name}: điểm bay ${formatNumber(current.flyability_score)}/100, rủi ro ${translateRiskLevel(current.risk_level).toLowerCase()}.`,
      time: current.time,
    },
  ];

  if (current.wind_speed > 20 || current.wind_gust > 28 || current.decision_action === "LOCK_SPRAY") {
    notifications.push({
      id: `wind-${current.timestamp}`,
      icon: Wind,
      tone: "danger",
      title: "Gió vượt ngưỡng vận hành",
      detail: `Gió ${formatNumber(current.wind_speed)} km/h, gió giật ${formatNumber(current.wind_gust)} km/h. Ngưỡng an toàn: 20/28 km/h.`,
      time: current.time,
    });
  }

  if (current.precipitation > 0 || current.rain_probability > 30 || current.decision_action === "RETURN_TO_CHARGING") {
    notifications.push({
      id: `rain-${current.timestamp}`,
      icon: CloudRain,
      tone: current.precipitation > 0 || current.rain_probability > 60 ? "danger" : "warning",
      title: "Rủi ro mưa trong forecast",
      detail: `Xác suất mưa ${formatNumber(current.rain_probability)}%, lượng mưa ${formatNumber(current.precipitation)} mm.`,
      time: current.time,
    });
  }

  if (current.temperature > 35) {
    notifications.push({
      id: `temp-${current.timestamp}`,
      icon: ThermometerSun,
      tone: "warning",
      title: "Nhiệt độ cao",
      detail: `Nhiệt độ hiện tại ${formatNumber(current.temperature)}°C, vượt ngưỡng khuyến nghị 35°C.`,
      time: current.time,
    });
  }

  const riskySlots = forecast.filter((slot) => slot.decision_action !== "TAKE_OFF");
  if (riskySlots.length > 0) {
    const firstRiskySlot = riskySlots[0];
    notifications.push({
      id: `risk-window-${firstRiskySlot.timestamp}`,
      icon: CircleAlert,
      tone: riskySlots.length >= Math.ceil(forecast.length / 2) ? "danger" : "warning",
      title: `${riskySlots.length}/${forecast.length} mốc không an toàn`,
      detail: `Mốc đầu tiên: ${firstRiskySlot.time} - ${actionConfig[firstRiskySlot.decision_action]?.short ?? firstRiskySlot.decision_action}.`,
      time: firstRiskySlot.time,
    });
  }

  const safeSlot = recommendedSlots.find((slot) => slot.schedule_eligible);
  notifications.push({
    id: safeSlot ? `safe-${safeSlot.timestamp}` : "safe-missing",
    icon: safeSlot ? CalendarDays : Lock,
    tone: safeSlot ? "success" : "danger",
    title: safeSlot ? "Có slot TAKE_OFF đề xuất" : "Chưa có slot TAKE_OFF",
    detail: safeSlot
      ? `${safeSlot.time} - ${safeSlot.end_time}, điểm bay ${formatNumber(safeSlot.flyability_score)}/100.`
      : "Decision Engine chưa tìm thấy khung giờ đủ an toàn trong dữ liệu hiện tại.",
    time: safeSlot?.time ?? current.time,
  });

  notifications.push({
    id: syncing ? "pipeline-running" : `source-${dashboard.source.updated_at}`,
    icon: syncing ? RefreshCw : Radio,
    tone: syncing ? "info" : "success",
    title: syncing ? "Pipeline đang đồng bộ" : "Nguồn dữ liệu đã sẵn sàng",
    detail: syncing
      ? "Backend đang fetch, clean và upload forecast mới."
      : `${dashboard.source.dataset} · cập nhật ${formatDateTime(dashboard.source.updated_at)}.`,
    time: lastSyncedAt ? `FE: ${formatDateTime(lastSyncedAt)}` : "",
  });

  if (pipelineRun?.clean_path) {
    notifications.push({
      id: `pipeline-${pipelineRun.clean_path}`,
      icon: Check,
      tone: "success",
      title: "Pipeline gần nhất hoàn tất",
      detail: `File clean mới: ${getFilename(pipelineRun.clean_path)}.`,
      time: "",
    });
  }

  return notifications.slice(0, 7);
}

function getSceneWeather(slot) {
  if (!slot) return { type: "clear", label: "Điều kiện ổn định" };

  const rainProbability = Number(slot.rain_probability) || 0;
  const precipitation = Number(slot.precipitation) || 0;
  const windSpeed = Number(slot.wind_speed) || 0;
  const windGust = Number(slot.wind_gust) || 0;
  const temperature = Number(slot.temperature) || 0;
  const description = `${slot.weather_description ?? ""}`.toLowerCase();
  const isRainyDescription = /rain|drizzle|thunder|storm|mưa|giông|dông/.test(description);

  if (precipitation > 0 || rainProbability >= 65 || isRainyDescription) {
    return { type: "rain", label: precipitation > 0 ? `Mưa ${precipitation} mm` : `Nguy cơ mưa ${rainProbability}%` };
  }
  if (windSpeed > 20 || windGust > 28 || slot.decision_action === "LOCK_SPRAY") {
    return { type: "wind", label: "Gió mạnh" };
  }
  if (temperature > 35) {
    return { type: "heat", label: `Nắng nóng ${temperature}°C` };
  }
  return { type: "clear", label: `Ổn định ${temperature}°C` };
}

function buildDashboardAnalytics(dashboard) {
  const rows = (dashboard?.timeline_tiles?.length ? dashboard.timeline_tiles : dashboard?.forecast ?? []).slice(0, 12);
  const scores = rows.map((row) => Number(row.flyability_score) || 0);
  const winds = rows.map((row) => Number(row.wind_speed) || 0);
  const rains = rows.map((row) => Number(row.rain_probability) || 0);
  const temps = rows.map((row) => Number(row.temperature) || 0);
  const safeSlots = rows.filter((row) => row.schedule_eligible).length;
  const actionSegments = buildActionSegments(rows);

  return {
    rows,
    actionSegments,
    summary: [
      { label: "Forecast nhận từ BE", value: rows.length, suffix: " mốc", note: dashboard?.source?.dataset ?? "Đang chờ dữ liệu" },
      { label: "Slot bay an toàn", value: safeSlots, suffix: `/${rows.length}`, note: `${formatNumber((safeSlots / Math.max(rows.length, 1)) * 100)}% khung giờ TAKE_OFF` },
      { label: "Điểm bay trung bình", value: formatNumber(average(scores)), suffix: "/100", note: `Cao nhất ${formatNumber(Math.max(...scores, 0))}/100` },
      { label: "Điều kiện nổi bật", value: formatNumber(Math.max(...rains, 0)), suffix: "% mưa", note: `Gió TB ${formatNumber(average(winds))} km/h · Nhiệt TB ${formatNumber(average(temps))}°C` },
    ],
  };
}

function buildActionSegments(rows) {
  const colors = {
    TAKE_OFF: "#65a875",
    DELAY_FLIGHT: "#dca04c",
    LOCK_SPRAY: "#c56d51",
    RETURN_TO_CHARGING: "#4f8ca9",
  };
  const counts = rows.reduce((totals, row) => {
    totals[row.decision_action] = (totals[row.decision_action] ?? 0) + 1;
    return totals;
  }, {});
  return Object.entries(counts).map(([key, count]) => ({
    key,
    count,
    label: actionConfig[key]?.short ?? key,
    color: colors[key] ?? "#9aa6a2",
  }));
}

function buildDecisionGradient(segments) {
  const total = segments.reduce((sum, segment) => sum + segment.count, 0);
  if (!total) return "conic-gradient(#edf0ed 0deg 360deg)";
  let cursor = 0;
  const stops = segments.map((segment) => {
    const start = cursor;
    cursor += (segment.count / total) * 360;
    return `${segment.color} ${start}deg ${cursor}deg`;
  });
  return `conic-gradient(${stops.join(", ")})`;
}

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getMsUntilNextLocalDay() {
  const now = new Date();
  const nextDay = new Date(now);
  nextDay.setHours(24, 0, 5, 0);
  return Math.max(nextDay.getTime() - now.getTime(), 1000);
}

function formatDateTime(value) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getFilename(path) {
  if (!path) return "--";
  return path.split(/[\\/]/).pop();
}

function formatPipelineStep(step) {
  const labels = {
    fetch_weather: "Lấy WeatherAPI",
    clean_data: "Làm sạch dữ liệu",
    upload_supabase: "Upload Supabase",
  };
  const rows = step.rows ? ` · ${step.rows} dòng` : "";
  const warning = step.status === "warning" ? " · cảnh báo" : "";
  const skipped = step.status === "skipped" ? " · bỏ qua" : "";
  return `${labels[step.name] ?? step.name}${rows}${warning}${skipped}`;
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function formatNumber(value) {
  const rounded = Math.round((Number(value) || 0) * 10) / 10;
  return Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(1);
}

function formatVisibility(value) {
  const meters = Number(value) || 0;
  if (meters >= 1000) return `${formatNumber(meters / 1000)} km`;
  return `${formatNumber(meters)} m`;
}

function translateRiskLevel(level) {
  const labels = {
    LOW: "Thấp",
    MEDIUM: "Trung bình",
    HIGH: "Cao",
  };
  return labels[level] ?? level ?? "--";
}

function translateWeatherDescription(description) {
  if (!description) return "Điều kiện ổn định";
  const key = description.trim().toLowerCase();
  const labels = {
    sunny: "Nắng",
    clear: "Trời quang",
    "partly cloudy": "Có mây rải rác",
    cloudy: "Nhiều mây",
    overcast: "Âm u",
    mist: "Sương mù nhẹ",
    fog: "Sương mù",
    "patchy rain nearby": "Có mưa rải rác gần khu vực",
    "patchy light drizzle": "Mưa phùn nhẹ rải rác",
    "light drizzle": "Mưa phùn nhẹ",
    "patchy light rain": "Mưa nhỏ rải rác",
    "light rain": "Mưa nhỏ",
    "moderate rain": "Mưa vừa",
    "heavy rain": "Mưa lớn",
    "moderate or heavy rain shower": "Mưa rào vừa hoặc lớn",
    "light rain shower": "Mưa rào nhẹ",
    "torrential rain shower": "Mưa rào rất lớn",
    "patchy thunderstorm nearby": "Có dông rải rác gần khu vực",
    "thundery outbreaks nearby": "Có dông gần khu vực",
  };
  if (labels[key]) return labels[key];
  if (key.includes("thunder")) return "Có dông";
  if (key.includes("rain")) return "Có mưa";
  if (key.includes("drizzle")) return "Có mưa phùn";
  if (key.includes("cloud")) return "Có mây";
  if (key.includes("fog") || key.includes("mist")) return "Có sương mù";
  return description;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getPointerIndex(event, count) {
  const rect = event.currentTarget.getBoundingClientRect();
  const progress = clamp((event.clientX - rect.left) / Math.max(rect.width, 1), 0, 1);
  return clamp(Math.round(progress * (count - 1)), 0, count - 1);
}

function getPointerIndexByY(event, count) {
  const rect = event.currentTarget.getBoundingClientRect();
  const progress = clamp((event.clientY - rect.top) / Math.max(rect.height, 1), 0, 1);
  return clamp(Math.round(progress * (count - 1)), 0, count - 1);
}

function getTooltipLeft(index, count) {
  if (index === null || count <= 1) return 0;
  return clamp((index / (count - 1)) * 100, 8, 92);
}

function WeatherChart({ forecast = [], selectedTimestamp, onSelect }) {
  const [previewIndex, setPreviewIndex] = useState(null);
  const [isScrubbing, setIsScrubbing] = useState(false);
  if (!forecast.length) {
    return <div className="empty-chart">Chưa có dữ liệu forecast để vẽ xu hướng khí hậu.</div>;
  }
  const temperatures = forecast.map((slot) => slot.temperature);
  const min = Math.floor(Math.min(...temperatures) - 1);
  const max = Math.ceil(Math.max(...temperatures) + 1);
  const range = Math.max(max - min, 1);
  const width = 550;
  const step = width / Math.max(forecast.length - 1, 1);
  const points = forecast.map((slot, index) => `${index * step},${115 - ((slot.temperature - min) / range) * 92}`).join(" ");
  const selectedIndex = forecast.findIndex((slot) => slot.timestamp === selectedTimestamp);
  const activeIndex = previewIndex ?? (selectedIndex >= 0 ? selectedIndex : null);
  const activeSlot = activeIndex === null ? null : forecast[activeIndex];
  const previewSlot = previewIndex === null ? null : forecast[previewIndex];
  const previewX = previewIndex === null ? 0 : previewIndex * step;
  const previewY = previewSlot ? 115 - ((previewSlot.temperature - min) / range) * 92 : 0;
  const handlePointerMove = (event) => {
    setPreviewIndex(getPointerIndex(event, forecast.length));
  };
  const selectIndex = (index) => {
    const slot = forecast[index];
    if (slot) onSelect?.(slot);
  };

  return (
    <div className="chart-wrap">
      <div className="chart-labels"><span>{max}°</span><span>{Math.round((max + min) / 2)}°</span><span>{min}°</span></div>
      <div
        className={`weather-plot interactive-chart ${isScrubbing ? "scrubbing" : ""}`}
        onPointerDown={(event) => { setIsScrubbing(true); handlePointerMove(event); }}
        onPointerMove={handlePointerMove}
        onPointerUp={(event) => { const nextIndex = getPointerIndex(event, forecast.length); setPreviewIndex(nextIndex); selectIndex(nextIndex); setIsScrubbing(false); }}
        onPointerCancel={() => { setPreviewIndex(null); setIsScrubbing(false); }}
        onPointerLeave={() => { setPreviewIndex(null); setIsScrubbing(false); }}
      >
        <svg className="weather-chart" viewBox="0 0 550 140" preserveAspectRatio="none">
          <defs><linearGradient id="chartArea" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#e69952" stopOpacity=".28" /><stop offset="100%" stopColor="#e69952" stopOpacity="0" /></linearGradient></defs>
          {[20, 52, 84, 116].map((y) => <line x1="0" x2="550" y1={y} y2={y} key={y} />)}
          {previewSlot && <line className="line-guide" x1={previewX} x2={previewX} y1="16" y2="124" />}
          <polygon points={`${points} 550,122 0,122`} fill="url(#chartArea)" /><polyline points={points} fill="none" stroke="#db7c34" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          {forecast.map((slot, index) => <circle className={activeIndex === index ? "active" : ""} cx={index * step} cy={115 - ((slot.temperature - min) / range) * 92} r={activeIndex === index ? "6" : "4"} key={slot.timestamp} />)}
          {previewSlot && <circle className="line-pulse" cx={previewX} cy={previewY} r="10" />}
        </svg>
      </div>
      <div className="chart-times">
        {forecast.map((slot, index) => (
          <button className={activeIndex === index ? "active" : ""} onClick={() => selectIndex(index)} key={slot.timestamp}>
            {slot.time}
          </button>
        ))}
      </div>
      {activeSlot && (
        <div className="weather-readout">
          <b>{activeSlot.time}</b>
          <span>{formatNumber(activeSlot.temperature)}°C</span>
          <span><Wind size={12} /> Gió {formatNumber(activeSlot.wind_speed)} km/h</span>
          <span><CloudRain size={12} /> Mưa {formatNumber(activeSlot.rain_probability)}%</span>
        </div>
      )}
      <div className="chart-summary"><span><i className="temp-line" /> Nhiệt độ</span><span><Wind size={13} /> Gió mạnh nhất <b>{Math.max(...forecast.map((slot) => slot.wind_speed))} km/h</b></span><span><CloudRain size={13} /> Mưa cao nhất <b>{Math.max(...forecast.map((slot) => slot.rain_probability))}%</b></span></div>
    </div>
  );
}

function MiniBars({ tone }) {
  return <div className={`mini-bars ${tone}`}>{[28, 42, 36, 53, 48, 66, 58, 72, 76, 90].map((height, index) => <i style={{ height: `${height}%` }} key={index} />)}</div>;
}

function MissionModal({ slot, slots, selectedSlot, onSelectSlot, location, onClose, onConfirm }) {
  return (
    <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="mission-modal" initial={{ opacity: 0, scale: .96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: .96, y: 12 }}>
        <button className="modal-close" onClick={onClose}><X size={18} /></button><span className="modal-eyebrow"><Plane size={14} /> Nhiệm vụ mới</span><h2>Lập lịch vận hành UAV</h2><p>Khung giờ được điền từ kết quả tính toán của Agricultural Drone Scheduler.</p>
        <div className="mission-fields">
          <label><span>Điểm giám sát</span><b><MapPin size={15} /> {location.name}</b></label>
          <label>
            <span>Khung giờ cất cánh</span>
            <select className="mission-slot-select" value={selectedSlot} onChange={(event) => onSelectSlot(Number(event.target.value))}>
              {slots.map((candidate, index) => (
                <option value={index} disabled={!candidate.schedule_eligible} key={candidate.timestamp}>
                  {candidate.time} - {candidate.end_time} · {formatNumber(candidate.flyability_score)}/100
                </option>
              ))}
            </select>
          </label>
          <label><span>Loại nhiệm vụ</span><select><option>Tưới chính xác</option><option>Phun bảo vệ thực vật</option><option>Trinh sát hình ảnh</option></select></label>
          <label><span>Dynamic flow-rate</span><b><Grid2X2 size={15} /> {slot.dynamic_flow_rate_pct}%</b></label>
        </div>
        <div className="mission-note"><CircleAlert size={16} /><span>Đang chọn {slot.time} - {slot.end_time}, điểm bay {slot.flyability_score}/100. Hệ thống cần kiểm tra lại forecast trước khi cất cánh.</span></div>
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
