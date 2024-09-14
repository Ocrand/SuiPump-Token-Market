import { useSuiClientQuery } from "@mysten/dapp-kit";
import React, { useEffect } from "react";

function Balance() {
  const [address, setAddress] = React.useState<string>("");
  useEffect(() => {
    const storedWalletInfo = localStorage.getItem("walletState");
    if (storedWalletInfo) {
      const parsedWalletInfo = JSON.parse(storedWalletInfo);

      if (parsedWalletInfo.connectedWallet) {
        setAddress(parsedWalletInfo.connectedWallet.account);
        console.log(address);
      }
    }
  }, []);
  const { data, isPending, isError, error } = useSuiClientQuery(
    "getBalance",
    {
      owner: address,
    },
    {
      gcTime: 10000,
    }
  );

  if (isPending) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Error: {error.message}</div>;
  }
  const sui_balance = (parseInt(data.totalBalance) / 1_000_000_000).toFixed(2);
  return (
    <>
      <div>{sui_balance}</div>
    </>
  );
}

export default Balance;
