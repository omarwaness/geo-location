"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Maximize2, Minimize2, Layers, X, Plus, Check, Undo2 } from "lucide-react";

import { Map as LocationMap, MapControls, MapMarker, MarkerContent, useMap } from "@/components/ui/map";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PersonLocation } from "@/lib/simulate-location";

export type Zone = {
  id: string;
  name: string;
  coordinates: [number, number][];
};

const PERSON_START: [number, number] = [-73.97, 40.78];

function ZoneLayer({ zones }: { zones: Zone[] }) {
  const { map, isLoaded } = useMap();
  const [isLayerVisible, setIsLayerVisible] = useState(false);
  const [hoveredPark, setHoveredPark] = useState<string | null>(null);

  const geojsonData = useCallback(() => {
    const features = zones.map((z) => ({
      type: "Feature" as const,
      properties: { name: z.name, type: "custom" },
      geometry: {
        type: "Polygon" as const,
        coordinates: [[...z.coordinates, z.coordinates[0]]] as [number, number][][],
      },
    }));
    return {
      type: "FeatureCollection" as const,
      features,
    };
  }, [zones]);

  useEffect(() => {
    if (!map || !isLoaded) return;

    const data = geojsonData();

    if (!map.getSource("parks")) {
      map.addSource("parks", { type: "geojson", data });
    } else {
      (map.getSource("parks") as maplibregl.GeoJSONSource).setData(data);
    }

    if (!map.getLayer("parks-fill")) {
      map.addLayer({
        id: "parks-fill",
        type: "fill",
        source: "parks",
        paint: { "fill-color": "#22c55e", "fill-opacity": 0.4 },
        layout: { visibility: isLayerVisible ? "visible" : "none" },
      });
    }

    if (!map.getLayer("parks-outline")) {
      map.addLayer({
        id: "parks-outline",
        type: "line",
        source: "parks",
        paint: { "line-color": "#16a34a", "line-width": 2 },
        layout: { visibility: isLayerVisible ? "visible" : "none" },
      });
    }
  }, [map, isLoaded, zones, geojsonData, isLayerVisible]);

  useEffect(() => {
    if (!map || !isLoaded) return;

    const handleMouseEnter = () => {
      map.getCanvas().style.cursor = "pointer";
    };
    const handleMouseLeave = () => {
      map.getCanvas().style.cursor = "";
      setHoveredPark(null);
    };
    const handleMouseMove = (e: maplibregl.MapMouseEvent) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: ["parks-fill"],
      });
      if (features.length > 0) {
        setHoveredPark(features[0].properties?.name || null);
      }
    };

    map.on("mouseenter", "parks-fill", handleMouseEnter);
    map.on("mouseleave", "parks-fill", handleMouseLeave);
    map.on("mousemove", "parks-fill", handleMouseMove);

    return () => {
      map.off("mouseenter", "parks-fill", handleMouseEnter);
      map.off("mouseleave", "parks-fill", handleMouseLeave);
      map.off("mousemove", "parks-fill", handleMouseMove);
    };
  }, [map, isLoaded]);

  const toggleLayer = () => {
    if (!map) return;
    const visibility = isLayerVisible ? "none" : "visible";
    map.setLayoutProperty("parks-fill", "visibility", visibility);
    map.setLayoutProperty("parks-outline", "visibility", visibility);
    setIsLayerVisible(!isLayerVisible);
  };

  return (
    <>
      <div className="absolute top-3 left-3 z-10">
        <Button
          size="sm"
          variant={isLayerVisible ? "default" : "secondary"}
          onClick={toggleLayer}
        >
          {isLayerVisible ? (
            <X className="mr-1.5 size-4" />
          ) : (
            <Layers className="mr-1.5 size-4" />
          )}
          {isLayerVisible ? "Hide Zones" : "Show Zones"}
        </Button>
      </div>

      {hoveredPark && (
        <div className="bg-background/90 absolute bottom-3 left-3 z-10 rounded-md border px-3 py-2 text-sm font-medium backdrop-blur">
          {hoveredPark}
        </div>
      )}
    </>
  );
}

function DrawingTool({ onZoneAdded }: { onZoneAdded: (zone: Zone) => void }) {
  const { map, isLoaded } = useMap();
  const [isDrawing, setIsDrawing] = useState(false);
  const [points, setPoints] = useState<[number, number][]>([]);
  const pointsRef = useRef<[number, number][]>([]);

  // Keep ref in sync for use inside map event handlers
  useEffect(() => {
    pointsRef.current = points;
  }, [points]);

  // Set up drawing source/layers once
  useEffect(() => {
    if (!map || !isLoaded) return;

    if (!map.getSource("drawing-line")) {
      map.addSource("drawing-line", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
    }
    if (!map.getSource("drawing-fill")) {
      map.addSource("drawing-fill", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
    }
    if (!map.getSource("drawing-points")) {
      map.addSource("drawing-points", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
    }

    if (!map.getLayer("drawing-fill-layer")) {
      map.addLayer({
        id: "drawing-fill-layer",
        type: "fill",
        source: "drawing-fill",
        paint: { "fill-color": "#3b82f6", "fill-opacity": 0.2 },
      });
    }
    if (!map.getLayer("drawing-line-layer")) {
      map.addLayer({
        id: "drawing-line-layer",
        type: "line",
        source: "drawing-line",
        paint: { "line-color": "#3b82f6", "line-width": 2, "line-dasharray": [2, 2] },
      });
    }
    if (!map.getLayer("drawing-points-layer")) {
      map.addLayer({
        id: "drawing-points-layer",
        type: "circle",
        source: "drawing-points",
        paint: {
          "circle-radius": 5,
          "circle-color": "#3b82f6",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });
    }
  }, [map, isLoaded]);

  // Update drawn geometry preview on map
  const updateDrawingPreview = useCallback(
    (pts: [number, number][]) => {
      if (!map) return;

      // Points
      const pointFeatures = pts.map((p) => ({
        type: "Feature" as const,
        properties: {},
        geometry: { type: "Point" as const, coordinates: p },
      }));
      (map.getSource("drawing-points") as maplibregl.GeoJSONSource)?.setData({
        type: "FeatureCollection",
        features: pointFeatures,
      });

      // Line
      if (pts.length >= 2) {
        (map.getSource("drawing-line") as maplibregl.GeoJSONSource)?.setData({
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: {},
              geometry: { type: "LineString", coordinates: pts },
            },
          ],
        });
      } else {
        (map.getSource("drawing-line") as maplibregl.GeoJSONSource)?.setData({
          type: "FeatureCollection",
          features: [],
        });
      }

      // Fill preview (close the polygon)
      if (pts.length >= 3) {
        (map.getSource("drawing-fill") as maplibregl.GeoJSONSource)?.setData({
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: {},
              geometry: {
                type: "Polygon",
                coordinates: [[...pts, pts[0]]],
              },
            },
          ],
        });
      } else {
        (map.getSource("drawing-fill") as maplibregl.GeoJSONSource)?.setData({
          type: "FeatureCollection",
          features: [],
        });
      }
    },
    [map],
  );

  // Clear all drawing visuals
  const clearDrawing = useCallback(() => {
    if (!map) return;
    const empty = { type: "FeatureCollection" as const, features: [] as never[] };
    (map.getSource("drawing-points") as maplibregl.GeoJSONSource)?.setData(empty);
    (map.getSource("drawing-line") as maplibregl.GeoJSONSource)?.setData(empty);
    (map.getSource("drawing-fill") as maplibregl.GeoJSONSource)?.setData(empty);
  }, [map]);

  // Click handler to add points
  useEffect(() => {
    if (!map || !isLoaded || !isDrawing) return;

    map.getCanvas().style.cursor = "crosshair";

    const handleClick = (e: maplibregl.MapMouseEvent) => {
      const newPoint: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      const next = [...pointsRef.current, newPoint];
      pointsRef.current = next;
      setPoints(next);
      updateDrawingPreview(next);
    };

    map.on("click", handleClick);

    return () => {
      map.off("click", handleClick);
      map.getCanvas().style.cursor = "";
    };
  }, [map, isLoaded, isDrawing, updateDrawingPreview]);

  const startDrawing = () => {
    setIsDrawing(true);
    setPoints([]);
    clearDrawing();
  };

  const undoLastPoint = () => {
    const next = points.slice(0, -1);
    setPoints(next);
    pointsRef.current = next;
    updateDrawingPreview(next);
  };

  const cancelDrawing = () => {
    setIsDrawing(false);
    setPoints([]);
    pointsRef.current = [];
    clearDrawing();
  };

  const finishDrawing = () => {
    if (points.length < 3) return;

    const zone: Zone = {
      id: crypto.randomUUID(),
      name: `Zone ${new Date().toLocaleTimeString()}`,
      coordinates: points,
    };
    onZoneAdded(zone);

    setIsDrawing(false);
    setPoints([]);
    pointsRef.current = [];
    clearDrawing();
  };

  if (!isDrawing) {
    return (
      <div className="absolute top-3 left-36 z-10">
        <Button size="sm" variant="secondary" onClick={startDrawing}>
          <Plus className="mr-1.5 size-4" />
          Draw Zone
        </Button>
      </div>
    );
  }

  return (
    <div className="absolute top-3 left-36 z-10 flex gap-1.5">
      <Button size="sm" variant="secondary" onClick={undoLastPoint} disabled={points.length === 0}>
        <Undo2 className="mr-1.5 size-4" />
        Undo
      </Button>
      <Button size="sm" variant="default" onClick={finishDrawing} disabled={points.length < 3}>
        <Check className="mr-1.5 size-4" />
        Finish ({points.length} pts)
      </Button>
      <Button size="sm" variant="destructive" onClick={cancelDrawing}>
        <X className="mr-1.5 size-4" />
        Cancel
      </Button>
    </div>
  );
}

function PersonMarker({ location }: { location: PersonLocation | null }) {
  if (!location) return null;

  return (
    <MapMarker longitude={location.longitude} latitude={location.latitude}>
      <MarkerContent>
        <div
          className={cn(
            "relative h-4 w-4 rounded-full border-2 border-white shadow-lg",
            location.insideZone ? "bg-blue-500" : "bg-red-500"
          )}
        />
      </MarkerContent>
    </MapMarker>
  );
}

type LocationMapPanelProps = {
  mapExpanded: boolean;
  onToggleExpanded: () => void;
  zones: Zone[];
  onZoneAdded: (zone: Zone) => void;
  personLocation: PersonLocation | null;
};

export function LocationMapPanel({
  mapExpanded,
  onToggleExpanded,
  zones,
  onZoneAdded,
  personLocation,
}: LocationMapPanelProps) {
  return (
    <div
      className={cn(
        "relative p-4 transition-all duration-300 ease-in-out",
        mapExpanded ? "h-full md:w-full" : "h-1/2 md:h-auto md:w-1/2"
      )}
    >
      <button
        onClick={onToggleExpanded}
        className="absolute top-6 right-6 z-10 cursor-pointer rounded-md border bg-background/80 p-2 shadow-md backdrop-blur hover:bg-accent"
        aria-label={mapExpanded ? "Minimize map" : "Maximize map"}
      >
        {mapExpanded ? (
          <Minimize2 className="h-4 w-4" />
        ) : (
          <Maximize2 className="h-4 w-4" />
        )}
      </button>
      <div className="h-full w-full overflow-hidden rounded-xl border shadow-lg">
        <LocationMap center={PERSON_START} zoom={11.8}>
          <MapControls />
          <ZoneLayer zones={zones} />
          <DrawingTool onZoneAdded={onZoneAdded} />
          <PersonMarker location={personLocation} />
        </LocationMap>
      </div>
    </div>
  );
}