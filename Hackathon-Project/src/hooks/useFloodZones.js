/**
 * useFloodZones Hook
 * Hook để quản lý flood zones từ cả mock data và sensor real-time
 */

import { useState, useEffect } from "react";
import floodZoneService from "../services/floodZoneService";

export const useFloodZones = (mockFloodZones = []) => {
  const [floodZones, setFloodZones] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    mock: 0,
    sensor: 0,
    sensorListening: false,
  });

  useEffect(() => {
    // Set mock zones
    floodZoneService.setMockFloodZones(mockFloodZones);

    // Start listening to sensors
    floodZoneService.startListeningSensors();

    // Subscribe to changes
    const unsubscribe = floodZoneService.subscribe((zones) => {
      setFloodZones(zones);
      setStats(floodZoneService.getStats());
    });

    // Cleanup on unmount
    return () => {
      unsubscribe();
      floodZoneService.stopListeningSensors();
    };
  }, [mockFloodZones]);

  return {
    floodZones, // Tất cả zones (mock + sensor)
    stats, // Thống kê
    sensorZones: floodZoneService.getSensorFloodZones(),
    mockZones: floodZoneService.getMockFloodZones(),
  };
};
