import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Map, {
  NavigationControl,
  ScaleControl,
  Source,
  Layer,
  Marker
} from "react-map-gl/mapbox";
import type { MapMouseEvent, MapRef } from "react-map-gl/mapbox";
import type { MapboxGeoJSONFeature } from "mapbox-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import type { Feature, Polygon } from "geojson";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import "mapbox-gl/dist/mapbox-gl.css";
import RestaurantPopup from "./RestaurantPopup";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import RestaurantForm from "@/components/restaurants/RestaurantForm";
import { restaurantsToGeoJSON } from "@/lib/geojson";
import type { Restaurant, RestaurantFormData } from "@/types/restaurant";

interface Props {
  restaurants: Restaurant[];
  onAdd: (data: RestaurantFormData) => void;
  onDelete: (id: string) => void;
  onDrawPolygon: (polygon: Feature<Polygon> | null) => void;
  currentUserId: string | null;
  isAuthenticated: boolean;
  isSubmitting: boolean;
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string;
const CLUSTER_MAX_ZOOM = 14;

const CUISINE_EMOJI: Record<string, string> = {
  italian: "🍕",
  japanese: "🍣",
  mexican: "🌮",
  american: "🍔",
  chinese: "🥢",
  indian: "🍛",
  thai: "🍜",
  mediterranean: "🥗",
  other: "🍽️"
};

export default function FoodMap({
  restaurants,
  onAdd,
  onDelete,
  onDrawPolygon,
  currentUserId,
  isAuthenticated,
  isSubmitting,
}: Props) {
  const mapRef = useRef<MapRef>(null);
  const drawRef = useRef<MapboxDraw | null>(null);
  const isDrawingRef = useRef(false);
  const justFinishedDrawRef = useRef(false);
  const onDrawPolygonRef = useRef(onDrawPolygon);
  useEffect(() => { onDrawPolygonRef.current = onDrawPolygon; }, [onDrawPolygon]);
  const [zoom, setZoom] = useState(13);
  const [hoveredNeighborhoodId, setHoveredNeighborhoodId] = useState<string | null>(null);
  const [hoveredNeighborhoodName, setHoveredNeighborhoodName] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [selected, setSelected] = useState<Restaurant | null>(null);
  const [pendingCoords, setPendingCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [is3D, setIs3D] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  const geojson = useMemo(() => restaurantsToGeoJSON(restaurants), [restaurants]);
  const showMarkers = zoom >= CLUSTER_MAX_ZOOM;

  const handle3DToggle = () => {
    const next = !is3D;
    setIs3D(next);
    mapRef.current?.easeTo({
      pitch: next ? 45 : 0,
      bearing: next ? -10 : 0,
      duration: 800,
    });
  };

  useEffect(() => {
    if (!mapLoaded) return;
    const map = mapRef.current?.getMap();
    if (!map || drawRef.current) return;

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: { polygon: true, trash: true },
    });

    map.addControl(draw);
    drawRef.current = draw;

    const handleDrawCreate = () => {
      const data = draw.getAll();
      const polygon = data.features[0] as Feature<Polygon> | undefined;
      if (polygon) {
        onDrawPolygonRef.current(polygon);
        justFinishedDrawRef.current = true;
      }
    };

    const handleDrawUpdate = () => {
      const data = draw.getAll();
      const polygon = data.features[0] as Feature<Polygon> | undefined;
      if (polygon) onDrawPolygonRef.current(polygon);
    };

    const handleDrawDelete = () => {
      onDrawPolygonRef.current(null);
    };

    const handleModeChange = () => {
      isDrawingRef.current = draw.getMode() === "draw_polygon";
    };

    map.on("draw.create", handleDrawCreate);
    map.on("draw.update", handleDrawUpdate);
    map.on("draw.delete", handleDrawDelete);
    map.on("draw.modechange", handleModeChange);

    return () => {
      map.off("draw.create", handleDrawCreate);
      map.off("draw.update", handleDrawUpdate);
      map.off("draw.delete", handleDrawDelete);
      map.off("draw.modechange", handleModeChange);
      if (drawRef.current) {
        map.removeControl(drawRef.current);
        drawRef.current = null;
      }
    };
  }, [mapLoaded]);

  const handleClick = useCallback(
    (e: MapMouseEvent) => {
      const map = mapRef.current?.getMap();
      if (!map) return;

      if (isDrawingRef.current) return;
      if (justFinishedDrawRef.current) {
        justFinishedDrawRef.current = false;
        return;
      }

      const clusterFeatures = map.queryRenderedFeatures(e.point, {
        layers: ["clusters"]
      }) as MapboxGeoJSONFeature[];

      if (clusterFeatures.length > 0) {
        const feature = clusterFeatures[0];
        const clusterId = feature.properties?.cluster_id;
        const source = map.getSource("restaurants") as mapboxgl.GeoJSONSource;
        source.getClusterExpansionZoom(
          clusterId,
          (err: Error | null | undefined, zoom: number | null | undefined) => {
            if (err || zoom == null) return;
            const coords = (feature.geometry as GeoJSON.Point).coordinates as [
              number,
              number
            ];
            map.easeTo({ center: coords, zoom });
          }
        );
        return;
      }

      if (isAuthenticated) {
        setSelected(null);
        setPendingCoords({ latitude: e.lngLat.lat, longitude: e.lngLat.lng });
      }
    },
    [isAuthenticated]
  );

  const handleFormSubmit = (data: RestaurantFormData) => {
    onAdd(data);
    setPendingCoords(null);
  };

  const handleDelete = (id: string) => {
    onDelete(id);
    setSelected(null);
  };

  return (
    <>
      <Map
        ref={mapRef}
        initialViewState={{ longitude: -58.3816, latitude: -34.6037, zoom: 13 }}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={MAPBOX_TOKEN}
        onLoad={() => setMapLoaded(true)}
        onClick={handleClick}
        onZoom={e => setZoom(e.viewState.zoom)}
        doubleClickZoom={false}
        cursor={isAuthenticated ? "crosshair" : "default"}
        interactiveLayerIds={["clusters", "neighborhoods-fill"]}
        onMouseMove={e => {
          const feature = e.features?.[0];
          setHoveredNeighborhoodId(feature?.properties?.id ?? null);
          setHoveredNeighborhoodName(feature?.properties?.nombre ?? null);
          setTooltipPos(feature ? { x: e.originalEvent.clientX, y: e.originalEvent.clientY } : null);
        }}
        onMouseLeave={() => {
          setHoveredNeighborhoodId(null);
          setHoveredNeighborhoodName(null);
          setTooltipPos(null);
        }}
      >
        <NavigationControl
          position="top-right"
          style={{ marginTop: "100px" }}
        />
        <ScaleControl position="bottom-right" />

        <Source id="ba-barrios" type="geojson" data="/ba-barrios.geojson">
          <Layer
            id="neighborhoods-fill"
            type="fill"
            paint={{
              "fill-color": "#6366f1",
              "fill-opacity": hoveredNeighborhoodId
                ? ["case", ["==", ["get", "id"], hoveredNeighborhoodId], 0.2, 0]
                : 0,
            }}
          />
          <Layer
            id="neighborhoods-line"
            type="line"
            paint={{
              "line-color": "#6366f1",
              "line-width": hoveredNeighborhoodId
                ? ["case", ["==", ["get", "id"], hoveredNeighborhoodId], 2, 0.5]
                : 0.5,
              "line-opacity": 0.4,
            }}
          />
        </Source>

        <Source id="buildings" type="vector" url="mapbox://mapbox.mapbox-streets-v8">
          <Layer
            id="3d-buildings"
            source-layer="building"
            type="fill-extrusion"
            minzoom={14}
            filter={["==", "extrude", "true"]}
            layout={{ visibility: is3D ? "visible" : "none" }}
            paint={{
              "fill-extrusion-color": "#aaa",
              "fill-extrusion-height": ["get", "height"],
              "fill-extrusion-base": ["get", "min_height"],
              "fill-extrusion-opacity": 0.6,
            }}
          />
        </Source>

        <Source id="restaurants-heatmap" type="geojson" data={geojson}>
          <Layer
            id="heatmap"
            type="heatmap"
            layout={{ visibility: showHeatmap ? "visible" : "none" }}
            paint={{
              "heatmap-weight": 1,
              "heatmap-intensity": 1,
              "heatmap-radius": 30,
              "heatmap-color": [
                "interpolate",
                ["linear"],
                ["heatmap-density"],
                0,
                "rgba(0,0,255,0)",
                0.2,
                "royalblue",
                0.4,
                "cyan",
                0.6,
                "lime",
                0.8,
                "yellow",
                1,
                "red"
              ],
              "heatmap-opacity": 0.7
            }}
          />
        </Source>

        <Source
          id="restaurants"
          type="geojson"
          data={geojson}
          cluster={true}
          clusterMaxZoom={CLUSTER_MAX_ZOOM}
          clusterRadius={50}
        >
          <Layer
            id="clusters"
            type="circle"
            filter={["has", "point_count"]}
            layout={{ visibility: showHeatmap ? "none" : "visible" }}
            paint={{
              "circle-color": [
                "step",
                ["get", "point_count"],
                "#6366f1",
                5,
                "#8b5cf6",
                15,
                "#ec4899"
              ],
              "circle-radius": [
                "step",
                ["get", "point_count"],
                18,
                5,
                24,
                15,
                32
              ],
              "circle-opacity": 0.85
            }}
          />
          <Layer
            id="cluster-count"
            type="symbol"
            filter={["has", "point_count"]}
            layout={{
              visibility: showHeatmap ? "none" : "visible",
              "text-field": "{point_count_abbreviated}",
              "text-size": 13,
              "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"]
            }}
            paint={{ "text-color": "#ffffff" }}
          />
        </Source>

        {showMarkers &&
          !showHeatmap &&
          restaurants.map(r => (
            <Marker
              key={r.id}
              longitude={r.longitude}
              latitude={r.latitude}
              anchor="bottom"
            >
              <div
                className="cursor-pointer text-2xl hover:scale-125 transition-transform drop-shadow-md"
                onClick={e => {
                  e.stopPropagation();
                  setSelected(r);
                  setPendingCoords(null);
                }}
              >
                {CUISINE_EMOJI[r.cuisine] ?? "🍽️"}
              </div>
            </Marker>
          ))}

        {selected && (
          <RestaurantPopup
            restaurant={selected}
            longitude={selected.longitude}
            latitude={selected.latitude}
            onClose={() => setSelected(null)}
            canDelete={!!currentUserId && selected.created_by === currentUserId}
            onDelete={handleDelete}
          />
        )}
      </Map>

      <div className="absolute bottom-8 left-4 z-10 flex gap-2">
        <Button
          size="sm"
          variant={showHeatmap ? "default" : "outline"}
          className="shadow-md text-xs"
          onClick={() => setShowHeatmap(v => !v)}
        >
          {showHeatmap ? "🔵 Clusters" : "🌡️ Heatmap"}
        </Button>
        <Button
          size="sm"
          variant={is3D ? "default" : "outline"}
          className="shadow-md text-xs"
          onClick={handle3DToggle}
        >
          {is3D ? "🗺️ 2D" : "🏙️ 3D"}
        </Button>
      </div>

      {tooltipPos && hoveredNeighborhoodName && (
        <div
          className="pointer-events-none fixed z-20 rounded-md bg-black/75 px-2 py-1 text-xs text-white shadow-md"
          style={{ left: tooltipPos.x + 12, top: tooltipPos.y - 28 }}
        >
          {hoveredNeighborhoodName}
        </div>
      )}

      <Dialog
        open={!!pendingCoords}
        onOpenChange={open => !open && setPendingCoords(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a restaurant</DialogTitle>
          </DialogHeader>
          {pendingCoords && (
            <RestaurantForm
              coordinates={pendingCoords}
              onSubmit={handleFormSubmit}
              onCancel={() => setPendingCoords(null)}
              isSubmitting={isSubmitting}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
