const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, { cache: "no-store", ...options });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const detail = payload.detail?.message ?? payload.detail ?? "Không thể kết nối dịch vụ dữ liệu Agricultural Drone Scheduler.";
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  return response.json();
}

export function getLocations() {
  return request("/api/locations");
}

export function getDecisionLog(limit = 100, location = null) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (location) params.set("location", location);
  return request(`/api/decision-log?${params.toString()}`);
}

export function getDronesList() {
  return Promise.resolve([
    { id: "drone_1", name: "DJI Agras T30", status: "READY", battery: 100 },
    { id: "drone_2", name: "XAG P100", status: "CHARGING", battery: 45 }
  ]);
}

export function addDrone(dronePayload) {
  return request("/api/drones", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dronePayload),
  });
}

export function deleteDrone(droneId) {
  return request(`/api/drones/${droneId}`, {
    method: "DELETE",
  });
}

export function getDashboardSlots(location, at = null, farmSize = 10.0, distanceKm = 1.0, droneModel = "DJI_T30", pesticide = "Tricyclazole", cropStage = "TILLERING") {
  const params = new URLSearchParams({
    location,
    farm_size_ha: farmSize.toString(),
    distance_km: distanceKm.toString(),
    drone_model: droneModel,
    pesticide: pesticide,
    crop_stage: cropStage,
    refresh: Date.now().toString(),
  });
  if (at) params.set("at", at);
  return request(`/api/dashboard?${params.toString()}`);
}

export function editDrone(droneId, payload) {
  return request(`/api/drones/${encodeURIComponent(droneId)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function overrideDecision(payload) {
  return request(`/api/decision/override`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function askChatbot(question) {
  return request("/api/chat/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
}

export function getDecisionConfig() {
  return request("/api/decision-config");
}

export function updateDecisionConfig(config) {
  return request("/api/decision-config", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });
}

export function resetDecisionConfig() {
  return request("/api/decision-config/reset", { method: "POST" });
}

function locationParams(location) {
  const params = new URLSearchParams({ refresh: Date.now().toString() });
  if (location) params.set("location", location);
  return params.toString();
}

export function getAiTrainingStatus(location) {
  return request(`/api/ai-training/status?${locationParams(location)}`);
}

export function getAiTrainingMetrics() {
  return request("/api/ai-training/metrics");
}

export function simulateAiTrainingImages(location) {
  return request(`/api/ai-training/simulate-images?${locationParams(location)}`, { method: "POST" });
}

export function extractAiTrainingFeatures(location) {
  return request(`/api/ai-training/extract-features?${locationParams(location)}`, { method: "POST" });
}

export function trainAiModel(location) {
  return request(`/api/ai-training/train?${locationParams(location)}`, { method: "POST" });
}

export function runPipeline({ days = 3, skipUpload = false } = {}) {
  const params = new URLSearchParams({
    days: days.toString(),
    skip_upload: skipUpload ? "true" : "false",
  });
  return request(`/api/pipeline/run?${params.toString()}`, { method: "POST" });
}


