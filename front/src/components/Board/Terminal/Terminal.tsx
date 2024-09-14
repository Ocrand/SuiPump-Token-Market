import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import SearchSection from "../SearchSection"; // 引入 SearchSection 组件
import "./Terminal.css";
import { Token } from '../../../store/types';
import axiosInstance from "../../../axiosInstance.ts";

const CACHE_KEY = 'cachedData';
const CACHE_TIMESTAMP_KEY = 'cacheTimestamp';
const CACHE_INTERVAL = 2 * 60 * 1000; // 2分钟


const Terminal: React.FC = () => {
  const [Cointokens, setTokens] = useState<Token[]>([]);
  const [filteredToken, setFilteredToken] = useState<Token | null>(null);
  const [order, setOrder] = useState<string>("desc");
  const navigate = useNavigate();
  const client = new SuiClient({
    url: getFullnodeUrl('testnet'),
  });
  const [retryCount, setRetryCount] = useState<{ [key: string]: number }>({});


  const handleImageError = (id: string) => {
    setRetryCount((prev) => {
      const currentCount = prev[id] || 0;

      // 如果重试次数小于3次，则尝试重新加载
      if (currentCount < 3) {
        return {...prev, [id]: currentCount + 1};
      }

      return prev;
    });
  }


  useEffect(() => {
    const fetchTokens = async () => {
      try {
        const response = await axiosInstance.get('/api/get-info/',{
          params: {
            order: order,
          }
        })
        const data = response.data;
        localStorage.setItem('cachedData', JSON.stringify(data));
        console.log("tokenInfo:", data);
        const updatedData = await Promise.all(
            data.map(async (coin: { boudingcurve: string; }) => {
              if (coin.boudingcurve) {
                const boudingCurve = coin.boudingcurve;
                const txn = await client.getObject({
                  id: boudingCurve,
                  options: { showContent: true },
                });

                if (txn.data && txn.data.content && 'fields' in txn.data.content) {
                  const fields = txn.data.content.fields;
                  if ('sui_balance' in fields && 'token_balance' in fields && 'virtual_sui_amt' in fields) {
                    const Factor = 1_000_000_000;
                    const suiBalance = Number(fields.sui_balance) / Factor;
                    const virtualSuiAmt = Number(fields.virtual_sui_amt) / Factor;
                    const marketCap = suiBalance + virtualSuiAmt;

                    // 返回包含 marketCap 的新对象
                    return { ...coin, marketCap };
                  }
                }
              }
              return coin;
            })
        );

        // 更新缓存和时间戳
        localStorage.setItem(CACHE_KEY, JSON.stringify(updatedData));
        localStorage.setItem(CACHE_TIMESTAMP_KEY, new Date().getTime().toString());
        setTokens(updatedData);
        console.log(updatedData);
      } catch (error) {
        console.error("Error fetching tokens:", error);
      }
    };
    const cachedData = localStorage.getItem(CACHE_KEY);
    const cacheTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    const currentTime = new Date().getTime();

    if (cachedData && cacheTimestamp && (currentTime - parseInt(cacheTimestamp)) < CACHE_INTERVAL) {
      console.log('Loading data from cache...');
      setTokens(JSON.parse(cachedData));
    } else {
      fetchTokens();
    }

    const intervalId = setInterval(() => {
      fetchTokens();
    }, CACHE_INTERVAL);

    return () => clearInterval(intervalId); // 在组件卸载时清除定时器
  }, [order]);



  const handleItemClick = (token: Token) => {
    navigate(`/trade/${token.digest}`);
  };

  const formatMarketCap = (marketCap: number): string => {
    if (marketCap >= 1000) {
      return (marketCap / 1000).toFixed(10) + "k";
    }
    return marketCap.toString();
  };

  const handleTokenFound = (token: Token | null) => {
    setFilteredToken(token);
  };

  return (

      <div className="terminal">
        <SearchSection tokens={Cointokens} onTokenFound={handleTokenFound} />
        <h3 style={{ color: "white" }}>Terminal</h3>
        <div className="controls">
          <label>
            order:
            <select value={order} onChange={(e) => setOrder(e.target.value)}>
              <option value="desc">desc</option>
              <option value="asc">asc</option>
            </select>
          </label>
        </div>



        <div className="token-list">
          {filteredToken ? (
              <div
                  className="token-item"
                  key={filteredToken.id}
                  onClick={() => handleItemClick(filteredToken)}
              >
                {filteredToken.id}.
                <img src={filteredToken.imageUrl} alt="Token" />
                <div className="item-content">
                  <div style={{ color: "lightblue" }}>
                    Created by {filteredToken.createdBy}{" "}
                  </div>
                  <div style={{ color: "greenyellow" }}>
                    market cap: {formatMarketCap(filteredToken.marketCap)}
                  </div>
                  <div className="item-des">
                    {filteredToken.ticker}: {filteredToken.description}
                  </div>
                  <div style={{ color: "white", fontWeight: "bold" }}>
                    token : {filteredToken.digest}
                  </div>
                </div>
              </div>
          ) : (
              Cointokens.map((token) => (
                  <div
                      className="token-item"
                      key={token.id}
                      onClick={() => handleItemClick(token)}
                  >
                    {token.id}.
                    <img src={token.imageUrl}
                         alt="Token"
                         onError={() => handleImageError(token.id.toString())}
                        // 强制浏览器重新加载图片
                         key={retryCount[token.id] || 0}/>
                    <div className="item-content">
                      <div style={{ color: "lightblue" }}>
                        Created by {token.createdBy}{" "}
                      </div>
                      <div style={{ color: "greenyellow" }}>
                        market cap: {formatMarketCap(token.marketCap)}
                      </div>
                      <div className="item-des">
                        {token.ticker}: {token.description}
                      </div>
                      <div style={{ color: "white", fontWeight: "bold" }}>
                        token : {token.digest}
                      </div>
                    </div>
                  </div>
              ))
          )}
        </div>
      </div>
  );
};

export default Terminal;

