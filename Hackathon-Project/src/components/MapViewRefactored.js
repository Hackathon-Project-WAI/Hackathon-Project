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
import RouteControls from "./MapView/components/RouteControls";
import RouteAlternatives from "./MapView/components/RouteAlternatives";
import RouteInfo from "./MapView/components/RouteInfo";
import FloodWarning from "./MapView/components/FloodWarning";
import RouteHint from "./MapView/components/RouteHint";
import MapControls from "./MapControls";
import RainfallLegend from "./RainfallLegend";
import FloodLegend from "./FloodLegend";
import "./MapViewRefactored.css";

const MapViewRefactored = ({ places, apiKey, floodZones = [] }) => {
  const mapRef = useRef(null);
  const markersGroup = useRef(null);
  const floodOverlayGroup = useRef(null);
  const routeGroup = useRef(null);

  const [routingMode, setRoutingMode] = useState(false);
  const [floodZonesVisible, setFloodZonesVisible] = useState(true);
  const [weatherOverlayVisible, setWeatherOverlayVisible] = useState(false);

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

  const { userLocation, locationPermission, requestLocation } =
    useGeolocation();

  const {
    routeStart,
    routeEnd,
    allRoutes,
    selectedRouteIndex,
    selectedRoute,
    routeInfo,
    routeWarning,
    calculateRoute,
    selectRoute,
    clearRoute,
    setRouteStart,
    setRouteEnd,
  } = useRouting(getRoutingService, floodZones);

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

  useEffect(() => {
    if (
      !mapReady ||
      !map ||
      !window.H ||
      !floodZones ||
      floodZones.length === 0
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

    console.log("🗺️ Drawing flood zones overlay:", floodZones.length);

    // Tạo group mới
    floodOverlayGroup.current = new window.H.map.Group();

    floodZones.forEach((zone) => {
      const lat = zone.coords?.lat || zone.lat;
      const lng = zone.coords?.lng || zone.lng;
      const radius = zone.radius || 500;
      const riskLevel = zone.riskLevel || "medium";

      const circle = createFloodZoneCircle(lat, lng, radius, riskLevel);
      if (!circle) return;

      // Lưu data vào circle
      circle.setData({
        id: zone.id,
        name: zone.name,
        district: zone.district,
        riskLevel: zone.riskLevel,
        description: zone.description,
        rainThreshold: zone.rainThreshold,
        coords: { lat, lng },
      });

      // Click event
      circle.addEventListener("tap", (evt) => {
        const data = evt.target.getData();
        showFloodInfoBubble(data, data.coords);
      });

      floodOverlayGroup.current.addObject(circle);
    });

    addObject(floodOverlayGroup.current);

    console.log("✅ Flood zones overlay added");
  }, [mapReady, map, floodZones, floodZonesVisible, addObject, removeObject]);

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
      if (!map || !platform || !window.H) return;

      // Lấy hoặc tạo UI
      let ui = map.getUI();
      if (!ui) {
        const defaultLayers = platform.createDefaultLayers();
        ui = window.H.ui.UI.createDefault(map, defaultLayers);
      }

      const bubble = new window.H.ui.InfoBubble(coords, {
        content: formatFloodInfoBubble(zoneData),
      });

      ui.addBubble(bubble);
    },
    [map, platform]
  );

  /**
   * Toggle routing mode
   * ⚠️ ĐANG TẮT - Chức năng routing tạm thời bị comment
   */
  const toggleRoutingMode = useCallback(() => {
    /* COMMENTED - ROUTING FEATURE
    const newMode = !routingMode;
    setRoutingMode(newMode);

    if (newMode) {
      // Bật routing - request location
      requestLocation()
        .then((location) => {
          setRouteStart(location);
          setCenterAndZoom(location.lat, location.lng, MAP_CONFIG.userLocationZoom);
          alert('✅ Đã lấy vị trí của bạn! Bây giờ hãy click vào bản đồ để chọn điểm đến.');
        })
        .catch((error) => {
          console.error('Failed to get location:', error);
        });
    } else {
      // Tắt routing - clear all
      clearRoute();
      if (routeGroup.current) {
        removeObject(routeGroup.current);
        routeGroup.current = null;
      }
    }
    */
    alert(
      "⚠️ Tính năng dẫn đường tạm thời bị tắt để phát triển hệ thống đăng nhập"
    );
  }, []);

  /**
   * Handle clear route
   */
  const handleClearRoute = useCallback(() => {
    clearRoute();
    if (routeGroup.current) {
      removeObject(routeGroup.current);
      routeGroup.current = null;
    }
    // Giữ lại user location nếu có
    if (userLocation) {
      setRouteStart(userLocation);
    }
  }, [clearRoute, removeObject, userLocation, setRouteStart]);

  // ========== MAP CLICK HANDLER ==========
  // ⚠️ COMMENTED - Routing feature disabled

  useEffect(
    () => {
      /* COMMENTED - ROUTING FEATURE
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
          console.log('📍 Destination set:', point);
          calculateRoute(userLocation, point);
        }
      } else {
        // Chưa có user location, chọn thủ công
        if (!routeStart) {
          setRouteStart(point);
          console.log('📍 Start point set:', point);
        } else if (!routeEnd) {
          setRouteEnd(point);
          console.log('📍 End point set:', point);
          calculateRoute(routeStart, point);
        } else {
          // Reset và bắt đầu lại
          handleClearRoute();
          setRouteStart(point);
          console.log('📍 New start point:', point);
        }
      }
    };

    const cleanup = addEventListener('tap', handleMapClick);
    return cleanup;
    */
    },
    [
      // mapReady,
      // map,
      // routingMode,
      // routeStart,
      // routeEnd,
      // userLocation,
      // allRoutes,
      // setRouteStart,
      // setRouteEnd,
      // calculateRoute,
      // handleClearRoute,
      // addEventListener,
      // screenToGeo,
    ]
  );

  // ========== RENDER ==========

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

      {/* Map Layer Controls */}
      <MapControls
        onToggleFloodZones={setFloodZonesVisible}
        floodZonesVisible={floodZonesVisible}
        floodZonesCount={floodZones?.length || 0}
        onToggleWeatherOverlay={setWeatherOverlayVisible}
        weatherOverlayVisible={weatherOverlayVisible}
      />

      {/* Rainfall Legend - Only show when weather overlay is visible */}
      {weatherOverlayVisible && <RainfallLegend />}

      {/* Flood Legend - Only show when flood zones are visible */}
      {floodZonesVisible && <FloodLegend isVisible={floodZonesVisible} />}

      {/* Routing Controls - COMMENTED FOR PERSONALIZATION DEVELOPMENT */}
      {/* 
      <div className="routing-controls">
        <RouteControls
          routingMode={routingMode}
          onToggle={toggleRoutingMode}
          locationPermission={locationPermission}
        />

        {routingMode && (
          <div className="routing-instructions">
            <RouteHint
              userLocation={userLocation}
              routeStart={routeStart}
              routeEnd={routeEnd}
              locationPermission={locationPermission}
            />
            <FloodWarning warning={routeWarning} />
            <RouteAlternatives
              routes={allRoutes}
              selectedIndex={selectedRouteIndex}
              onSelectRoute={selectRoute}
            />
            <RouteInfo routeInfo={routeInfo} onClear={handleClearRoute} />
          </div>
        )}
      </div>
      */}
    </div>
  );
};

export default MapViewRefactored;
