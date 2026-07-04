export const DAILY_SYNC_KEY = "agriflight:last-daily-sync";

export const actionConfig = {
  FLY: {
    title: "Có thể cất cánh",
    short: "Cất cánh",
    risk: "Thấp",
    tone: "healthy",
    description: "Điều kiện thời tiết nằm trong ngưỡng vận hành. UAV có thể thực hiện nhiệm vụ theo kế hoạch.",
  },
  DELAY: {
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
  NO_FLY: {
    title: "Đưa UAV về trạm sạc",
    short: "Về trạm sạc",
    risk: "Cao",
    tone: "dry",
    description: "Mưa hoặc thời tiết nguy hiểm đang hiện diện. UAV cần quay về trạm sạc để bảo vệ thiết bị.",
  },
};

export const droneStateConfig = {
  DOCKED: { label: "Đang ở trạm", short: "Sẵn sàng tại Dock 01" },
  FLYING: { label: "Đang bay giám sát", short: "Telemetry đang truyền trực tiếp" },
  SPRAYING: { label: "Đang phun thuốc", short: "Vòi phun đang hoạt động" },
  RETURNING: { label: "Đang quay về trạm", short: "Đang điều hướng về Dock 01" },
};

export const ruleFields = [
  { key: "max_wind_speed", label: "Gió tối đa", unit: "km/h", min: 1, max: 80, step: 0.5, icon: "air" },
  { key: "max_wind_gust", label: "Gió giật tối đa", unit: "km/h", min: 1, max: 120, step: 0.5, icon: "cyclone" },
  { key: "max_rain_probability", label: "Ngưỡng hoãn bay", unit: "% mưa", min: 0, max: 100, step: 1, icon: "weather_mix" },
  { key: "return_to_charging_rain_probability", label: "Ngưỡng về trạm", unit: "% mưa", min: 0, max: 100, step: 1, icon: "home" },
  { key: "max_safe_temperature", label: "Nhiệt độ tối đa", unit: "°C", min: 0, max: 60, step: 0.5, icon: "device_thermostat" },
  { key: "max_cloud_cover", label: "Mây tối đa", unit: "%", min: 0, max: 100, step: 1, icon: "cloud" },
  { key: "min_visibility", label: "Tầm nhìn tối thiểu", unit: "m", min: 0, max: 50000, step: 100, icon: "visibility" },
];

export function translateRiskLevel(risk) {
  if (risk === "LOW") return "Thấp";
  if (risk === "MEDIUM") return "Trung bình";
  if (risk === "HIGH") return "Cao";
  return risk || "Chưa rõ";
}

export function getDecisionAction(slot) {
  const dec = slot.decision_engine?.system_decision;
  if (dec === "FLY" || dec === "TAKE_OFF") return "FLY";
  if (dec === "NO_FLY" || dec === "RETURN_TO_CHARGING") return "NO_FLY";
  if (dec === "LOCK_SPRAY") return "LOCK_SPRAY";
  if (dec === "DELAY" || dec === "DELAY_FLIGHT") return "DELAY";

  const score = slot.decision_engine?.flyability_score ?? 0;
  const isSafe = slot.decision_engine?.is_safe_to_fly;
  if (isSafe || score > 0.80) return "FLY";
  const rainProb = slot.weather?.precipitation_probability ?? 0;
  const rainAmt = slot.weather?.precipitation ?? 0;
  if (rainProb >= 50 || rainAmt > 0) return "NO_FLY";
  if (score >= 0.50) return "DELAY";
  return "LOCK_SPRAY";
}

export function getRiskLevel(slot) {
  const score = slot.decision_engine?.flyability_score ?? 0;
  if (score > 0.80) return "LOW";
  if (score >= 0.50) return "MEDIUM";
  return "HIGH";
}

export function formatCountdown(referenceTime, slotTimestamp) {
  if (!referenceTime || !slotTimestamp) return "";
  const minutes = Math.round((new Date(slotTimestamp) - new Date(referenceTime)) / 60000);
  if (minutes <= 0) return "đang trong khung giờ bay";
  if (minutes < 60) return `còn ${minutes} phút`;
  return `còn ${Math.floor(minutes / 60)} giờ ${minutes % 60} phút`;
}

export function getSceneStatus({ droneState, nextSafeSlot, countdown, weatherUnsafe, sprayLocked }) {
  if (droneState === "RETURNING") return { tone: "danger", title: "UAV đang quay về trạm", detail: "Đường bay về Dock 01 đã được kích hoạt" };
  if (droneState === "SPRAYING" && weatherUnsafe) return { tone: "danger", title: "Thời tiết xấu khi đang phun", detail: "Khóa vòi phun hoặc đưa UAV về trạm ngay" };
  if (droneState === "FLYING" && weatherUnsafe) return { tone: "danger", title: "Thời tiết thay đổi khi đang bay", detail: "Kiểm tra telemetry và cân nhắc quay về trạm" };
  if (sprayLocked && droneState !== "DOCKED") return { tone: "warning", title: "Vòi phun đã bị khóa", detail: "UAV vẫn bay nhưng không còn phun thuốc" };
  if (droneState === "SPRAYING") return { tone: "safe", title: "Đang phun theo mức đề xuất", detail: "Hệ thống đang giám sát điều kiện vận hành" };
  if (droneState === "FLYING") return { tone: "safe", title: "UAV đang bay giám sát", detail: "Chọn một mốc giờ xấu để mô phỏng thay đổi thời tiết" };
  if (nextSafeSlot) return { tone: "safe", title: `Sắp tới giờ bay · ${nextSafeSlot.time}`, detail: countdown };
  return { tone: "warning", title: "UAV đang chờ tại trạm", detail: "Chưa có khung giờ cất cánh an toàn trong dự báo" };
}

export function buildRealNotifications({ dashboard, pipelineRun, syncing, lastSyncedAt }) {
  if (!dashboard?.slots?.length) return [];

  const slots = dashboard.slots.map((slot) => {
    const time = slot.timestamp?.includes("T") ? slot.timestamp.split("T")[1].substring(0, 5) : "";
    return {
      ...slot,
      time,
      temperature: slot.weather?.temperature,
      wind_speed: slot.weather?.wind_speed,
      wind_gust: slot.weather?.wind_gust,
      humidity: slot.weather?.humidity,
      rain_probability: slot.weather?.precipitation_probability,
      precipitation: slot.weather?.precipitation,
      cloud_cover: slot.weather?.cloud_cover,
      visibility: slot.weather?.visibility,
      weather_description: slot.weather?.weather_description,
      decision_action: slot.decision_engine?.final_decision,
      schedule_eligible: slot.decision_engine?.final_decision === "FLY",
      risk_level: slot.decision_engine?.risk_level,
    };
  });

  const current = slots[0];
  const forecast = slots;
  const recommendedSlots = slots.filter((slot) => slot.schedule_eligible);
  const action = actionConfig[current.decision_action] ?? actionConfig.DELAY;
  const notifications = [
    {
      id: `decision-${current.timestamp}`,
      icon: current.decision_action === "FLY" ? "check" : "shield_alert",
      tone: current.decision_action === "FLY" ? "success" : "warning",
      title: action.title,
      detail: `${dashboard.location}: mức rủi ro ${translateRiskLevel(current.risk_level).toLowerCase()}.`,
      time: current.time,
    },
  ];

  if (current.wind_speed > 20 || current.wind_gust > 28 || current.decision_action === "LOCK_SPRAY") {
    notifications.push({
      id: `wind-${current.timestamp}`,
      icon: "air",
      tone: "danger",
      title: "Gió vượt ngưỡng vận hành",
      detail: `Gió ${formatNumber(current.wind_speed)} km/h, gió giật ${formatNumber(current.wind_gust)} km/h. Ngưỡng an toàn: 20/28 km/h.`,
      time: current.time,
    });
  }

  if (current.precipitation > 0 || current.rain_probability > 30 || current.decision_action === "NO_FLY") {
    notifications.push({
      id: `rain-${current.timestamp}`,
      icon: "rainy",
      tone: current.precipitation > 0 || current.rain_probability > 60 ? "danger" : "warning",
      title: "Rủi ro mưa trong dự báo",
      detail: `Xác suất mưa ${formatNumber(current.rain_probability)}%, lượng mưa ${formatNumber(current.precipitation)} mm.`,
      time: current.time,
    });
  }

  if (current.temperature > 35) {
    notifications.push({
      id: `temp-${current.timestamp}`,
      icon: "device_thermostat",
      tone: "warning",
      title: "Nhiệt độ cao",
      detail: `Nhiệt độ hiện tại ${formatNumber(current.temperature)}°C, vượt ngưỡng khuyến nghị 35°C.`,
      time: current.time,
    });
  }

  const riskySlots = forecast.filter((slot) => slot.decision_action !== "FLY");
  if (riskySlots.length > 0) {
    const firstRiskySlot = riskySlots[0];
    notifications.push({
      id: `risk-window-${firstRiskySlot.timestamp}`,
      icon: "error",
      tone: riskySlots.length >= Math.ceil(forecast.length / 2) ? "danger" : "warning",
      title: `${riskySlots.length}/${forecast.length} mốc không an toàn`,
      detail: `Mốc đầu tiên: ${firstRiskySlot.time} - ${actionConfig[firstRiskySlot.decision_action]?.short ?? firstRiskySlot.decision_action}.`,
      time: firstRiskySlot.time,
    });
  }

  const safeSlot = recommendedSlots[0];
  notifications.push({
    id: safeSlot ? `safe-${safeSlot.timestamp}` : "safe-missing",
    icon: safeSlot ? "calendar_today" : "lock",
    tone: safeSlot ? "success" : "danger",
    title: safeSlot ? "Có khung giờ cất cánh đề xuất" : "Chưa có khung giờ cất cánh",
    detail: safeSlot
      ? `${safeSlot.time} - ${safeSlot.end_time}, mức rủi ro ${translateRiskLevel(safeSlot.risk_level).toLowerCase()}.`
      : "Hệ thống chưa tìm thấy khung giờ đủ an toàn trong dữ liệu hiện tại.",
    time: safeSlot?.time ?? current.time,
  });

  notifications.push({
    id: syncing ? "pipeline-running" : `source-${dashboard.source}`,
    icon: syncing ? "sync" : "radio",
    tone: syncing ? "info" : "success",
    title: syncing ? "Đang đồng bộ dữ liệu" : "Nguồn dữ liệu đã sẵn sàng",
    detail: syncing
      ? "Hệ thống đang lấy và làm sạch dự báo mới."
      : `${dashboard.source || "Dữ liệu thời tiết"}.`,
    time: lastSyncedAt ? `Giao diện: ${formatDateTime(lastSyncedAt)}` : "",
  });

  if (pipelineRun?.clean_path) {
    notifications.push({
      id: `pipeline-${pipelineRun.clean_path}`,
      icon: "check",
      tone: "success",
      title: "Dữ liệu mới đã cập nhật",
      detail: "Dự báo đã được làm sạch và đưa vào tính toán.",
      time: "",
    });
  }

  return notifications.slice(0, 7);
}

export function getSceneWeather(slot) {
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

export function buildDashboardAnalytics(dashboard) {
  const rows = (dashboard?.slots ?? []).slice(0, 12).map((slot) => {
    const time = slot.timestamp?.includes("T") ? slot.timestamp.split("T")[1].substring(0, 5) : "";
    return {
      ...slot,
      time,
      temperature: slot.weather?.temperature,
      wind_speed: slot.weather?.wind_speed,
      wind_gust: slot.weather?.wind_gust,
      humidity: slot.weather?.humidity,
      rain_probability: slot.weather?.precipitation_probability,
      precipitation: slot.weather?.precipitation,
      cloud_cover: slot.weather?.cloud_cover,
      visibility: slot.weather?.visibility,
      weather_description: slot.weather?.weather_description,
      decision_action: slot.decision_engine?.final_decision,
      schedule_eligible: slot.decision_engine?.final_decision === "FLY",
      risk_level: slot.decision_engine?.risk_level,
    };
  });

  const winds = rows.map((row) => Number(row.wind_speed) || 0);
  const rains = rows.map((row) => Number(row.rain_probability) || 0);
  const temps = rows.map((row) => Number(row.temperature) || 0);
  const safeSlots = rows.filter((row) => row.schedule_eligible).length;
  const actionSegments = buildActionSegments(rows);

  return {
    rows,
    actionSegments,
    summary: [
      { label: "Mốc dự báo nhận được", value: rows.length, suffix: " mốc", note: dashboard?.source ?? "Đang chờ dữ liệu" },
      { label: "Khung giờ bay an toàn", value: safeSlots, suffix: `/${rows.length}`, note: `${formatNumber((safeSlots / Math.max(rows.length, 1)) * 100)}% khung giờ cất cánh` },
      { label: "Điểm bay trung bình", value: safeSlots ? "Tốt" : "Hạn chế", suffix: "", note: "Ước tính từ các mô hình AI" },
      { label: "Điều kiện nổi bật", value: formatNumber(Math.max(...rains, 0)), suffix: "% mưa", note: `Gió TB ${formatNumber(average(winds))} km/h · Nhiệt TB ${formatNumber(average(temps))}°C` },
    ],
  };
}

export function buildActionSegments(rows) {
  const colors = {
    FLY: "#65a875",
    DELAY: "#dca04c",
    LOCK_SPRAY: "#c56d51",
    NO_FLY: "#4f8ca9",
  };
  const counts = rows.reduce((totals, row) => {
    const act = row.decision_action || "DELAY";
    totals[act] = (totals[act] ?? 0) + 1;
    return totals;
  }, {});
  return Object.entries(counts).map(([key, count]) => ({
    key,
    count,
    label: actionConfig[key]?.short ?? key,
    color: colors[key] ?? "#9aa6a2",
  }));
}

export function buildDecisionGradient(segments) {
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

export function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getMsUntilNextLocalDay() {
  const now = new Date();
  const nextDay = new Date(now);
  nextDay.setHours(24, 0, 5, 0);
  return Math.max(nextDay.getTime() - now.getTime(), 1000);
}

export function formatDateTime(value) {
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

export function formatDateTimeWithSeconds(value) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function translatePrediction(pred) {
  if (!pred) return "--";
  const mapping = {
    FLY: "CẤT CÁNH",
    DELAY: "HOÃN BAY",
    LOCK_SPRAY: "KHÓA PHUN",
    NO_FLY: "VỀ TRẠM SẠC",
  };
  return mapping[pred] ?? pred;
}

export function renderMarkdown(text) {
  if (!text) return "";
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  
  // Bold: **text**
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  
  // Bullet points: - item
  html = html.split("\n").map(line => {
    if (line.trim().startsWith("- ")) {
      return `<li class="ml-4 list-disc text-xs mt-1">${line.trim().substring(2)}</li>`;
    }
    return line;
  }).join("\n");
  
  // Line breaks
  html = html.replace(/\n/g, "<br />");
  return html;
}

export function formatModelName(value) {
  if (!value) return "--";
  const labels = {
    decision_tree: "Decision Tree",
    random_forest: "Random Forest",
    logistic_regression: "Logistic Regression",
    baseline_majority: "Majority Baseline",
  };
  if (labels[value]) return labels[value];
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatDecisionLabel(value) {
  return actionConfig[value]?.title ?? value ?? "--";
}

export function formatSplitStrategy(value) {
  if (!value) return "--";
  if (`${value}`.includes("GroupShuffleSplit")) return "Chia theo khung giờ để kiểm tra công bằng";
  return value;
}

export function formatAiStep(step) {
  const labels = {
    simulate_images: "Ghép ảnh theo thời tiết",
    extract_features: "Đọc đặc điểm ảnh",
    train_model: "Học lại cách ra khuyến nghị",
    simulate: "Ghép ảnh theo thời tiết",
    extract: "Đọc đặc điểm ảnh",
    train: "Học lại cách ra khuyến nghị",
  };
  return labels[step] ?? step ?? "--";
}

export function getFilename(path) {
  if (!path) return "--";
  return path.split(/[\\/]/).pop();
}

export function formatPipelineStep(step) {
  const labels = {
    fetch_weather: "Lấy dự báo thời tiết",
    clean_data: "Làm sạch dữ liệu",
    upload_supabase: "Cập nhật kho dữ liệu",
  };
  const rows = step.rows ? ` · ${step.rows} dòng` : "";
  const warning = step.status === "warning" ? " · cảnh báo" : "";
  const skipped = step.status === "skipped" ? " · bỏ qua" : "";
  return `${labels[step.name] ?? step.name}${rows}${warning}${skipped}`;
}

export function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function formatNumber(value) {
  const rounded = Math.round((Number(value) || 0) * 10) / 10;
  return Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(1);
}

export function formatVisibility(value) {
  const meters = Number(value) || 0;
  if (meters >= 1000) return `${formatNumber(meters / 1000)} km`;
  return `${formatNumber(meters)} m`;
}

export function translateWeatherDescription(description) {
  if (!description) return "Điều kiện ổn định";
  const key = description.trim().toLowerCase();
  
  const wmoCodes = {
    "0": "Trời quang",
    "1": "Trời quang / Ít mây",
    "2": "Mây rải rác",
    "3": "Nhiều mây / Âm u",
    "45": "Có sương mù",
    "48": "Sương mù đóng băng",
    "51": "Mưa phùn nhẹ",
    "53": "Mưa phùn vừa",
    "55": "Mưa phùn dày đặc",
    "56": "Mưa phùn lạnh nhẹ",
    "57": "Mưa phùn lạnh mạnh",
    "61": "Mưa nhỏ",
    "63": "Mưa vừa",
    "65": "Mưa lớn",
    "66": "Mưa lạnh nhẹ",
    "67": "Mưa lạnh mạnh",
    "71": "Tuyết rơi nhẹ",
    "73": "Tuyết rơi vừa",
    "75": "Tuyết rơi dày",
    "77": "Tuyết hạt",
    "80": "Mưa rào nhẹ",
    "81": "Mưa rào vừa",
    "82": "Mưa rào lớn",
    "85": "Mưa rào tuyết nhẹ",
    "86": "Mưa rào tuyết lớn",
    "95": "Có dông",
    "96": "Dông kèm mưa đá nhẹ",
    "99": "Dông kèm mưa đá mạnh"
  };

  if (key.startsWith("code ")) {
    const codeNum = key.replace("code ", "").trim();
    if (wmoCodes[codeNum]) return wmoCodes[codeNum];
  }

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

export function formatRecommendationText(text) {
  if (!text) return "--";
  return `${text}`
    .replace(/^FLY:/, "Có thể cất cánh:")
    .replace(/^LOCK_SPRAY:/, "Khóa lệnh phun:")
    .replace(/^NO_FLY:/, "Đưa UAV về trạm sạc:")
    .replace(/^DELAY:/, "Nên hoãn chuyến bay:")
    .replace("Dieu kien bay chap nhan duoc.", "Điều kiện bay chấp nhận được.")
    .replace(/Gio ([\d.]+) km\/h, gio giat ([\d.]+) km\/h, xac suat mua ([\d.]+)%\./, "Gió $1 km/h, gió giật $2 km/h, khả năng mưa $3%.")
    .replace(/De xuat flow-rate ([\d.]+)%\./, "Mức phun đề xuất $1%.")
    .replace("Khoa lenh phun vi gio/gio giat vuot nguong an toan", "Khóa phun vì gió hoặc gió giật vượt ngưỡng an toàn")
    .replace("Tranh pesticide drift va mat on dinh UAV.", "Tránh thuốc bị gió cuốn lệch và giữ UAV ổn định.")
    .replace("Thoi tiet mua/nguy hiem", "Thời tiết có mưa hoặc nguy hiểm")
    .replace("xac suat mua", "khả năng mưa")
    .replace("Dua drone ve tram sac de bao ve thiet bi.", "Đưa UAV về trạm sạc để bảo vệ thiết bị.")
    .replace(/Tam hoan bay do nhiet do ([\d.]+)C hoac rui ro mua ([\d.]+)%\./, "Tạm hoãn bay do nhiệt độ $1°C hoặc rủi ro mưa $2%.")
    .replace("Kiem tra lai khung gio ke tiep.", "Kiểm tra lại khung giờ kế tiếp.");
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function getPointerIndex(event, count) {
  const rect = event.currentTarget.getBoundingClientRect();
  const progress = clamp((event.clientX - rect.left) / Math.max(rect.width, 1), 0, 1);
  return clamp(Math.round(progress * (count - 1)), 0, count - 1);
}

export function getPointerIndexByY(event, count) {
  const rect = event.currentTarget.getBoundingClientRect();
  const progress = clamp((event.clientY - rect.top) / Math.max(rect.height, 1), 0, 1);
  return clamp(Math.round(progress * (count - 1)), 0, count - 1);
}

export function getTooltipLeft(index, count) {
  if (index === null || count <= 1) return 0;
  return clamp((index / (count - 1)) * 100, 8, 92);
}
