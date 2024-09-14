// useEventSubscriber.ts
import { useSuiClientInfiniteQuery } from "@mysten/dapp-kit";
import { SuiEvent } from "@mysten/sui/client";
import { useMemo } from "react";

export const useEventSubscriber = (packageId: string) => {
  const {
    data: pumpEvents,
    refetch: refetchEvents,
    fetchNextPage,
    hasNextPage,
  } = useSuiClientInfiniteQuery(
    "queryEvents",
    {
      query: {
        MoveModule: {
          package: packageId,
          module: "curve",
        },
      },
      order: "descending",
    },
    {
      refetchInterval: 10000,
    }
  );

  const newSwapEvents = useMemo(() => {
    return (
      pumpEvents?.pages.map((pEvent) =>
        pEvent.data.filter((event) => event.type.includes("SwapEvent"))
      ) || []
    ).flat(Infinity) as SuiEvent[];
  }, [pumpEvents]);

  const newListEvent = useMemo(() => {
    return (
      pumpEvents?.pages.map((pEvent) =>
        pEvent.data.filter((event) =>
          event.type.includes("BondingCurveListedEvent")
        )
      ) || []
    ).flat(Infinity) as SuiEvent[];
  }, [pumpEvents]);

  return {
    newSwapEvents: newSwapEvents.sort(
      (a, b) => Number(b.timestampMs) - Number(a.timestampMs)
    ),
    newListEvent: newListEvent.sort(
      (a, b) => Number(b.timestampMs) - Number(a.timestampMs)
    ),
    refetchEvents,
    fetchNextPage,
    hasNextPage,
  };
};
