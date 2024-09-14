import { useEffect, useState } from "react";

interface Tx {
  account: string;
  type: boolean; // true for buy, false for sell
  SUI: number;
  coin: number;
  date: string;
  transaction: string;
}

interface TxProps {
  transaction: Tx[];
  coin: string;
}

const Tx: React.FC<TxProps> = ({ transaction, coin }) => {
  const [txs, setTxs] = useState<Tx[]>([]);

  useEffect(() => {
    setTxs(transaction);
  }, [transaction]);

  return (
    <div>
      <div className="tx-list">
        <div className="tx-header">
          <div className="tx-header-item">Account</div>
          <div className="tx-header-item">Type</div>
          <div className="tx-header-item">SUI</div>
          <div className="tx-header-item">{coin}</div>
          <div className="tx-header-item">Date</div>
          <div className="tx-header-item">Transaction</div>
        </div>
        {txs.map((tx, index) => (
          <div className="tx-item" key={index}>
            <div className="tx-item-content">
              <div>{tx.account}</div>
              <div>{tx.type ? "Buy" : "Sell"}</div>
              <div>{tx.SUI}</div>
              <div>{tx.coin}</div>
              <div>{tx.date}</div>
              <div>{tx.transaction}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Tx;
