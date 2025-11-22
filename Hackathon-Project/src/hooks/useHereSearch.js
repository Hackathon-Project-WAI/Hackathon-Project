/**
 * useHereSearch Hook
 * Hook để search địa điểm với HERE Autocomplete API
 */

import { useState, useCallback, useRef } from "react";

export const useHereSearch = (apiKey) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  /**
   * Autocomplete search
   * @param {string} query - Search query
   * @param {Object} at - Center point {lat, lng} for better results
   */
  const autocomplete = useCallback(
    async (query, at = { lat: 16.0544, lng: 108.2022 }) => {
      if (!query || query.length < 2) {
        setSuggestions([]);
        return;
      }

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      setLoading(true);
      setError(null);

      try {
        const url = `https://autocomplete.search.hereapi.com/v1/autocomplete?q=${encodeURIComponent(
          query
        )}&at=${at.lat},${at.lng}&limit=8&lang=vi&apiKey=${apiKey}`;

        console.log("🔍 Autocomplete search:", query);
        console.log("📍 URL:", url);

        const response = await fetch(url, {
          signal: abortControllerRef.current.signal,
        });

        console.log("📡 Response status:", response.status);

        if (!response.ok) {
          console.error(
            "❌ Response not OK:",
            response.status,
            response.statusText
          );
          throw new Error("Search failed");
        }

        const data = await response.json();
        console.log("✅ Search results:", data);

        // Format suggestions
        const formattedSuggestions = (data.items || []).map((item) => {
          // HERE Autocomplete API structure
          const position =
            item.position || item.access?.[0]?.latLng || item.address?.position;

          console.log("🔍 Item:", item.title, "Position:", position);

          return {
            id: item.id,
            title: item.title || item.address?.label || "Không có tên",
            address: item.address?.label || "",
            position: position
              ? { lat: position.lat, lng: position.lng }
              : null,
            type: item.resultType,
            distance: item.distance,
            locationId: item.id, // Lưu để lookup sau
          };
        });

        // Remove duplicates by normalizing title (remove common prefixes)
        const uniqueSuggestions = [];
        const seenTitles = new Set();

        console.log("🔍 Starting deduplication...");
        for (const suggestion of formattedSuggestions) {
          // Normalize: remove "Đường", lowercase, trim
          let normalizedTitle = suggestion.title.toLowerCase().trim();
          normalizedTitle = normalizedTitle.replace(/^đường\s+/i, "");
          normalizedTitle = normalizedTitle.replace(/\s+/g, " ");

          console.log(
            `   Original: "${suggestion.title}" → Normalized: "${normalizedTitle}"`
          );

          if (!seenTitles.has(normalizedTitle)) {
            seenTitles.add(normalizedTitle);
            uniqueSuggestions.push(suggestion);
            console.log(`   ✅ Kept`);
          } else {
            console.log(`   🔄 Skipped (duplicate)`);
          }
        }

        console.log(
          `✅ Formatted ${uniqueSuggestions.length} unique suggestions (from ${formattedSuggestions.length})`
        );
        setSuggestions(uniqueSuggestions);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Autocomplete error:", err);
          setError("Không thể tìm kiếm");
        }
      } finally {
        setLoading(false);
      }
    },
    [apiKey]
  );

  /**
   * Lookup - Get coordinates for selected suggestion by locationId
   */
  const lookup = useCallback(
    async (locationId) => {
      try {
        console.log("🔎 Lookup location:", locationId);
        const url = `https://lookup.search.hereapi.com/v1/lookup?id=${locationId}&apiKey=${apiKey}`;

        const response = await fetch(url);
        const data = await response.json();

        console.log("📍 Lookup response:", data);

        if (data.position) {
          return {
            lat: data.position.lat,
            lng: data.position.lng,
            address: data.address?.label || data.title || "",
          };
        }

        return null;
      } catch (err) {
        console.error("Lookup error:", err);
        return null;
      }
    },
    [apiKey]
  );

  /**
   * Geocode - Convert address to coordinates
   */
  const geocode = useCallback(
    async (address) => {
      try {
        const url = `https://geocode.search.hereapi.com/v1/geocode?q=${encodeURIComponent(
          address
        )}&apiKey=${apiKey}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.items && data.items.length > 0) {
          return {
            lat: data.items[0].position.lat,
            lng: data.items[0].position.lng,
            address: data.items[0].address.label,
          };
        }

        return null;
      } catch (err) {
        console.error("Geocode error:", err);
        return null;
      }
    },
    [apiKey]
  );

  /**
   * Reverse Geocode - Convert coordinates to address
   */
  const reverseGeocode = useCallback(
    async (lat, lng) => {
      try {
        const url = `https://revgeocode.search.hereapi.com/v1/revgeocode?at=${lat},${lng}&lang=vi&apiKey=${apiKey}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.items && data.items.length > 0) {
          return {
            address: data.items[0].address.label,
            title: data.items[0].title || data.items[0].address.label,
          };
        }

        return null;
      } catch (err) {
        console.error("Reverse geocode error:", err);
        return null;
      }
    },
    [apiKey]
  );

  /**
   * Clear suggestions
   */
  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
  }, []);

  return {
    suggestions,
    loading,
    error,
    autocomplete,
    lookup,
    geocode,
    reverseGeocode,
    clearSuggestions,
  };
};
