/**
 * MapViewRefactored - Refactored version with optimized performance
 * Sử dụng custom hooks, sub-components, và React optimization techniques
 */

import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useHereMap } from "../hooks/useHereMap";
import { useGeolocation } from "../hooks/useGeolocation";
import { useRouting } from "../hooks/useRouting";
import { useWeatherOverlay } from "../hooks/useWeatherOverlay";
import {
  createUserLocationMarker,
  createRouteMarker,
  createFloodZoneCircle,
  createPlaceMarker,
  formatFloodInfoBubble,
  zoomToBounds,
} from "../utils/mapHelpers";
import {
  ROUTE_COLORS,
  FLOOD_COLORS,
  MAP_CONFIG,
} from "../utils/routeConstants";
import FloodWarning from "./MapView/components/FloodWarning";
import RouteSearchPanel from "./RouteSearchPanel";
import MapControls from "./MapControls";
import RainfallLegend from "./RainfallLegend";
import FloodLegend from "./FloodLegend";
import RouteResultsPanel from "./RouteResultsPanel";
import LocateMeButton from "./LocateMeButton";
import sensorService from "../services/sensorService";
import "./MapViewRefactored.css";

const MapViewRefactored = ({ places, apiKey, floodZones = [] }) => {
  console.log("🚀 MapViewRefactored mounted/updated", {
    placesCount: places?.length,
    mockFloodZones: floodZones?.length,
    hasApiKey: !!apiKey,
  });

  const mapRef = useRef(null);
  const markersGroup = useRef(null);
  const floodOverlayGroup = useRef(null);
  const routeGroup = useRef(null);
  const userMarkerRef = useRef(null);

  const [routingMode, setRoutingMode] = useState(true); // Mặc định bật search mode
  const [floodZonesVisible, setFloodZonesVisible] = useState(true);
  const [weatherOverlayVisible, setWeatherOverlayVisible] = useState(false);
  const [isLayersCollapsed, setIsLayersCollapsed] = useState(false);
  const [isLocatingUser, setIsLocatingUser] = useState(false); // State cho loading GPS
  const [sensorFloodZones, setSensorFloodZones] = useState([]); // Flood zones từ sensors

  // ========== CUSTOM HOOKS ==========
  const {
    map,
    platform,
    mapReady,
    setCenterAndZoom,
    getRoutingService,
    addObject,
    removeObject,
    addEventListener,
    screenToGeo,
  } = useHereMap(apiKey, mapRef);

  const {
    userLocation,
    locationPermission,
    requestLocation,
    requestLocationWithHERE,
  } = useGeolocation(apiKey); // ✨ Pass API key to enable HERE Positioning API

  // Log vị trí người dùng khi có
  useEffect(() => {
    if (userLocation) {
      console.log("📍 VỊ TRÍ CỦA BẠN (User Location):", {
        lat: userLocation.lat,
        lng: userLocation.lng,
        accuracy: userLocation.accuracy,
      });
    }
  }, [userLocation]);

  // ========== MERGE FLOOD ZONES: Mock + Sensor ==========
  
  // Subscribe to sensor data và convert thành flood zones
  useEffect(() => {
    console.log("🚀 useEffect for sensors - mapReady:", mapReady);

    if (!mapReady) {
      console.log("⏳ Map not ready yet, skipping sensor subscription");
      return;
    }

    console.log("📡 Subscribing to sensor data...");

    const unsubscribe = sensorService.subscribeSensors((sensors) => {
      console.log(`🌊 Received ${sensors.length} sensors from Firebase`);

      // Convert sensors thành flood zones
      const zones = sensorService.sensorsToFloodZones(sensors, 100);
      console.log(`🔵 Created ${zones.length} flood zones from sensors`);

      setSensorFloodZones(zones);
    });

    return () => {
      console.log("🔌 Unsubscribing from sensor data");
      unsubscribe();
    };
  }, [mapReady]);

  // ✅ Merge flood zones từ mock JSON và sensors TRƯỚC KHI truyền vào useRouting
  const combinedFloodZones = useMemo(() => {
    const combined = [...floodZones, ...sensorFloodZones];
    console.log(
      `🗺️ Combined flood zones for routing: ${floodZones.length} mock + ${sensorFloodZones.length} sensors = ${combined.length} total`
    );
    return combined;
  }, [floodZones, sensorFloodZones]);

  // ✅ TRUYỀN combinedFloodZones vào useRouting thay vì chỉ floodZones
  const {
    routeStart,
    routeEnd,
    allRoutes,
    selectedRouteIndex,
    selectedRoute,
    loading,
    error: routeError, // ✅ Thêm error từ hook
    geminiRecommendation,
    calculateRoute,
    selectRoute,
    clearRoute,
    setRouteStart,
    setRouteEnd,
  } = useRouting(getRoutingService, combinedFloodZones);

  // Weather overlay hook
  useWeatherOverlay(map, mapReady, weatherOverlayVisible);

  // ========== MEMOIZED VALUES ==========

  /**
   * Memoized route colors để tránh tính lại mỗi render
   */
  const getRouteColor = useCallback((index, hasFlood, isSelected) => {
    if (hasFlood) {
      return isSelected ? FLOOD_COLORS.selected : FLOOD_COLORS.main;
    }
    const colorScheme = ROUTE_COLORS[index % ROUTE_COLORS.length];
    return isSelected ? colorScheme.selected : colorScheme.main;
  }, []);

  // ========== FLOOD ZONES OVERLAY ==========

  // Subscribe to sensor data và convert thành flood zones
  useEffect(() => {
    console.log("🚀 useEffect for sensors - mapReady:", mapReady);

    if (!mapReady) {
      console.log("⏳ Map not ready yet, skipping sensor subscription");
      return;
    }

    console.log("📡 Subscribing to sensor data...");

    const unsubscribe = sensorService.subscribeSensors((sensors) => {
      console.log(`🌊 Received ${sensors.length} sensors from Firebase`);
      console.log("📊 Sensor details:", sensors);

      // Convert sensors thành flood zones với bán kính 100m (tăng từ 20m để dễ nhìn)
      const zones = sensorService.sensorsToFloodZones(sensors, 100);
      console.log(`🔵 Created ${zones.length} flood zones from sensors`);
      console.log("🗺️ Flood zones details:", zones);

      setSensorFloodZones(zones);
    });

    return () => {
      console.log("🔌 Unsubscribing from sensor data");
      unsubscribe();
    };
  }, [mapReady]);

  // ========== RENDER FLOOD ZONES ON MAP ==========
  
  useEffect(() => {
    if (
      !mapReady ||
      !map ||
      !window.H ||
      !combinedFloodZones ||
      combinedFloodZones.length === 0
    ) {
      return;
    }

    // Xóa overlay cũ nếu có
    if (floodOverlayGroup.current) {
      removeObject(floodOverlayGroup.current);
      floodOverlayGroup.current = null;
    }

    // Chỉ vẽ nếu floodZonesVisible = true
    if (!floodZonesVisible) {
      console.log("🗺️ Flood zones hidden");
      return;
    }

    console.log("🗺️ Drawing flood zones overlay:", combinedFloodZones.length);

    // Tạo group mới
    floodOverlayGroup.current = new window.H.map.Group();

    combinedFloodZones.forEach((zone, index) => {
      const lat = zone.coords?.lat || zone.lat;
      const lng = zone.coords?.lng || zone.lng;
      const radius = zone.radius || 500;
      const riskLevel = zone.riskLevel || "medium";

      console.log(
        `🔵 Drawing zone ${index + 1}/${combinedFloodZones.length}:`,
        {
          id: zone.id,
          name: zone.name,
          type: zone.type,
          coords: { lat, lng },
          radius: radius,
          riskLevel: riskLevel,
          waterLevel: zone.waterLevel,
        }
      );

      const circle = createFloodZoneCircle(lat, lng, radius, riskLevel);
      if (!circle) {
        console.error(`❌ Failed to create circle for zone ${zone.id}`);
        return;
      }

      console.log(
        `✅ Circle created for ${zone.id} - type: ${zone.type || "static"}`
      );

      // Lưu data vào circle
      circle.setData({
        id: zone.id,
        name: zone.name,
        district: zone.district,
        riskLevel: zone.riskLevel,
        description: zone.description,
        rainThreshold: zone.rainThreshold,
        coords: { lat, lng },
        type: zone.type, // 'sensor' hoặc undefined
        waterLevel: zone.waterLevel, // Chỉ có với sensor
        floodStatus: zone.floodStatus, // Chỉ có với sensor
      });

      // Click event
      circle.addEventListener("tap", (evt) => {
        evt.stopPropagation();
        const data = evt.target.getData();
        showFloodInfoBubble(data, data.coords);
      });

      floodOverlayGroup.current.addObject(circle);
    });

    addObject(floodOverlayGroup.current);

    console.log("✅ Flood zones overlay added");
  }, [
    mapReady,
    map,
    combinedFloodZones,
    floodZonesVisible,
    addObject,
    removeObject,
  ]);
  // showFloodInfoBubble is defined later but stable (useCallback)

  // ========== PLACES MARKERS ==========

  useEffect(() => {
    if (!mapReady || !map || !window.H) return;

    // Xóa markers cũ
    if (markersGroup.current) {
      removeObject(markersGroup.current);
    }

    if (!places || places.length === 0) return;

    // Tạo group mới
    markersGroup.current = new window.H.map.Group();

    places.forEach((place) => {
      const marker = createPlaceMarker(place.lat, place.lng, place.name);
      if (marker) {
        markersGroup.current.addObject(marker);
      }
    });

    addObject(markersGroup.current);
  }, [mapReady, map, places, addObject, removeObject]);

  // ========== USER LOCATION MARKER & AUTO ZOOM ==========

  useEffect(() => {
    if (!mapReady || !map || !window.H || !userLocation) {
      console.log("⏳ Waiting for:", {
        mapReady,
        hasMap: !!map,
        hasH: !!window.H,
        userLocation,
      });
      return;
    }

    // Xóa marker cũ nếu có
    if (userMarkerRef.current) {
      removeObject(userMarkerRef.current);
      userMarkerRef.current = null;
    }

    // Chỉ skip nếu đang có ROUTE (cả start và end) và start trùng với userLocation
    // (vì route visualization sẽ vẽ marker)
    if (
      allRoutes &&
      allRoutes.length > 0 &&
      routeStart &&
      Math.abs(routeStart.lat - userLocation.lat) < 0.0001 &&
      Math.abs(routeStart.lng - userLocation.lng) < 0.0001
    ) {
      console.log("⏭️ Skip user marker - route is active with same position");
      return;
    }

    // Tạo marker vị trí người dùng
    const userMarker = createUserLocationMarker(
      userLocation.lat,
      userLocation.lng
    );

    if (userMarker) {
      addObject(userMarker);
      userMarkerRef.current = userMarker;
      console.log("📍 User location marker displayed at:", userLocation);

      // Tự động zoom đến vị trí người dùng (chỉ khi chưa có route)
      if (!allRoutes || allRoutes.length === 0) {
        console.log("🎯 Zooming to:", {
          lat: userLocation.lat,
          lng: userLocation.lng,
          zoom: MAP_CONFIG.userLocationZoom,
        });

        // Sử dụng setTimeout để đảm bảo marker đã được thêm vào map
        setTimeout(() => {
          console.log("⏰ Timeout executing, map:", map);
          if (map && map.getViewModel) {
            console.log(
              "🔄 Setting center to:",
              userLocation.lat,
              userLocation.lng
            );
            // Dùng getViewModel().setLookAtData() - cách chính thống của HERE Maps
            map.getViewModel().setLookAtData(
              {
                position: { lat: userLocation.lat, lng: userLocation.lng },
                zoom: MAP_CONFIG.userLocationZoom,
              },
              true, // animate
              MAP_CONFIG.animationDuration // Thời gian animation (ms)
            );
            console.log("✅ Map centered successfully");
          } else {
            console.error("❌ Map object invalid:", map);
          }
        }, 100);
      } else {
        console.log("⏭️ Skip zoom - route exists");
      }
    }
  }, [
    mapReady,
    map,
    userLocation,
    routeStart,
    allRoutes,
    addObject,
    removeObject,
    setCenterAndZoom,
  ]);

  // ========== ROUTE VISUALIZATION ==========

  useEffect(() => {
    if (
      !mapReady ||
      !map ||
      !window.H ||
      !allRoutes ||
      allRoutes.length === 0
    ) {
      return;
    }

    // Xóa route group cũ
    if (routeGroup.current) {
      removeObject(routeGroup.current);
    }

    // Tạo group mới
    routeGroup.current = new window.H.map.Group();

    // Vẽ tất cả routes
    allRoutes.forEach((routeData, index) => {
      const isSelected = index === selectedRouteIndex;
      const hasFlood = routeData.floodCount > 0;
      const color = getRouteColor(index, hasFlood, isSelected);

      const lineString = window.H.geo.LineString.fromFlexiblePolyline(
        routeData.section.polyline
      );

      const routeLine = new window.H.map.Polyline(lineString, {
        style: {
          strokeColor: color,
          lineWidth: isSelected ? 8 : 5,
          lineCap: "round",
          lineJoin: "round",
          lineDash: isSelected ? [] : [10, 5],
        },
        zIndex: isSelected ? 100 : 50 + index,
        data: {
          routeIndex: index,
          routeInfo: routeData,
        },
      });

      // Click event để chọn route
      routeLine.addEventListener("tap", () => {
        selectRoute(index);
      });

      routeGroup.current.addObject(routeLine);
    });

    // Thêm markers
    if (routeStart) {
      const startMarker = userLocation
        ? createUserLocationMarker(routeStart.lat, routeStart.lng)
        : createRouteMarker(routeStart.lat, routeStart.lng, "start");

      if (startMarker) routeGroup.current.addObject(startMarker);
    }

    if (routeEnd) {
      const endMarker = createRouteMarker(routeEnd.lat, routeEnd.lng, "end");
      if (endMarker) routeGroup.current.addObject(endMarker);
    }

    addObject(routeGroup.current);

    // Zoom to route
    const firstRoute = allRoutes[0];
    const lineString = window.H.geo.LineString.fromFlexiblePolyline(
      firstRoute.section.polyline
    );
    const polyline = new window.H.map.Polyline(lineString);
    zoomToBounds(map, polyline.getBoundingBox());
  }, [
    mapReady,
    map,
    allRoutes,
    selectedRouteIndex,
    routeStart,
    routeEnd,
    userLocation,
    getRouteColor,
    selectRoute,
    addObject,
    removeObject,
  ]);

  // ========== CALLBACKS ==========

  /**
   * Show flood info bubble
   */
  const showFloodInfoBubble = useCallback(
    (zoneData, coords) => {
      if (!map || !window.H) return;

      const riskIcons = {
        high: "🔴",
        medium: "🟡",
        low: "🟢",
      };

      const riskTexts = {
        high: "Ngập cao",
        medium: "Ngập trung bình",
        low: "Ngập nhẹ",
      };

      const icon = riskIcons[zoneData.riskLevel] || "⚠️";
      const riskText = riskTexts[zoneData.riskLevel] || "Ngập";

      //Tạo DOM element - Click vào popup để đóng (đơn giản hơn)
      const popupDiv = document.createElement("div");
      popupDiv.style.cssText = "cursor: pointer; pointer-events: auto;";
      popupDiv.innerHTML = `<div class="flood-popup-wrapper" style="
            position: relative;
            background: rgba(239, 68, 68, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 10px;
            padding: 12px 16px;
            min-width: 220px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
            border: 2px solid rgba(255, 255, 255, 0.3);
            color: white;
            font-family: system-ui, -apple-system, sans-serif;
            z-index: 1000;
            transform: translate(-50%, -100%);
            margin-top: -10px;
          ">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 24px;">${icon}</span>
              <div style="flex: 1;">
                <div style="font-weight: 700; font-size: 15px; margin-bottom: 4px;">
                  CẢNH BÁO VÙNG NGẬP
                </div>
                <div style="font-size: 13px; opacity: 0.95;">
                  ${zoneData.name} - ${riskText}
                </div>
                <div style="font-size: 12px; opacity: 0.85; margin-top: 4px; font-weight: 600;">
                  ⛔ Không nên đi qua khu vực này
                </div>
              </div>
            </div>
            <div style="
              position: absolute;
              bottom: -8px;
              left: 50%;
              transform: translateX(-50%);
              width: 0;
              height: 0;
              border-left: 8px solid transparent;
              border-right: 8px solid transparent;
              border-top: 8px solid rgba(239, 68, 68, 0.95);
            "></div>
          </div>`;

      const popupMarker = new window.H.map.DomMarker(coords, {
        icon: new window.H.map.DomIcon(popupDiv),
      });

      // ✅ Click vào TOÀN BỘ popup để đóng
      popupDiv.addEventListener("click", (e) => {
        e.stopPropagation();
        try {
          map.removeObject(popupMarker);
        } catch (err) {
          console.log("Popup already removed");
        }
      });

      // Hover effect cho toàn bộ popup
      popupDiv.addEventListener("mouseenter", () => {
        popupDiv.style.transform = "scale(1.02)";
        popupDiv.style.transition = "transform 0.2s";
      });
      popupDiv.addEventListener("mouseleave", () => {
        popupDiv.style.transform = "scale(1)";
      });

      map.addObject(popupMarker);

      // Auto remove sau 5 giây
      setTimeout(() => {
        try {
          map.removeObject(popupMarker);
        } catch (e) {
          console.log("Popup already removed");
        }
      }, 5000);
    },
    [map]
  );

  /**
   * Toggle routing mode
   */
  const toggleRoutingMode = useCallback(() => {
    const newMode = !routingMode;
    setRoutingMode(newMode);

    if (newMode) {
      // Bật routing - CHỈ hiện panel, KHÔNG tự động lấy GPS
      console.log(
        "🗺️ Routing mode enabled - Waiting for user to click Locate Me button"
      );
    } else {
      // Tắt routing - clear all
      clearRoute();
      if (routeGroup.current) {
        removeObject(routeGroup.current);
        routeGroup.current = null;
      }
    }
  }, [
    routingMode,
    requestLocation,
    setRouteStart,
    setCenterAndZoom,
    clearRoute,
    removeObject,
    setRoutingMode,
  ]);

  /**
   * Handle clear route
   */
  const handleClearRoute = useCallback(() => {
    clearRoute();
    // Khi xóa route, mở rộng lại layers panel
    setIsLayersCollapsed(false);
    if (routeGroup.current) {
      removeObject(routeGroup.current);
      routeGroup.current = null;
    }
    // Giữ lại user location nếu có
    if (userLocation) {
      setRouteStart(userLocation);
    }
  }, [clearRoute, removeObject, userLocation, setRouteStart]);

  /**
   * Handle route calculate from search panel
   */
  const handleRouteCalculateFromSearch = useCallback(
    (startPoint, endPoint, transportMode) => {
      console.log("🔍 Calculating route from search:", {
        startPoint,
        endPoint,
        transportMode,
      });

      setRouteStart(startPoint);
      setRouteEnd(endPoint);

      // Tự động collapse layers panel khi tìm route
      setIsLayersCollapsed(true);

      // Focus map to route area
      const midLat = (startPoint.lat + endPoint.lat) / 2;
      const midLng = (startPoint.lng + endPoint.lng) / 2;
      setCenterAndZoom(midLat, midLng, 13);

      // Calculate route
      calculateRoute(startPoint, endPoint);
    },
    [setRouteStart, setRouteEnd, setCenterAndZoom, calculateRoute]
  );

  // ========== MAP CLICK HANDLER ==========

  useEffect(() => {
    if (!mapReady || !map || !routingMode) return;

    const handleMapClick = (evt) => {
      if (!routingMode) return;

      const coord = screenToGeo(
        evt.currentPointer.viewportX,
        evt.currentPointer.viewportY
      );

      if (!coord) return;

      const point = { lat: coord.lat, lng: coord.lng };

      // Nếu có user location, chỉ cần chọn destination
      if (userLocation) {
        if (!routeEnd || allRoutes.length > 0) {
          setRouteEnd(point);
          console.log("📍 Destination set:", point);
          calculateRoute(userLocation, point);
        }
      } else {
        // Chưa có user location, chọn thủ công
        if (!routeStart) {
          setRouteStart(point);
          console.log("📍 Start point set:", point);
        } else if (!routeEnd) {
          setRouteEnd(point);
          console.log("📍 End point set:", point);
          calculateRoute(routeStart, point);
        } else {
          // Reset và bắt đầu lại
          handleClearRoute();
          setRouteStart(point);
          console.log("📍 New start point:", point);
        }
      }
    };

    const cleanup = addEventListener("tap", handleMapClick);
    return cleanup;
  }, [
    mapReady,
    map,
    routingMode,
    routeStart,
    routeEnd,
    userLocation,
    allRoutes,
    setRouteStart,
    setRouteEnd,
    calculateRoute,
    handleClearRoute,
    addEventListener,
    screenToGeo,
  ]); // ========== RENDER ==========

  if (!apiKey) {
    return (
      <div className="map-error">
        <div className="error-content">
          <span className="error-icon">⚠️</span>
          <h3>Thiếu API Key</h3>
          <p>Vui lòng thêm HERE API Key vào file .env</p>
        </div>
      </div>
    );
  }

  return (
    <div className="map-view">
      <div ref={mapRef} className="map-container" />

      {/* RIGHT SIDEBAR CONTAINER: Layers + Route Results */}
      <div className="right-sidebar-container">
        <MapControls
          onToggleFloodZones={setFloodZonesVisible}
          floodZonesVisible={floodZonesVisible}
          floodZonesCount={floodZones?.length || 0}
          onToggleWeatherOverlay={setWeatherOverlayVisible}
          weatherOverlayVisible={weatherOverlayVisible}
          onToggleRouting={toggleRoutingMode}
          routingMode={routingMode}
          isCollapsed={isLayersCollapsed}
          onToggleCollapse={setIsLayersCollapsed}
        />

        {/* Route Results Panel - Modern UI */}
        {routingMode && allRoutes.length > 0 && (
          <RouteResultsPanel
            routes={allRoutes}
            selectedIndex={selectedRouteIndex}
            onSelectRoute={selectRoute}
            onClearRoute={handleClearRoute}
            geminiRecommendation={geminiRecommendation}
          />
        )}
      </div>

      {/* Rainfall Legend - Only show when weather overlay is visible */}
      {weatherOverlayVisible && <RainfallLegend />}

      {/* Flood Legend - Only show when flood zones are visible */}
      {floodZonesVisible && <FloodLegend isVisible={floodZonesVisible} />}

      {/* Route Search Panel - Giống Google Maps */}
      {routingMode && (
        <RouteSearchPanel
          apiKey={apiKey}
          onRouteCalculate={handleRouteCalculateFromSearch}
          userLocation={userLocation}
          routeStart={routeStart}
          routeEnd={routeEnd}
          loading={loading}
          error={routeError}
        />
      )}

      {/* Locate Me Button - Google Maps Style */}
      <LocateMeButton
        onLocate={() => {
          console.log("🎯 Locate clicked - userLocation:", userLocation);

          if (userLocation) {
            // Di chuyển map đến vị trí hiện tại + set làm điểm xuất phát
            console.log("📍 Centering to:", userLocation.lat, userLocation.lng);
            if (map) {
              map.getViewModel().setLookAtData(
                {
                  position: { lat: userLocation.lat, lng: userLocation.lng },
                  zoom: MAP_CONFIG.userLocationZoom,
                },
                true,
                MAP_CONFIG.animationDuration
              );
              // Set làm điểm xuất phát nếu đang ở routing mode
              if (routingMode) {
                setRouteStart(userLocation);
                console.log("✅ Set as route start point");
              }
            }
          } else {
            // Yêu cầu quyền truy cập vị trí - Dùng HERE Positioning API
            console.log("🗺️ Requesting location with HERE API...");
            setIsLocatingUser(true); // Bắt đầu loading

            // TRY HERE API FIRST (độ chính xác cao hơn)
            requestLocationWithHERE()
              .then((location) => {
                console.log("✅ Got location from HERE API:", location);
                if (map) {
                  map.getViewModel().setLookAtData(
                    {
                      position: { lat: location.lat, lng: location.lng },
                      zoom: MAP_CONFIG.userLocationZoom,
                    },
                    true,
                    MAP_CONFIG.animationDuration
                  );
                  // Set làm điểm xuất phát nếu đang ở routing mode
                  if (routingMode) {
                    setRouteStart(location);
                    console.log("✅ Set as route start point");
                  }
                }
                setIsLocatingUser(false); // Kết thúc loading
              })
              .catch((error) => {
                console.warn(
                  "⚠️ HERE API failed, trying browser geolocation:",
                  error
                );
                // Fallback to browser geolocation nếu HERE API fail
                requestLocation()
                  .then((location) => {
                    console.log("✅ Got location from browser:", location);
                    if (map) {
                      map.getViewModel().setLookAtData(
                        {
                          position: { lat: location.lat, lng: location.lng },
                          zoom: MAP_CONFIG.userLocationZoom,
                        },
                        true,
                        MAP_CONFIG.animationDuration
                      );
                      if (routingMode) {
                        setRouteStart(location);
                      }
                    }
                    setIsLocatingUser(false);
                  })
                  .catch((error) => {
                    console.error(
                      "❌ Both HERE API and browser failed:",
                      error
                    );
                    setIsLocatingUser(false);
                    alert(
                      "Không thể lấy vị trí của bạn. Vui lòng cho phép truy cập vị trí."
                    );
                  });
              });
          }
        }}
        isLocating={isLocatingUser}
        hasLocation={!!userLocation}
      />
    </div>
  );
};

export default MapViewRefactored;
