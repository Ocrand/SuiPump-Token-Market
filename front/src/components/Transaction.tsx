// import {
//   ConnectButton,
//   useCurrentAccount,
//   useSignAndExecuteTransaction,
// } from "@mysten/dapp-kit";
// import { coinWithBalance, Transaction } from "@mysten/sui/transactions";
// import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
// import { useEffect, useState } from "react";
// import { getFaucetHost, requestSuiFromFaucetV0 } from "@mysten/sui/faucet";
// import { bcs } from "@mysten/sui/bcs";

// const Tr = () => {
//   const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
//   const [digest, setDigest] = useState("");
//   const currentAccount = useCurrentAccount();
//   const tx = new Transaction();

//   //   const client = new SuiClient({
//   //     url: getFullnodeUrl("testnet"),
//   //   });

//   //   useEffect(() => {
//   //     const handleSub = async () => {
//   //       const unsubscribe = await client.subscribeEvent({
//   //         filter: {
//   //           Sender:
//   //             "0x08fac7bc5b6c4402613dab4fcfb62934c3eef96c6b45480a3849cd2c3f0c73f7",
//   //         },
//   //         onMessage(event) {
//   //           console.log(event.packageId);
//   //         },
//   //       });
//   //       await unsubscribe();
//   //     };
//   //     handleSub();
//   //   }, []);

//   const handleFacet = async () => {
//     await requestSuiFromFaucetV0({
//       host: getFaucetHost("testnet"),
//       recipient:
//         "0x08fac7bc5b6c4402613dab4fcfb62934c3eef96c6b45480a3849cd2c3f0c73f7",
//     });
//   };

//   tx.setSender(
//     "0x08fac7bc5b6c4402613dab4fcfb62934c3eef96c6b45480a3849cd2c3f0c73f7"
//   );
//   tx.setGasBudget(100_000_000);

//   const packageId =
//     "0xb1e82eb8efe2690827fe11deea6dccf869a37beb651c388a962b9ebd48c82675";
//   const configurator =
//     "0xd0db370837cc32effb9efd1450f4a273398e06a4bb10f69e97a16271ea40ce1c";
//   const treasuryCap =
//     "0xc132977ed97be4bc86ceaf7b9148704894933179bbe2a39ebf798e5c7db8b5d7";
//   const metadata =
//     "0xfef9b4317e5a0bf0efd43b906663e87789aeb63292035221eb268a8db44478c6";
//   const type = packageId + "::coin::COIN";

//   //   const [coin1] = tx.splitCoins(tx.gas, [1_000_000_000]);

//   //Commented out coin2 since it is not used

//   //   const migrate_target = 10000_000000000;
//   //   const [bc] = tx.moveCall({
//   //     target: packageId + "::curve::list",
//   //     arguments: [
//   //       tx.object(configurator),
//   //       tx.object(treasuryCap),
//   //       tx.object(metadata),
//   //       tx.object(coin1),
//   //       tx.pure(bcs.option(bcs.string()).serialize("twitter").toBytes()),
//   //       tx.pure(bcs.option(bcs.string()).serialize("telegram").toBytes()),
//   //       tx.pure(bcs.option(bcs.string()).serialize("website").toBytes()),
//   //       tx.pure.u64(migrate_target),
//   //     ],
//   //     typeArguments: [type],
//   //   });

//   //   tx.moveCall({
//   //     target: packageId + "::curve::transfer",
//   //     arguments: [tx.object(bc)],
//   //     typeArguments: [type],
//   //   });

//   // tx.moveCall({
//   //   target: packageId + "::coin::set_coin_metadata_info",
//   //   arguments: [
//   //     tx.pure.string("Baby trump"),
//   //     tx.pure.string("BABYT"),
//   //     tx.pure.string("Baby trump is a meme coin!"),
//   //     tx.pure.string(
//   //       "https://www.google.com/imgres?q=guge&imgurl=https%3A%2F%2Fupload.wikimedia.org%2Fwikipedia%2Fcommons%2F7%2F76%2F%25E5%258F%25A4%25E6%25A0%25BC%25E9%2598%25B4%25E9%259C%25BE.jpg&imgrefurl=https%3A%2F%2Fen.wikipedia.org%2Fwiki%2FGuge&docid=9Ox3b9Jq4bmxUM&tbnid=4zSlaPy6oDYb0M&vet=12ahUKEwjQ8oeyu46HAxVFfGwGHVBRDrUQM3oECBgQAA..i&w=2560&h=1707&hcb=2&ved=2ahUKEwjQ8oeyu46HAxVFfGwGHVBRDrUQM3oECBgQAA"
//   //     ),

//   //     tx.object(treasuryCap),
//   //     tx.object(metadata),
//   //   ],
//   // });

//   const bdc =
//     "0x5ba0b65f2d28e8279351bb6ca757fbeb7355a15a2c2ba360e9da42c229a5099e";
//   const [coin2] = tx.splitCoins(tx.gas, [2_000_000_000]);
//   const [coin3] = tx.moveCall({
//     target: packageId + "::curve::buy",
//     arguments: [
//       tx.object(bdc),
//       tx.object(configurator),
//       tx.object(coin2),
//       tx.pure.u64(2_000_000_000),
//     ],
//     typeArguments: [type],
//   });

//   tx.transferObjects(
//     [coin3],
//     "0x71aa8d4f10878cb94d9cc15626571a434d90e72a129e0e9ab6730ad08dfcfdc6"
//   );

//   //   const [coin4] = tx.moveCall({
//   //     target: packageId + "::curve::sell",
//   //     arguments: [
//   //       tx.object(bdc),
//   //       tx.object(configurator),
//   //       tx.object(
//   //         coinWithBalance({
//   //           balance: 235325841176441,
//   //           type: type,
//   //         })
//   //       ),
//   //       tx.pure.u64(235325),
//   //     ],
//   //     typeArguments: [type],
//   //   });

//   //   tx.transferObjects(
//   //     [coin4],
//   //     "0x71aa8d4f10878cb94d9cc15626571a434d90e72a129e0e9ab6730ad08dfcfdc6"
//   //   );

//   // To avoid unused value error, make sure all created values are used
//   //   tx.transferObjects(
//   //     [bc],
//   //     "0x71aa8d4f10878cb94d9cc15626571a434d90e72a129e0e9ab6730ad08dfcfdc6"
//   //   );

//   return (
//     <div style={{ padding: 20, border: 1 }}>
//       <ConnectButton />
//       {currentAccount && (
//         <>
//           <div>
//             <button
//               onClick={() => {
//                 signAndExecuteTransaction(
//                   {
//                     transaction: tx,
//                     chain: "sui:testnet",
//                   },
//                   {
//                     onSuccess: (result) => {
//                       console.log("executed transaction", result);
//                       setDigest(result.digest);
//                     },
//                   }
//                 );
//               }}
//             >
//               Sign and execute transaction
//             </button>
//             <button onClick={handleFacet}>faucet</button>
//           </div>
//           <div>Digest: {digest}</div>
//         </>
//       )}
//     </div>
//   );
// };
// export default Tr;
