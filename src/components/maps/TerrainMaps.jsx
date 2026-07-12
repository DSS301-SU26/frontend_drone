import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useApp } from "../../context/AppContext";

const SATELLITE_URL = "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}";

// Function to generate a square polygon centered at lat, lng with a given area in hectares
function generatePlotPolygon(lat, lng, areaHa) {
  const areaSqMeters = areaHa * 10000;
  const sideLengthMeters = Math.sqrt(areaSqMeters);
  const offsetMeters = sideLengthMeters / 2;

  // 1 degree latitude is approx 111,320 meters
  const latOffset = offsetMeters / 111320;
  // 1 degree longitude depends on latitude
  const lngOffset = offsetMeters / (111320 * Math.cos(lat * Math.PI / 180));

  return [
    [lat + latOffset, lng - lngOffset],
    [lat + latOffset, lng + lngOffset],
    [lat - latOffset, lng + lngOffset],
    [lat - latOffset, lng - lngOffset],
  ];
}

export default function TerrainMaps() {
  const { locationId, locations } = useApp();
  const activePlot = locations.find(l => l.id === locationId) || locations[0];
  
  // Default to Dong Thap if locations array is empty
  const center = activePlot ? [activePlot.lat, activePlot.lng] : [10.4544, 105.6323];
  
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const boundaryLayerRef = useRef(null);
  const ndviLayerRef = useRef(null);

  const [showBoundaries, setShowBoundaries] = useState(true);
  const [showNdvi, setShowNdvi] = useState(true);

  // Initialize leaflet map once
  useEffect(() => {
    if (mapInstanceRef.current || !activePlot) return;

    const map = L.map(mapRef.current, {
      center: center,
      zoom: 16,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer(SATELLITE_URL, { maxZoom: 20 }).addTo(map);

    mapInstanceRef.current = map;

    // Create groups
    boundaryLayerRef.current = L.layerGroup().addTo(map);
    ndviLayerRef.current = L.layerGroup().addTo(map);

    setTimeout(() => map.invalidateSize(), 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Fly to new location and redraw polygons when activePlot changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !activePlot) return;

    const newCenter = [activePlot.lat, activePlot.lng];
    map.flyTo(newCenter, 16, { duration: 1.5 });

    const plotPolygon = generatePlotPolygon(activePlot.lat, activePlot.lng, activePlot.area);

    // Redraw boundary polygons
    if (boundaryLayerRef.current) {
      boundaryLayerRef.current.clearLayers();
      L.polygon(plotPolygon, {
        color: "#4bddb7",
        fill: false,
        dashArray: "8 4",
        weight: 2,
      }).addTo(boundaryLayerRef.current);
    }

    // Redraw NDVI overlay
    if (ndviLayerRef.current) {
      ndviLayerRef.current.clearLayers();
      L.polygon(plotPolygon, { 
        color: "transparent", 
        fillColor: "#f0bf63", 
        fillOpacity: 0.5 
      }).addTo(ndviLayerRef.current);
    }
  }, [activePlot]);

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
  const handleRecenter = () => mapInstanceRef.current?.flyTo(center, 16);

  if (!activePlot) return null;

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
          </div>
        </div>

        {/* Plot Info Card */}
        <div className="bg-surface-container-low/95 backdrop-blur-xl border border-outline-variant rounded-xl p-md shadow-2xl mt-2">
          <div className="flex items-center gap-2 mb-4 border-b border-outline-variant pb-3">
            <span className="material-symbols-outlined text-primary">info</span>
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Thông tin Lô đất</h3>
          </div>
          
          {/* Active Measurement Readout */}
          <div className="mt-4 p-3 bg-surface-container-lowest rounded-lg border border-outline-variant flex flex-col gap-1">
            <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider">{activePlot.name}</span>
            <div className="flex items-baseline gap-2">
              <span className="font-data-mono text-xl font-bold text-primary">{activePlot.area}</span>
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
