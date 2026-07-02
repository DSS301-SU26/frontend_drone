import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useApp } from "../../context/AppContext";

const SATELLITE_URL = "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}";

// Mapping location names to GPS coordinates and demo farm plots
const LOCATION_MAP = {
  "Dong Thap": {
    center: [10.4544, 105.6323],
    plots: [
      [[10.456, 105.630], [10.456, 105.634], [10.452, 105.634], [10.452, 105.630]],
      [[10.452, 105.630], [10.452, 105.634], [10.449, 105.634], [10.449, 105.630]],
      [[10.456, 105.635], [10.456, 105.640], [10.450, 105.640], [10.450, 105.635]],
    ],
  },
  "Can Tho": {
    center: [10.0342, 105.7220],
    plots: [
      [[10.036, 105.720], [10.036, 105.724], [10.032, 105.724], [10.032, 105.720]],
      [[10.032, 105.720], [10.032, 105.724], [10.029, 105.724], [10.029, 105.720]],
      [[10.036, 105.725], [10.036, 105.730], [10.030, 105.730], [10.030, 105.725]],
    ],
  },
  "Long An": {
    center: [10.5360, 106.4130],
    plots: [
      [[10.538, 106.411], [10.538, 106.415], [10.534, 106.415], [10.534, 106.411]],
      [[10.534, 106.411], [10.534, 106.415], [10.531, 106.415], [10.531, 106.411]],
      [[10.538, 106.416], [10.538, 106.421], [10.532, 106.421], [10.532, 106.416]],
    ],
  },
  "An Giang": {
    center: [10.3860, 105.4350],
    plots: [
      [[10.388, 105.433], [10.388, 105.437], [10.384, 105.437], [10.384, 105.433]],
      [[10.384, 105.433], [10.384, 105.437], [10.381, 105.437], [10.381, 105.433]],
      [[10.388, 105.438], [10.388, 105.443], [10.382, 105.443], [10.382, 105.438]],
    ],
  },
};

const DEFAULT_LOCATION = LOCATION_MAP["Dong Thap"];

function getLocationData(locationId) {
  // Try exact match first, then partial match
  if (LOCATION_MAP[locationId]) return LOCATION_MAP[locationId];
  const key = Object.keys(LOCATION_MAP).find(k => locationId?.toLowerCase().includes(k.toLowerCase()));
  return key ? LOCATION_MAP[key] : DEFAULT_LOCATION;
}

export default function TerrainMaps() {
  const { locationId } = useApp();
  const locData = getLocationData(locationId);

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const boundaryLayerRef = useRef(null);
  const ndviLayerRef = useRef(null);

  const [showBoundaries, setShowBoundaries] = useState(true);
  const [showNdvi, setShowNdvi] = useState(true);

  // Initialize leaflet map once
  useEffect(() => {
    if (mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: locData.center,
      zoom: 16,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer(SATELLITE_URL, { maxZoom: 20 }).addTo(map);

    mapInstanceRef.current = map;

    // Draw initial layers
    const plots = locData.plots || [];
    const boundaryGroup = L.layerGroup(
      plots.map((coords, i) => L.polygon(coords, {
        color: i < 2 ? "#4bddb7" : "#3c4a44",
        fill: false,
        dashArray: "8 4",
        weight: 2,
      }))
    ).addTo(map);
    boundaryLayerRef.current = boundaryGroup;

    const ndviGroup = L.layerGroup(
      plots.length > 2
        ? [L.polygon(plots[2], { color: "transparent", fillColor: "#f0bf63", fillOpacity: 0.5 })]
        : []
    ).addTo(map);
    ndviLayerRef.current = ndviGroup;

    setTimeout(() => map.invalidateSize(), 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Fly to new location and redraw polygons when locationId changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    map.flyTo(locData.center, 16, { duration: 1.5 });

    // Redraw boundary polygons
    if (boundaryLayerRef.current) {
      boundaryLayerRef.current.clearLayers();
      (locData.plots || []).forEach((coords, i) => {
        L.polygon(coords, {
          color: i < 2 ? "#4bddb7" : "#3c4a44",
          fill: false,
          dashArray: "8 4",
          weight: 2,
        }).addTo(boundaryLayerRef.current);
      });
    }

    // Redraw NDVI overlay
    if (ndviLayerRef.current) {
      ndviLayerRef.current.clearLayers();
      if (locData.plots?.length > 2) {
        L.polygon(locData.plots[2], { color: "transparent", fillColor: "#f0bf63", fillOpacity: 0.5 })
          .addTo(ndviLayerRef.current);
      }
    }
  }, [locationId]);

  // Toggle boundary layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = boundaryLayerRef.current;
    if (!map || !layer) return;
    if (showBoundaries) {
      if (!map.hasLayer(layer)) map.addLayer(layer);
    } else {
      if (map.hasLayer(layer)) map.removeLayer(layer);
    }
  }, [showBoundaries]);

  // Toggle NDVI layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = ndviLayerRef.current;
    if (!map || !layer) return;
    if (showNdvi) {
      if (!map.hasLayer(layer)) map.addLayer(layer);
    } else {
      if (map.hasLayer(layer)) map.removeLayer(layer);
    }
  }, [showNdvi]);

  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();
  const handleRecenter = () => mapInstanceRef.current?.flyTo(locData.center, 16);

  return (
    <div className="flex-1 relative w-full h-[calc(100vh-64px)] md:h-full bg-surface-dim overflow-hidden rounded-xl border border-outline-variant">
      {/* Real Interactive Map */}
      <div ref={mapRef} className="absolute inset-0 z-0" style={{ background: "#111" }}></div>

      {/* Floating Control Panels (Right Side) */}
      <div className="absolute top-md right-md flex flex-col gap-sm z-[1000] w-[320px]">
        
        {/* Data Layers Card */}
        <div className="bg-surface-container-low/95 backdrop-blur-xl border border-outline-variant rounded-xl p-md shadow-2xl">
          <div className="flex items-center gap-2 mb-4 border-b border-outline-variant pb-3">
            <span className="material-symbols-outlined text-primary">layers</span>
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Các Lớp Dữ liệu</h3>
          </div>
          <div className="flex flex-col gap-5">
            {/* Toggle 1: Plot Boundaries */}
            <div className="flex items-center justify-between group cursor-pointer" onClick={() => setShowBoundaries(!showBoundaries)}>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors text-sm">dashboard</span>
                <span className="font-body-md text-body-md text-on-surface">Ranh giới Lô đất</span>
              </div>
              <button className={`w-10 h-5 rounded-full relative transition-colors ${showBoundaries ? 'bg-primary-container shadow-[0_0_8px_rgba(0,184,148,0.3)]' : 'bg-surface-container-highest border border-outline-variant'}`}>
                <span className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${showBoundaries ? 'right-0.5 bg-on-primary' : 'left-0.5 bg-outline-variant'}`}></span>
              </button>
            </div>
            
            {/* Toggle 2: NDVI */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between group cursor-pointer" onClick={() => setShowNdvi(!showNdvi)}>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors text-sm">compost</span>
                  <span className="font-body-md text-body-md text-on-surface">NDVI (Sức khỏe Cây trồng)</span>
                </div>
                <button className={`w-10 h-5 rounded-full relative transition-colors ${showNdvi ? 'bg-primary-container shadow-[0_0_8px_rgba(0,184,148,0.3)]' : 'bg-surface-container-highest border border-outline-variant'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${showNdvi ? 'right-0.5 bg-on-primary' : 'left-0.5 bg-outline-variant'}`}></span>
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
      <div className="absolute bottom-md right-md flex flex-col gap-2 z-[1000]">
        <div className="bg-surface-container-low/90 backdrop-blur-md border border-outline-variant rounded-lg flex flex-col overflow-hidden shadow-lg">
          <button onClick={handleZoomIn} className="w-10 h-10 flex items-center justify-center text-on-surface hover:bg-surface-variant hover:text-primary transition-colors border-b border-outline-variant">
            <span className="material-symbols-outlined">add</span>
          </button>
          <button onClick={handleZoomOut} className="w-10 h-10 flex items-center justify-center text-on-surface hover:bg-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined">remove</span>
          </button>
        </div>
        <button onClick={handleRecenter} className="w-10 h-10 bg-surface-container-low/90 backdrop-blur-md border border-outline-variant rounded-lg flex items-center justify-center text-on-surface hover:bg-surface-variant hover:text-primary transition-colors shadow-lg mt-1">
          <span className="material-symbols-outlined">my_location</span>
        </button>
      </div>
    </div>
  );
}
