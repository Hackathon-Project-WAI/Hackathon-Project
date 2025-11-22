/**
 * useHereMap Hook
 * Hook để khởi tạo và quản lý HERE Map
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { MAP_CONFIG } from "../utils/routeConstants";

export const useHereMap = (apiKey, mapContainerRef) => {
  const map = useRef(null);
  const platform = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Initialize HERE Map
   */
  useEffect(() => {
    if (!window.H || !mapContainerRef.current || !apiKey) {
      if (!window.H) console.error("HERE Maps library chưa được load");
      if (!mapContainerRef.current)
        console.error("Map container chưa sẵn sàng");
      if (!apiKey) console.error("Thiếu API key");
      return;
    }

    // Khởi tạo platform
    if (!platform.current) {
      try {
        platform.current = new window.H.service.Platform({
          apikey: apiKey,
        });
      } catch (err) {
        console.error("Lỗi khởi tạo platform:", err);
        setError("Không thể khởi tạo HERE Maps Platform");
        return;
      }
    }

    // Khởi tạo map
    if (!map.current) {
      try {
        const defaultLayers = platform.current.createDefaultLayers();

        map.current = new window.H.Map(
          mapContainerRef.current,
          defaultLayers.vector.normal.map,
          {
            zoom: MAP_CONFIG.defaultZoom,
            center: MAP_CONFIG.defaultCenter,
            pixelRatio: window.devicePixelRatio || 1,
          }
        );

        // Thêm behavior (zoom, pan, drag)
        new window.H.mapevents.Behavior(
          new window.H.mapevents.MapEvents(map.current)
        );

        // Thêm UI controls
        window.H.ui.UI.createDefault(map.current, defaultLayers);

        // Handle resize
        const handleResize = () => {
          if (map.current) {
            map.current.getViewPort().resize();
          }
        };

        window.addEventListener("resize", handleResize);

        console.log("✅ Map initialized successfully");
        setMapReady(true);

        return () => {
          window.removeEventListener("resize", handleResize);
        };
      } catch (err) {
        console.error("Lỗi khi khởi tạo map:", err);
        setError("Không thể khởi tạo bản đồ");
      }
    }
  }, [apiKey, mapContainerRef]);

  /**
   * Set map center
   */
  const setCenter = useCallback((lat, lng, animate = true) => {
    if (!map.current) return;

    map.current.setCenter({ lat, lng }, animate);
  }, []);

  /**
   * Set map zoom
   */
  const setZoom = useCallback((zoom, animate = true) => {
    if (!map.current) return;

    map.current.setZoom(zoom, animate);
  }, []);

  /**
   * Set center and zoom
   */
  const setCenterAndZoom = useCallback((lat, lng, zoom, animate = true) => {
    if (!map.current) return;

    map.current.setCenter({ lat, lng }, animate);
    map.current.setZoom(zoom, animate);
  }, []);

  /**
   * Get routing service
   */
  const getRoutingService = useCallback(() => {
    if (!platform.current) {
      console.error("Platform not initialized");
      return null;
    }

    try {
      // HERE Maps Platform API v8 sử dụng router trực tiếp
      return platform.current.getRoutingService(null, 8);
    } catch (err) {
      console.error("Error getting routing service:", err);
      return null;
    }
  }, []);

  /**
   * Add object to map
   */
  const addObject = useCallback((object) => {
    if (!map.current || !object) return;

    map.current.addObject(object);
  }, []);

  /**
   * Remove object from map
   */
  const removeObject = useCallback((object) => {
    if (!map.current || !object) return;

    map.current.removeObject(object);
  }, []);

  /**
   * Add event listener to map
   */
  const addEventListener = useCallback((eventType, handler) => {
    if (!map.current) return;

    map.current.addEventListener(eventType, handler);

    // Return cleanup function
    return () => {
      if (map.current) {
        map.current.removeEventListener(eventType, handler);
      }
    };
  }, []);

  /**
   * Screen to geo coordinates
   */
  const screenToGeo = useCallback((x, y) => {
    if (!map.current) return null;

    return map.current.screenToGeo(x, y);
  }, []);

  return {
    map: map.current,
    platform: platform.current,
    mapReady,
    error,
    setCenter,
    setZoom,
    setCenterAndZoom,
    getRoutingService,
    addObject,
    removeObject,
    addEventListener,
    screenToGeo,
  };
};
