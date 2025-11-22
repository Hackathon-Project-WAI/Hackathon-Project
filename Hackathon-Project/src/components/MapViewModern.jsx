/**
 * MapViewModern - Complete Rewrite with Split-Screen Layout
 * No more overlapping! Sidebar + Map side-by-side
 */

import React, { useRef, useState, useEffect, useCallback } from "react";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import {
  Navigation,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle2,
  X,
  Droplets,
  Route as RouteIcon,
  Info,
} from "lucide-react";

const MapViewModern = ({ places, apiKey, floodZones = [] }) => {
  console.log(
    "🎯 MapViewModern render - places:",
    places?.length,
    "apiKey:",
    !!apiKey,
    "floodZones:",
    floodZones?.length
  );

  const mapRef = useRef(null);
  const markersGroup = useRef(null);
  const floodOverlayGroup = useRef(null);
  const routeGroup = useRef(null);

  const [routingMode, setRoutingMode] = useState(false);
  const [floodZonesVisible, setFloodZonesVisible] = useState(true);
  const [weatherOverlayVisible, setWeatherOverlayVisible] = useState(false);

  // Custom Hooks
  console.log("🔧 Calling useHereMap...");
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
  console.log("✅ useHereMap result - mapReady:", mapReady);
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

  // Weather overlay
  useWeatherOverlay(map, mapReady, weatherOverlayVisible);

  // Route color helper
  const getRouteColor = useCallback((index, hasFlood, isSelected) => {
    if (hasFlood) {
      return isSelected ? FLOOD_COLORS.selected : FLOOD_COLORS.main;
    }
    const colorScheme = ROUTE_COLORS[index % ROUTE_COLORS.length];
    return isSelected ? colorScheme.selected : colorScheme.main;
  }, []);

  // Flood zones overlay
  useEffect(() => {
    if (
      !mapReady ||
      !map ||
      !window.H ||
      !floodZones ||
      floodZones.length === 0
    )
      return;

    if (floodOverlayGroup.current) {
      removeObject(floodOverlayGroup.current);
      floodOverlayGroup.current = null;
    }

    if (!floodZonesVisible) return;

    floodOverlayGroup.current = new window.H.map.Group();

    floodZones.forEach((zone) => {
      const lat = zone.coords?.lat || zone.lat;
      const lng = zone.coords?.lng || zone.lng;
      const radius = zone.radius || 500;
      const riskLevel = zone.riskLevel || "medium";

      const circle = createFloodZoneCircle(lat, lng, radius, riskLevel);
      if (!circle) return;

      circle.setData({
        id: zone.id,
        name: zone.name,
        district: zone.district,
        riskLevel: zone.riskLevel,
        description: zone.description,
        rainThreshold: zone.rainThreshold,
        coords: { lat, lng },
      });

      circle.addEventListener("tap", (evt) => {
        const data = evt.target.getData();
        showFloodInfoBubble(data, data.coords);
      });

      floodOverlayGroup.current.addObject(circle);
    });

    addObject(floodOverlayGroup.current);
  }, [mapReady, map, floodZones, floodZonesVisible, addObject, removeObject]);

  // Places markers
  useEffect(() => {
    if (!mapReady || !map || !window.H) return;

    if (markersGroup.current) {
      removeObject(markersGroup.current);
    }

    if (!places || places.length === 0) return;

    markersGroup.current = new window.H.map.Group();

    places.forEach((place) => {
      const marker = createPlaceMarker(place.lat, place.lng, place.name);
      if (marker) {
        markersGroup.current.addObject(marker);
      }
    });

    addObject(markersGroup.current);
  }, [mapReady, map, places, addObject, removeObject]);

  // Route visualization
  useEffect(() => {
    if (!mapReady || !map || !window.H || !allRoutes || allRoutes.length === 0)
      return;

    if (routeGroup.current) {
      removeObject(routeGroup.current);
    }

    routeGroup.current = new window.H.map.Group();

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
        data: { routeIndex: index, routeInfo: routeData },
      });

      routeLine.addEventListener("tap", () => {
        selectRoute(index);
      });

      routeGroup.current.addObject(routeLine);
    });

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

  // Show flood info bubble
  const showFloodInfoBubble = useCallback(
    (zoneData, coords) => {
      if (!map || !platform || !window.H) return;

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

  // Toggle routing mode
  const toggleRoutingMode = useCallback(() => {
    const newMode = !routingMode;
    setRoutingMode(newMode);

    if (newMode) {
      requestLocation()
        .then((location) => {
          setRouteStart(location);
          setCenterAndZoom(
            location.lat,
            location.lng,
            MAP_CONFIG.userLocationZoom
          );
        })
        .catch((error) => {
          console.error("Failed to get location:", error);
        });
    } else {
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
  ]);

  // Handle clear route
  const handleClearRoute = useCallback(() => {
    clearRoute();
    if (routeGroup.current) {
      removeObject(routeGroup.current);
      routeGroup.current = null;
    }
    if (userLocation) {
      setRouteStart(userLocation);
    }
  }, [clearRoute, removeObject, userLocation, setRouteStart]);

  // Map click handler
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

      if (userLocation) {
        if (!routeEnd || allRoutes.length > 0) {
          setRouteEnd(point);
          calculateRoute(userLocation, point);
        }
      } else {
        if (!routeStart) {
          setRouteStart(point);
        } else if (!routeEnd) {
          setRouteEnd(point);
          calculateRoute(routeStart, point);
        } else {
          handleClearRoute();
          setRouteStart(point);
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
  ]);

  if (!apiKey) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Missing API Key
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600">
              Please add HERE API Key to your .env file
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white font-sans antialiased">
      {/* MAP AREA - Takes remaining space */}
      <div className="flex-1 relative">
        <div ref={mapRef} className="w-full h-full" />

        {/* Flood Legend - Only floating element on map */}
        {floodZonesVisible && (
          <Card className="absolute bottom-6 left-6 w-64 backdrop-blur-lg bg-white/90 border-slate-200 shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Droplets className="h-4 w-4 text-blue-600" />
                Flood Zones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-4 h-4 rounded-full bg-red-500/30 border-2 border-red-500"></div>
                <span className="text-slate-600">High Risk</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-4 h-4 rounded-full bg-amber-500/30 border-2 border-amber-500"></div>
                <span className="text-slate-600">Medium Risk</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-4 h-4 rounded-full bg-green-500/30 border-2 border-green-500"></div>
                <span className="text-slate-600">Low Risk</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* SIDEBAR - Fixed width, right side */}
      <div className="w-[420px] h-screen border-l border-slate-200 bg-white flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-200">
          <h1 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <Navigation className="h-5 w-5 text-blue-600" />
            Flood-Aware Navigation
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Smart routing with flood detection
          </p>
        </div>

        {/* Location Status */}
        {routingMode && userLocation && (
          <div className="px-6 pt-4">
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-700 font-medium">
                  Location found
                </span>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Route Hint */}
        {routingMode && !routeEnd && (
          <div className="px-6 pt-4">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-3 flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                <span className="text-sm text-blue-700">
                  Tap on the map to set your destination
                </span>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Flood Warning */}
        {routeWarning && (
          <div className="px-6 pt-4">
            <Card className="bg-amber-50 border-amber-300">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-amber-800">
                  <AlertTriangle className="h-4 w-4" />
                  Flood Warning
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-sm text-amber-700 mb-3">
                  {routeWarning.message}
                </p>
                {routeWarning.zones && routeWarning.zones.length > 0 && (
                  <div className="space-y-1">
                    {routeWarning.zones.map((zone, idx) => (
                      <div
                        key={idx}
                        className="text-xs text-amber-600 flex items-center gap-2"
                      >
                        <Droplets className="h-3 w-3" />
                        {zone}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Routes List - Scrollable */}
        {allRoutes.length > 0 && (
          <>
            <div className="px-6 pt-6 pb-3">
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <RouteIcon className="h-4 w-4" />
                Available Routes ({allRoutes.length})
              </h2>
            </div>

            <ScrollArea className="flex-1 px-6">
              <div className="space-y-3 pb-6">
                {allRoutes.map((route, index) => {
                  const isSelected = index === selectedRouteIndex;
                  const hasFlood = route.floodCount > 0;

                  return (
                    <Card
                      key={index}
                      className={`cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? "border-blue-600 bg-blue-50 shadow-md ring-2 ring-blue-600/20"
                          : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
                      }`}
                      onClick={() => selectRoute(index)}
                    >
                      <CardContent className="p-4">
                        {/* Route Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                                isSelected
                                  ? "bg-blue-600 text-white"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {index + 1}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-900">
                                Route {index + 1}
                              </p>
                            </div>
                          </div>
                          {hasFlood ? (
                            <Badge
                              variant="destructive"
                              className="bg-amber-500 text-white"
                            >
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Flood
                            </Badge>
                          ) : (
                            <Badge
                              variant="success"
                              className="bg-green-500 text-white"
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Safe
                            </Badge>
                          )}
                        </div>

                        {/* Route Stats */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-slate-400" />
                            <div>
                              <p className="text-xs text-slate-500">Distance</p>
                              <p className="text-base font-bold text-slate-900">
                                {route.distance.toFixed(1)} km
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-slate-400" />
                            <div>
                              <p className="text-xs text-slate-500">Time</p>
                              <p className="text-base font-bold text-slate-900">
                                {Math.round(route.duration)} min
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Flood Count */}
                        {hasFlood && (
                          <div className="mt-3 pt-3 border-t border-slate-200">
                            <p className="text-xs text-amber-600 flex items-center gap-1">
                              <Droplets className="h-3 w-3" />
                              {route.floodCount} flood zone
                              {route.floodCount > 1 ? "s" : ""} on this route
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </>
        )}

        {/* Empty State */}
        {!routingMode && (
          <div className="flex-1 flex items-center justify-center px-6">
            <div className="text-center">
              <Navigation className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-sm font-medium text-slate-900 mb-2">
                No Active Navigation
              </h3>
              <p className="text-sm text-slate-500 mb-6">
                Start navigation to see available routes
              </p>
              <Button
                onClick={toggleRoutingMode}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Navigation className="h-4 w-4 mr-2" />
                Start Navigation
              </Button>
            </div>
          </div>
        )}

        {/* Footer - Pinned at bottom */}
        <div className="mt-auto border-t border-slate-200 p-6 space-y-4">
          {routingMode && (
            <Button
              onClick={toggleRoutingMode}
              variant="destructive"
              className="w-full bg-red-600 hover:bg-red-700"
            >
              <X className="h-4 w-4 mr-2" />
              Stop Navigation
            </Button>
          )}

          {!routingMode && (
            <Button
              onClick={toggleRoutingMode}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Navigation className="h-4 w-4 mr-2" />
              Start Navigation
            </Button>
          )}

          <Separator />

          <p className="text-xs text-slate-500 text-center">
            Powered by HERE Maps & OpenWeather
          </p>
        </div>
      </div>
    </div>
  );
};

export default MapViewModern;
