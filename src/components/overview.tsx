"use client";

import { cn } from "@/lib/utils";
import { ThemeSwitch } from "@/components/unlumen-ui/theme-switch";
import { Trash2, MapPin, Activity, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Zone } from "@/components/map";
import type { PersonLocation } from "@/lib/simulate-location";

type OverviewProps = {
  mapExpanded: boolean;
  zones: Zone[];
  onZoneRemoved: (id: string) => void;
  personLocation: PersonLocation | null;
};

export function Overview({ mapExpanded, zones, onZoneRemoved, personLocation }: OverviewProps) {
  return (
    <div
      className={cn(
        "shrink-0 overflow-y-auto transition-all duration-300 ease-in-out",
        mapExpanded
          ? "h-0 md:h-auto md:w-0 opacity-0"
          : "h-1/2 md:h-auto md:w-1/2 p-6 opacity-100"
      )}
    >
      <div className="flex items-center justify-between">
        <h1 className="mb-4 text-2xl font-bold">Location Explorer</h1>
        <ThemeSwitch />
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="rounded-lg border p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <Activity className="size-3.5" />
            Status
          </div>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "size-2.5 rounded-full",
                personLocation?.insideZone ? "bg-blue-500" : "bg-red-500"
              )}
            />
            <span className="text-sm font-medium">
              {personLocation?.insideZone ? "Inside Zone" : "Outside"}
            </span>
          </div>
        </div>

        <div className="rounded-lg border p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <MapPin className="size-3.5" />
            Current Zone
          </div>
          <span className="text-sm font-medium">
            {personLocation?.currentZoneName ?? "None"}
          </span>
        </div>

        <div className="rounded-lg border p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <Navigation className="size-3.5" />
            Coordinates
          </div>
          <span className="text-xs font-mono">
            {personLocation
              ? `${personLocation.latitude.toFixed(5)}, ${personLocation.longitude.toFixed(5)}`
              : "—"}
          </span>
        </div>

        <div className="rounded-lg border p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <MapPin className="size-3.5" />
            Total Zones
          </div>
          <span className="text-sm font-medium">{zones.length}</span>
        </div>
      </div>

      {zones.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2 text-lg font-semibold">Custom Zones</h2>
          <ul className="space-y-2">
            {zones.map((zone) => (
              <li
                key={zone.id}
                className="flex items-center justify-between rounded-lg border px-3 py-2"
              >
                <span className="text-sm font-medium">{zone.name}</span>
                <span className="text-muted-foreground mr-2 text-xs">
                  {zone.coordinates.length} points
                </span>
                <Button
                  size="icon-xs"
                  variant="ghost"
                  onClick={() => onZoneRemoved(zone.id)}
                  aria-label={`Remove ${zone.name}`}
                >
                  <Trash2 className="size-3.5 text-destructive" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}