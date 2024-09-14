// import { useSuiClientInfiniteQuery } from "@mysten/dapp-kit";
// import { SuiEvent } from "@mysten/sui/client";
// import { useMemo } from "react";

// const EventSubscriber: React.FC = () => {
//   const {
//     data: pumpEvents,
//     refetch: refetchEvents,
//     fetchNextPage,
//     hasNextPage,
//   } = useSuiClientInfiniteQuery(
//     "queryEvents",
//     {
//       query: {
//         MoveModule: {
//           package:
//             "0xb1e82eb8efe2690827fe11deea6dccf869a37beb651c388a962b9ebd48c82675",
//           module: "curve",
//         },
//       },
//       order: "descending",
//     },
//     {
//       refetchInterval: 10000,
//     }
//   );
//   const newSwapEvents = useMemo(() => {
//     return (
//       pumpEvents?.pages.map((pEvent) =>
//         pEvent.data.filter((event) => event.type.includes("SwapEvent"))
//       ) || []
//     ).flat(Infinity) as SuiEvent[];
//   }, [pumpEvents]);
//   console.log(
//     "🚀 ~ file: App.tsx:130 ~ SwapEvents ~ SwapEvents:",
//     newSwapEvents.sort((a, b) => Number(b.timestampMs) - Number(a.timestampMs))
//   );

//   const newListEvent = useMemo(() => {
//     return (
//       pumpEvents?.pages.map((pEvent) =>
//         pEvent.data.filter((event) =>
//           event.type.includes("BondingCurveListedEvent")
//         )
//       ) || []
//     ).flat(Infinity) as SuiEvent[];
//   }, [pumpEvents]);
//   console.log(
//     "🚀 ~ file: App.tsx:130 ~ BondingCurveListedEvent ~ BondingCurveListedEvent:",
//     newListEvent.sort((a, b) => Number(b.timestampMs) - Number(a.timestampMs))
//   );
//   return (
//     <div>
//       <div></div>
//     </div>
//   );
// };

// export default EventSubscriber;
