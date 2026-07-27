"use client";

import { FILTERS } from "@/lib/photobooth-data";
import { usePhotobooth } from "./photobooth-provider";

export function FilterPanel() {
  const { state, dispatch } = usePhotobooth();
  const selectedPlacement = state.selectedSlotId ? state.placements[state.selectedSlotId] : null;

  return (
    <div className="panel p-5">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-roseInk">Filters</h2>
        <p className="text-sm text-rose-700/80">Apply a look to the selected slot or the whole strip.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {FILTERS.map((filter) => (
          <button
            key={filter.id}
            className="button-secondary justify-start"
            onClick={() => {
              if (selectedPlacement && state.selectedSlotId) {
                dispatch({
                  type: "update-slot",
                  slotId: state.selectedSlotId,
                  patch: { filter: filter.id }
                });
              }
            }}
          >
            {filter.label}
          </button>
        ))}
      </div>
      <button
        className="button-primary mt-4"
        onClick={() =>
          dispatch({
            type: "apply-filter-all",
            filter: selectedPlacement?.filter ?? "original"
          })
        }
      >
        Apply selected filter to all
      </button>
    </div>
  );
}
