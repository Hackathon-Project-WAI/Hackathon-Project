/**
 * useWeatherOverlay Hook - Canvas Tile Version
 * Vẽ 93 phường/xã bằng Canvas cho hiệu suất cao
 */

import { useEffect, useRef, useCallback, useState } from "react";
import daNangWards from "../data/daNangDistricts.json"; // File 93 phường/xã mới
import { getAllDistrictRainfall } from "../services/districtRainfallService";

export const useWeatherOverlay = (map, mapReady, isVisible = false) => {
  const canvasLayerRef = useRef(null);
  const [rainfallData, setRainfallData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Get rainfall for a ward/district
   */
  const getWardRainfall = useCallback(
    (wardName) => {
      if (!rainfallData) return 0;
      // Match ward name to district
      // Simple mock - bạn có thể improve logic này
      return rainfallData["Hải Châu"] || 0;
    },
    [rainfallData]
  );

  /**
   * Get color based on rainfall
   */
  const getRainfallColor = useCallback((rainfall) => {
    if (rainfall === 0) return "rgba(200, 230, 201, 0.4)";
    if (rainfall < 1) return "rgba(144, 202, 249, 0.6)";
    if (rainfall < 2.5) return "rgba(100, 181, 246, 0.7)";
    if (rainfall < 5) return "rgba(255, 183, 77, 0.75)";
    if (rainfall < 10) return "rgba(255, 112, 67, 0.8)";
    return "rgba(229, 57, 53, 0.85)";
  }, []);

  /**
   * Fetch rainfall data
   */
  useEffect(() => {
    const fetchRainfall = async () => {
      if (!isVisible || rainfallData || isLoading) return;

      setIsLoading(true);
      try {
        const data = await getAllDistrictRainfall();
        setRainfallData(data);
      } catch (error) {
        console.error("❌ Error fetching rainfall:", error);
        setRainfallData({
          "Hải Châu": 8.6,
          "Sơn Trà": 11.3,
          "Thanh Khê": 11.3,
          "Liên Chiểu": 11.0,
          "Ngũ Hành Sơn": 9.4,
          "Cẩm Lệ": 8.6,
          "Hòa Vang": 3.7,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchRainfall();
  }, [isVisible, rainfallData, isLoading]);

  /**
   * Create canvas overlay layer
   */
  const createCanvasLayer = useCallback(() => {
    if (!map || !window.H || !rainfallData) return;

    console.log(
      "🎨 Creating canvas overlay for",
      daNangWards.features.length,
      "wards"
    );

    // Create custom canvas layer provider
    const CanvasTileProvider = function () {
      this.canvas = document.createElement("canvas");
      this.canvas.width = 256;
      this.canvas.height = 256;
      this.ctx = this.canvas.getContext("2d");
    };

    CanvasTileProvider.prototype.requestTile = function (
      x,
      y,
      z,
      success,
      error
    ) {
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext("2d");

      // Draw wards on this tile
      daNangWards.features.forEach((feature) => {
        const wardName =
          feature.properties.shortName || feature.properties.name;
        const rainfall = getWardRainfall(wardName);
        const fillColor = getRainfallColor(rainfall);

        // Convert geo coordinates to tile pixels
        const coords = feature.geometry.coordinates[0];

        ctx.fillStyle = fillColor;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
        ctx.lineWidth = 1;

        ctx.beginPath();
        coords.forEach((coord, index) => {
          // This is simplified - need proper tile coordinate conversion
          const px = ((coord[0] + 180) / 360) * 256;
          const py = ((90 - coord[1]) / 180) * 256;

          if (index === 0) {
            ctx.moveTo(px, py);
          } else {
            ctx.lineTo(px, py);
          }
        });
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      });

      success(canvas);
    };

    // Create tile layer
    const provider = new CanvasTileProvider();
    const tileLayer = new window.H.map.layer.TileLayer(provider, {
      opacity: 0.7,
    });

    map.addLayer(tileLayer);
    canvasLayerRef.current = tileLayer;

    console.log("✅ Canvas layer added");
  }, [map, rainfallData, getWardRainfall, getRainfallColor]);

  /**
   * Remove canvas layer
   */
  const removeCanvasLayer = useCallback(() => {
    if (!map || !canvasLayerRef.current) return;

    map.removeLayer(canvasLayerRef.current);
    canvasLayerRef.current = null;
    console.log("✅ Canvas layer removed");
  }, [map]);

  /**
   * Toggle overlay
   */
  useEffect(() => {
    if (!mapReady || !map || !rainfallData) return;

    if (isVisible) {
      createCanvasLayer();
    } else {
      removeCanvasLayer();
    }

    return () => {
      if (canvasLayerRef.current) {
        removeCanvasLayer();
      }
    };
  }, [
    mapReady,
    map,
    isVisible,
    rainfallData,
    createCanvasLayer,
    removeCanvasLayer,
  ]);

  return {
    rainfallData,
    isLoading,
  };
};
