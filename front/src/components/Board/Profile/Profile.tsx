import React, { useEffect, useState} from "react";
import "./Profile.css"; // 引入你的CSS文件
import { openModal } from "../../../store/store";
import { useDispatch } from "react-redux";
import Header from "../../Board/Header/Header.tsx";
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import {fetchDataWithRetry} from "../../../axiosInstance.ts";

interface CoinBalance {
  balance: number;
  coinType: string;
  coinPreviousTransaction: string;
}


interface CoinInfo {
  digest: string;
  balance: number;
  name: string;
  symbol: string;
  imageUrl: string;
}
// interface Reply {
//   name: string;
//   imageUrl: string;
//   content: string;
// }
interface Token {
  imageUrl: string;
  createdBy: string;
  name: string;
  ticker: string;
  description: string;
  digest: string;
  boudingcurve: string;
  marketCap: number
}

const Profile: React.FC = () => {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState<string>("coins held");
  const [address, setAddress] = React.useState<string>("");
  const [avatar, setAvatar] = React.useState<string>("");
  const [name, setName] = React.useState<string>("");
  // const [coin_info, setCoin] = useState<Coin[]>();
  const [coinInfo, setCoinInfo] = useState<CoinInfo[]>([]);
  // const [reply_info, setReply] = useState<Reply[]>();
  const [coin_created, setCreated] = useState<Token[]>();
  // 按钮点击事件
  //@ts-ignore
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const now = Date.now();
  const Minutes = 2 * 60 * 1000;
  const client = new SuiClient({
    url: getFullnodeUrl('testnet'),
  });
  // 图片重连
  const [retryCount, setRetryCount] = useState<{ [key: number]: number }>({});

  const handleImageError = (index: number) => {
    setRetryCount(prev => {
      const currentCount = prev[index] || 0;

      // 如果重试次数小于3次，则尝试重新加载
      if (currentCount < 3) {
        return { ...prev, [index]: currentCount + 1 };
      }

      return prev;
    });
  };


  useEffect(() => {
    if (activeTab === 'Tokens created') {
      fentchCoinCreated(address);
    }

    if (activeTab === 'Tokens held') {
      fetchCoinInfo(address);
    }
  }, [activeTab, address]); // 侦听 activeTab 和 address 的变化

  const fetchCoinInfo = async (address: string) => {

    // 检查本地存储中的缓存数据
    const cachedCoinInfo = JSON.parse(localStorage.getItem('coinInfoCache') as string);
    // console.log("cachedCoinInfo",cachedCoinInfo);
    const CoinlastFetchTime = localStorage.getItem('CoinlastFetchTime');

    if (cachedCoinInfo && CoinlastFetchTime && now - Number(CoinlastFetchTime) < Minutes) {
      setCoinInfo(cachedCoinInfo);
      return;
    }
    setLoading(true);
    setMessage(''); // 清除之前的信息
    try {

      const allCoins = await client.getAllCoins({
        owner: address,
      });
      const Coins = allCoins.data;
      const filteredCoins = Coins.filter(coin => coin.coinType !== "0x2::sui::SUI");
      const balanceIf = filteredCoins.reduce((acc: { [key: string]: CoinBalance }, coin) => {
        const coinType = coin.coinType;
        if (!acc[coinType]) {
          acc[coinType] = {
            balance: 0,
            coinType,
            coinPreviousTransaction: coin.previousTransaction,
          };
        }
        acc[coinType].balance += Number(coin.balance);
        return acc;
      }, {});

      const mergedArray = Object.values(balanceIf);

      console.log("1111",mergedArray);
      // const balanceIf = filteredCoins.map(coin => ({
      //   balance: coin.balance,
      //   coinType: coin.coinType,
      //   coinPreviousTransaction: coin.previousTransaction,
      // }));
      // console.log("Filtered Result:", balanceIf);
      const detailedCoins = [];
      let tradehash = "createrIdtxn.data.id";
      // 接下来的处理和之前一样
      //
      for (const singleCoinInfo of mergedArray) {
        try {

          const txnPreviousTransaction = await client.getTransactionBlock({
            digest: singleCoinInfo.coinPreviousTransaction,
            options: {
              showEffects: true,
              showInput: false,
              showEvents: false,
              showObjectChanges: false,
              showBalanceChanges: false,
            },
          });
          console.log(`Coin ${singleCoinInfo.coinPreviousTransaction} details:`, txnPreviousTransaction);
          //@ts-ignore
          // const Coindigest = txnPreviousTransaction.effects.dependencies[1];
          // console.log("digest", Coindigest);
          let boundingcruveId = "";
          if (txnPreviousTransaction.effects && txnPreviousTransaction.effects.sharedObjects) {
            if (txnPreviousTransaction.effects.sharedObjects.length !== null) {
              for(const sharedObject of txnPreviousTransaction.effects.sharedObjects){
                console.log("sharedObject",sharedObject);
                const sharedObjectIdtxn = await client.getObject({
                  //@ts-ignore
                  id: sharedObject.objectId,
                  options: { showContent: true,
                    showPreviousTransaction: true},
                });
                console.log('sharedObjectIdtxn:', sharedObjectIdtxn);

                const bondingCurveRegex = /curve::BondingCurve/;
                // @ts-ignore
                if (bondingCurveRegex.test(sharedObjectIdtxn.data.content.type)) {
                  boundingcruveId = sharedObject.objectId;

                }
              }
              console.log("bd", boundingcruveId);
              const boundingcruveIdtxn = await client.getObject({
                id: boundingcruveId,
                options: { showContent: true },
              });
              // console.log('boundingcruveIdObject:', boundingcruveIdtxn);

              if (boundingcruveIdtxn.data && boundingcruveIdtxn.data.content) {
                const bdtxt = boundingcruveIdtxn.data.content;
                if('fields' in bdtxt){
                  if ('creator' in bdtxt.fields) {
                    // console.log("bd",bdtxt.fields.creator);
                    const createrId = String(bdtxt.fields.creator);

                    const objects = await client.getOwnedObjects({
                      owner: createrId,
                    });
                    console.log('objects:', objects);

                    for (const object of objects.data) {
                      const createrIdtxn = await client.getObject({
                        //@ts-ignore
                        id: object.data.objectId,
                        options: { showContent: true,
                          showPreviousTransaction: true},
                      });
                      // console.log('createrIdtxn:', createrIdtxn);
                      if(createrIdtxn.data && createrIdtxn.data.content &&'type' in createrIdtxn.data.content && createrIdtxn.data.content.type == '0x2::package::UpgradeCap'){
                        // console.log("1232131",createrIdtxn.data);
                        if (createrIdtxn.data.previousTransaction){
                          // console.log("previousTransaction",createrIdtxn.data.previousTransaction);
                          // const packageID = createrIdtxn.data.content.fields.package; // 假设 packageID 是 createrIdtxn.data.id
                          // console.log("packageID",packageID);
                          tradehash = createrIdtxn.data.previousTransaction; // 存储 packageID 和 hash 的对应关系

                        }
                      }
                    }

                    for (const object of objects.data) {
                      const createrIdtxn = await client.getObject({
                        //@ts-ignore
                        id: object.data.objectId,
                        options: { showContent: true,
                          showPreviousTransaction: true},
                      });

                      //@ts-ignore
                      if ('fields' in createrIdtxn.data.content && 'type' in createrIdtxn.data.content && 'icon_url' in createrIdtxn.data.content.fields) {

                        const regex = /CoinMetadata<([^>]+)>/;

                        //@ts-ignore
                        const Cointype = createrIdtxn.data.content.type;
                        // console.log('fields:', Cointype);
                        const match = Cointype.match(regex);

                        if (match) {
                          // console.log('match:', match);
                          const type = match[1];
                          console.log('type:', type);
                          const normalizeType = (type: string) => type.replace(/^0x0*/, '0x');
                          // const matchingCoin = mergedArray.find(coin => coin.coinType === type);
                          const matchingCoin = mergedArray.find(coin => {
                            const normalizedCoinType = normalizeType(coin.coinType);
                            const normalizedType = normalizeType(type);
                            console.log(`Comparing normalized coinType: ${normalizedCoinType} with normalized type: ${normalizedType}`);
                            return normalizedCoinType === normalizedType;
                          });
                          console.log('matchingCoin:', matchingCoin);
                          detailedCoins.push({
                            digest: tradehash,
                            //@ts-ignore
                            balance: matchingCoin.balance,
                            //@ts-ignore
                            name: createrIdtxn.data.content.fields.name || "Unknown Coin",
                            //@ts-ignore
                            symbol: createrIdtxn.data.content.fields.symbol || "SYM",
                            //@ts-ignore
                            imageUrl: createrIdtxn.data.content.fields.icon_url || "none",

                          });
                          console.log('detailedCoins:', detailedCoins);

                        } else {
                          console.log("No match found");
                        }
                      }
                    }
                  }
                }
              } else {
                console.error("boundingcruveIdtxn.data is null or undefined");
              }
            }
          } else {
            console.error("sharedObjects is undefined");
          }
        } catch (error) {
          console.error(`Failed to fetch details for coinObjectId: ${singleCoinInfo.coinPreviousTransaction}`, error);
        }
      }
      //@ts-ignore
      setCoinInfo(detailedCoins);
      // 更新本地存储中的缓存数据
      localStorage.setItem('coinInfoCache', JSON.stringify(detailedCoins));
      localStorage.setItem('CoinlastFetchTime', String(now));
    } catch (error) {
      console.error('Failed to fetch coins:', error);
      setMessage('Failed to fetch coins.');
    } finally {
      setLoading(false);
    }
  };

  const formatMarketCap = (marketCap: number): string => {
    if (marketCap >= 1000) {
      return (marketCap / 1000).toFixed(10) + "k";
    }
    return marketCap.toString();
  };


  useEffect(() => {
    const storedWalletInfo = localStorage.getItem("walletState");
    if (storedWalletInfo) {
      const parsedWalletInfo = JSON.parse(storedWalletInfo);

      if (parsedWalletInfo.connectedWallet) {
        setAddress(parsedWalletInfo.connectedWallet.account);
        setAvatar(parsedWalletInfo.connectedWallet.avatar);
        setName(parsedWalletInfo.connectedWallet.name);
        console.log(address);
      }
    }
  }, []);

  //获取replies
  // const fentchReplies = async (address: string) => {
  //   try {
  //     const response = await axios.post(
  //       `http://localhost:8080/api/user-reply-info`,
  //       address
  //     );
  //     const data = response.data;
  //     setReply(data);
  //   } catch (error) {
  //     console.error("Error fentch replies:", error);
  //   }
  // };

  //获取coin-created信息
  const fentchCoinCreated = async (address: string) => {
    try {
      // 检查本地存储中的缓存数据
      const cachedData = JSON.parse(localStorage.getItem('cachedData') as string);
      // console.log("cachedCoinInfo",cachedCoinInfo);
      const lastFetchTime = localStorage.getItem('lastFetchTime');

      if (cachedData && lastFetchTime && now - Number(lastFetchTime) < Minutes) {
        setCreated(cachedData);
        return;
      }
      const data = await fetchDataWithRetry('/api/get-info/', {address});

      // const data = response;
      console.log("tokenInfo:", data);
      const updatedData = await Promise.all(
          data.map(async (coin: { boudingcurve: string; }) => {
            if (coin.boudingcurve) {
              const boudingCurve = coin.boudingcurve;
              // console.log("bd", boudingCurve);
              // 查询指定 ID 的对象信息
              const txn = await client.getObject({
                id: boudingCurve,
                // fetch the object content field
                options: { showContent: true },
              });

              if (txn.data && txn.data.content && 'fields' in txn.data.content) {
                const fields = txn.data.content.fields;
                if ('sui_balance' in fields && 'token_balance' in fields && 'virtual_sui_amt' in fields) {
                  const Factor = 1_000_000_000;
                  const suiBalance = Number(fields.sui_balance) / Factor;
                  const virtualSuiAmt = Number(fields.virtual_sui_amt) / Factor;
                  const marketCap = suiBalance + virtualSuiAmt;
                  console.log("marketCap", marketCap);
                  // 返回包含 marketCap 的新对象
                  return { ...coin, marketCap };
                }
              }
            }
            // 如果没有 boudingcurve 或者未能获取 marketCap，返回原始的 coin
            return coin;
          })
      );
      //将更新后的数据存入缓存
      localStorage.setItem('cachedData', JSON.stringify(updatedData));
      localStorage.setItem('lastFetchTime', String(now));
      //将更新后的数组传递到前端
      setCreated(updatedData);
      // setCreated(data);
    } catch (error) {
      console.error("Error fentch coin created:", error);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "Tokens held":
        // return renderCoinsHeld();
        return (
            <div className="coin-Box">
              <div className="coin-header">
                <div>TokenImage</div>
                <div>TokenName</div>
                <div>TokenBalance</div>
                <div>TokenSymbol</div>
                <div>Function</div>
              </div>
              <div>
                {message && <p>{message}</p>}
              </div>
              {coinInfo?.map((coin, index) => (
                  <div key={index} className="coin-row">
                    <div className="coin-image">
                      <img
                          src={coin.imageUrl.startsWith('http') ? coin.imageUrl : "https://via.placeholder.com/64"}
                          className="rounded-circle"
                      />
                    </div>
                    <div className="coin-name">
                      {coin.name}
                    </div>
                    <div className="coin-balance">
                      {Intl.NumberFormat('en-US').format(coin.balance)}
                    </div>
                    <div className="coin-symbol">
                      {coin.symbol}
                    </div>
                    <div className="coin-function">
                      <button onClick={() => window.location.href = `/trade/${coin.digest}`}>View
                      </button>
                    </div>
                  </div>
              ))}
            </div>
        );
      // case "replies":
      //   return (
      //       <div>
      //         {reply_info?.map((reply, index) => (
      //             <div key={index} className="coin-row">
      //               <div className="coin-image">
      //                 <img
      //                     src={reply.imageUrl}
      //                     alt={reply.name}
      //                     className="rounded-circle"
      //                 />
      //               </div>
      //               <div className="coin-info">
      //                 <div>
      //                   {reply.name} {reply.content}
      //                 </div>
      //               </div>
      //             </div>
      //         ))}
      //       </div>
      //   );
      case "Tokens created":
        return (
            <div className="token-list">
              {coin_created?.map((token, index) => (
                  <div className="token-item" key={index} onClick={() => window.location.href = `/trade/${token.digest}`}>
                    <img src={token.imageUrl}
                         alt="Token"
                         onError={() => handleImageError(index)}
                        // 强制重新加载图片
                         key={retryCount[index] || 0}
                    />
                    <div className="item-content">
                      <div style={{color: "lightblue"}}>
                        TokenAddress: {token.createdBy}{" "}
                      </div>
                      <div style={{color: "greenyellow"}}>
                        market cap: {formatMarketCap(token.marketCap)}
                  </div>

                  {/*<div>replies: {token.replies}</div>*/}
                  <div style={{color: "lightgoldenrodyellow"}}>
                    Token Name: {token.name}
                  </div>
                  <div className="item-des">
                    {token.ticker}: {token.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (

    <>
      <div className="flex min-h-screen flex-col items-center justify-center gap-6">
        <Header />
      </div>
      <div className="container-profile">
        <div className="profile-modal">
          <div className="profile-info">
            <img src={avatar} className="profile-image" />
            <div className="profile-inner">
              <div>{name}</div>
              <a
                onClick={() => {
                  dispatch(openModal("profileModal"));
                }}
              >
                Edit Profile
              </a>
            </div>
          </div>
          <div className="profile-address">{address}</div>
        </div>

        <div className="nav-tabs">
          {["Tokens held", "Tokens created"].map((tab) => (
            <button
              key={tab}
              className={`nav-link ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
        {renderContent()}
      </div>
    </>
  );
};

export default Profile;
