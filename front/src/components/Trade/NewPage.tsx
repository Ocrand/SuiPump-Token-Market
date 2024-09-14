import React, { useEffect, useState } from "react";
import "./NewPage.css";
import { useParams } from "react-router-dom";
import Header from "../Board/Header/Header.tsx";
import Tx from "./Tx/Tx";
import "./Tx/Tx.css";
import Modal from "react-modal";
import { coinWithBalance, Transaction } from "@mysten/sui/transactions";
import { useEventSubscriber } from "../../useEventSubscriber";
import { useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { RootState, closeModal, openModal } from "../../store/store";
import { useDispatch, useSelector } from "react-redux";
import FileUploadWithIcon from "../Board/FileUploadWithIcon";
import axiosInstance from "../../axiosInstance";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend} from 'chart.js';
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";

// 注册插件
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);


interface Token {
  name: string;
  image: string;
  ticker: string;
  description: string;
  package_id: string;
  tresury: string;
  metadata: string;
  configurator: string;
  boudingcurve: string;
}
interface Reply {
  hash: string;
  name: string;
  imageUrl: string | undefined;
  content: string;
}
// SwapEvent的返回类型
type SwapParsedJson = {
  bc_id: string;
  input_amount: string;
  is_buy: boolean;
  output_amount: string;
  sender: string;
  sui_reserve_val: string;
  token_reserve_val: string;
  token_type: string;
};



const TradingApp: React.FC = () => {
  const { hash } = useParams<{ hash: string }>();
  const [activeDiv, setActiveDiv] = useState<string>("Trends");
  const [buysellDiv, setBuySell] = useState<string>("Buy");
  const [inputValue, setInputValue] = useState<number | string>("");
  const [buyAndsell, setBuyAndSell] = useState<boolean>(true);
  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [userAccount, setUserAccount] = useState<string>("UserAccount");
  const [tokenInfo, setTokenInfo] = useState<Token | null>(null);
  const [ticker, setTicker] = useState<string>("BABYT");
  const [currentAccount, setCurrentAccount] = useState("");
  // 代币实时信息
  const [suiBalance, setSuiBalance] = useState<number | null>(null);
  const [tokenBalance, setTokenBalance] = useState<number | null>(null);
  const [tokenPrice, setTokenPrice] = useState<number | null>(null);
  const [priceHistory, setPriceHistory] = useState<{ time: string, price: number }[]>([]);



  const [packageid, setPackageId] = useState(
      "0xb1e82eb8efe2690827fe11deea6dccf869a37beb651c388a962b9ebd48c82675"
  );
  // const [reply_info, setReply] = useState<Reply[]>();
  const [reply, setRep] = useState<Reply>({
    hash: "",
    name: "",
    imageUrl: undefined,
    content: "",
  });
  // console.log("hash:", hash);
  const dispatch = useDispatch();
  const activeModal = useSelector(
      (state: RootState) => state.modal.activeModal
  );
  const [boudingCurve, setBoundingCurve] = useState<string>(
      "0x46082b845dfa5d03348a6b675109843a380a6ecca2db130e6a869bf2cf2c3166"
  );
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const [digest, setDigest] = useState("");
  // const [marketCap, setMarketCap] = useState(4200);
  const [marketCap, setMarketCap] = useState<number | undefined>(undefined);
  const { newSwapEvents } = useEventSubscriber(packageid);

  useEffect(() => {

    const storedWalletInfo = localStorage.getItem("walletState");
    console.log("storedWalletInfo:", storedWalletInfo);
    if (storedWalletInfo) {
      const parsedWalletInfo = JSON.parse(storedWalletInfo);
      const walletInfo = parsedWalletInfo.connectedWallet;
      if (walletInfo) {
        const walletInfo = parsedWalletInfo.connectedWallet;
        setUserAccount(walletInfo.name);
        setCurrentAccount(walletInfo.account);
      }

    }

  }, [hash]);


  useEffect(() => {
    if (hash) {
      fetchTokenInfo(hash);
      // fentchReplies(hash);
    }
  }, [hash]);



  useEffect(() => {
    if (tokenInfo) {
      setPackageId(tokenInfo.package_id);
      setBoundingCurve(tokenInfo.boudingcurve);
      setTicker(tokenInfo.ticker);
    }
    console.log("tokenInfo:", tokenInfo);
    if(boudingCurve!="0x46082b845dfa5d03348a6b675109843a380a6ecca2db130e6a869bf2cf2c3166") {
      const intervalId = setInterval(fetchObjectData, 5000); // 每1秒调用一次 fetchObjectData

      return () => clearInterval(intervalId); // 清理定时器
    }
  }, [tokenInfo]);



  const client = new SuiClient({
    url: getFullnodeUrl('testnet'),
  });

  const fetchObjectData = async () => {
    try {
      console.log("bd", boudingCurve);
      // 查询指定 ID 的对象信息
      const txn = await client.getObject({
        id: boudingCurve,
        // fetch the object content field
        options: { showContent: true },
      });

      // 检查 hash 是否有效
      if (!hash) {
        console.error("Invalid hash:", hash);
        return;
      }

      if (txn.data && txn.data.content && 'fields' in txn.data.content) {
        const fields = txn.data.content.fields;
        console.log(fields);
        if ('sui_balance' in fields && 'token_balance' in fields && 'virtual_sui_amt' in fields) {
            // 更新状态
            const Factor = 1_000_000_000;
            const suiBalance = Number(fields.sui_balance) / Factor;
            const tokenBalance = Number(fields.token_balance) / Factor;
            const virtualSuiAmt = Number(fields.virtual_sui_amt) / Factor;
            const tokenPrice = (suiBalance + virtualSuiAmt) / tokenBalance;
            setMarketCap(suiBalance + virtualSuiAmt);
            setSuiBalance(suiBalance);
            setTokenBalance(tokenBalance);
            setTokenPrice(tokenPrice);

            // 保存历史价格数据
            setPriceHistory(prevHistory => [
              ...prevHistory,
              { time: new Date().toLocaleTimeString(), price: tokenPrice }
            ]);
        }
        else {
          alert("未找到该对象的相关信息。");
        }
      } else {
        alert("未找到该对象的相关信息。");
      }

    } catch (error) {
      console.error("Error fetching object:", error);
      alert("获取代币信息失败，请稍后再试。");
    }
  };
  // const options = {
  //   // responsive: true,
  //   // maintainAspectRatio: true, /* 使图表不保持默认的宽高比 */
  //   scales: {
  //     x: {
  //       title: {
  //         display: true,
  //         text: '时间',
  //       },
  //     },
  //     y: {
  //       title: {
  //         display: true,
  //         text: '价格 (SUI)',
  //       },
  //       beginAtZero: false,
  //       suggestedMin: Math.min(...priceHistory.map(entry => entry.price)) * 0.9,
  //       suggestedMax: Math.max(...priceHistory.map(entry => entry.price)) * 1.1,
  //     },
  //   },
  //   plugins: {
  //     tooltip: {
  //       callbacks: {
  //         label: function(context: TooltipItem<'line'>) {
  //           const value = context.raw;
  //           console.log(value);
  //           return `代币价格 (SUI): ${value}`
  //         }
  //       }
  //     }
  //   }
  // };
  //
  // const CoinData = {
  //   labels: priceHistory.map(entry => entry.time),
  //   datasets: [
  //     {
  //       label: '代币价格 (SUI)',
  //       data: priceHistory.map(entry => entry.price.toExponential(8)),
  //       fill: false,
  //       borderColor: 'rgba(75,192,192,1)',
  //       tension: 0.1,
  //     },
  //   ],
  // };
  const visibleDataPoints = 10; // 一次显示的点数
  const [sliderValue, setSliderValue] = useState(priceHistory.length - visibleDataPoints);

  // 根据滑块值计算起始索引，确保总是显示最新的8个点
  const startIndex = Math.max(0, sliderValue);

  // 提取当前可见的数据
  const visibleHistory = priceHistory.slice(startIndex, startIndex + visibleDataPoints);

  const options = {
    scales: {
      x: {
        title: {
          display: true,
          text: '时间',
        },
      },
      y: {
        title: {
          display: true,
          text: '价格 (SUI)',
        },
        beginAtZero: false,
        suggestedMin: Math.min(...visibleHistory.map(entry => entry.price)) * 0.9,
        suggestedMax: Math.max(...visibleHistory.map(entry => entry.price)) * 1.1,
      },
    },
    plugins: {
      tooltip: {
        callbacks: {
          //@ts-ignore
          label: function (context) {
            const value = context.raw;
            return `代币价格 (SUI): ${value}`;
          },
        },
      },
    },
  };

  const CoinData = {
    labels: visibleHistory.map((entry) => entry.time),
    datasets: [
      {
        label: '代币价格 (SUI)',
        data: visibleHistory.map((entry) => entry.price.toExponential(8)),
        fill: false,
        borderColor: 'rgba(75,192,192,1)',
        tension: 0.1,
      },
    ],
  };
  //@ts-ignore
  const handleSliderChange = (event) => {
    const newSliderValue = parseInt(event.target.value, 10);
    setSliderValue(newSliderValue);
  };


  //获取reply
  // const fentchReplies = async (hash: string) => {
  //   try {
  //     const response = await axios.post(
  //         `http://localhost:8080/api/token-reply-info`,
  //         hash
  //     );
  //     const data = response.data;
  //     setReply(data);
  //   } catch (error) {
  //     console.error("Error fentch replies:", error);
  //   }
  // };
//格式化marketCap
  const formatMarketCap = (marketCap: number | undefined): string => {
    if (marketCap === undefined) {
      // 如果没有获取到值，则返回 "loading"
      return "loading...";
    } else if (marketCap >= 1000) {
      // 如果市场资本额大于等于 1000，则转换为千位格式
      return (marketCap / 1000).toFixed(12) + "k";
    } else {
      // 否则直接返回数值字符串
      return marketCap.toString();
    }
  };


//根据hash获取代币信息
  const fetchTokenInfo = async (tokenHash:string) => {
    try {
      if(!tokenHash) {
        console.error("Invalid hash:", tokenHash);
        return;
      }
      const TradeTokenHash = await client.getTransactionBlock({
        digest: tokenHash,
        // only fetch the effects field
        options: {
          showEffects: true,
          showInput: false,
          showEvents: false,
          showObjectChanges: false,
          showBalanceChanges: false,
        },
      });
      // console.log("1111",TradeTokenHash);

      // 已修改————————————————————————————————————————————————————————————————————————————————————————————
      const CeatedObject = [];
      let CoinPackageId = '';
      let CoinObject = '';
      let TreasuryObject = '';
      let ConfiguratorObject = '';
      if(TradeTokenHash && TradeTokenHash.effects && TradeTokenHash.effects.created) {
        for(const createdevent of TradeTokenHash.effects.created) {
          // console.log('ccc',createdevent); //每一个created的objectid
          CeatedObject.push(createdevent.reference?.objectId);
        }
      }

      // console.log('CeatedObject:',CeatedObject);

      const CeatedObjectTxns = await client.multiGetObjects({
        ids: CeatedObject,
        // only fetch the object type
        options: { showType: true },
      });
      // console.log('CeatedObjectTxns:',CeatedObjectTxns);
      for (const protx of CeatedObjectTxns) {
        // console.log('proId:',protx);
        if (protx.data && protx.data.type) {
          const containsConfigurator = protx.data.type.includes('::curve::Configurator');
          const containsTreasury = protx.data.type.includes('::coin::Treasury');
          const containsCoin = protx.data.type.includes('::coin::Coin');
          if(protx.data.type == 'package') {
            CoinPackageId = protx.data.objectId;
          }
          if(containsConfigurator) {
            ConfiguratorObject = protx.data.objectId;
          }
          if (containsTreasury) {
            TreasuryObject = protx.data.objectId;
          }
          if (containsCoin) {
            CoinObject = protx.data.objectId;
          }
        }
      }

      // 已修改————————————————————————————————————————————————————————————————————————————————————————————
      if (!CoinObject) {
        console.error("Invalid coin object hash:", CoinObject);
        return
      }
      const CoinInfo = await client.getObject({
        id: CoinObject,
        // fetch the object content field
        options: {
          showContent: true,
          showPreviousTransaction: true,
        },
      });
      const preObjectHash = CoinInfo?.data?.previousTransaction;
      // console.log("2222",CoinInfo?.data?.previousTransaction);
      // find bdObjectId
      if (!preObjectHash) {
        console.error("Invalid previous object hash:", preObjectHash);
        return;
      }
      const bdObjectHash = await client.getTransactionBlock({
        digest: preObjectHash,
        // only fetch the effects field
        options: {
          showEffects: true,
          showInput: false,
          showEvents: false,
          showObjectChanges: false,
          showBalanceChanges: false,
        },
      });
      const bdObjectId = bdObjectHash.effects?.created?.[0]?.reference?.objectId;
      // console.log("3333",bdObjectId);

      if (CoinInfo.data && CoinInfo.data.content && 'fields' in CoinInfo.data.content && 'type' in CoinInfo.data.content && 'icon_url' in CoinInfo.data.content.fields) {
        const fields = CoinInfo.data.content.fields;
        console.log(fields);
        if (fields.name && fields.symbol && fields.description && fields.icon_url && CoinPackageId && TreasuryObject && CoinObject && ConfiguratorObject && bdObjectId) {
          const tokenInfomatioin: Token = {
            name: fields.name.toString(),
            ticker: fields.symbol.toString(),
            description: fields.description.toString(),
            image: fields.icon_url.toString(),
            package_id: CoinPackageId.toString(),
            tresury: TreasuryObject.toString(),
            metadata: CoinObject,
            configurator: ConfiguratorObject.toString(),
            boudingcurve: bdObjectId.toString(),
          };
          setTokenInfo(tokenInfomatioin);
        }

        // const response = await axios.get(
        //     `http://localhost:8080/api/trade/${tokenHash}`
        // );
        // const data = response.data;
        // setTokenInfo(data);
        // console.log("tokenInfo:", data);


      }

    } catch (error) {
      console.error("Error fetching token info:", error);
    }
  };


  const handleTrade = async () => {
    const tx = new Transaction();
    tx.setSender(currentAccount);
    tx.setGasBudget(1_000_000_00);
    const type = packageid + "::coin::COIN";
    const num = Number(inputValue) * 1_000_000_000;
    if (buyAndsell) {
      if (tokenInfo) {
        const [coin] = tx.splitCoins(tx.gas, [num]);
        const [coin_buy_back] = tx.moveCall({
          target: packageid + "::curve::buy",
          arguments: [
            tx.object(tokenInfo.boudingcurve),
            tx.object(tokenInfo.configurator),
// tx.object(
// "0xd0db370837cc32effb9efd1450f4a273398e06a4bb10f69e97a16271ea40ce1c"
// ),
            tx.object(coin),
            tx.pure.u64(num),
          ],
          typeArguments: [type],
        });
        tx.transferObjects([coin_buy_back], currentAccount);
      }
    } else {
      if (tokenInfo) {
        const [coin_sell_back] = tx.moveCall({
          target: packageid + "::curve::sell",
          arguments: [
            tx.object(boudingCurve),
            tx.object(tokenInfo.configurator),
//
// tx.object(
// "0xd0db370837cc32effb9efd1450f4a273398e06a4bb10f69e97a16271ea40ce1c"
// ),
            tx.object(
                coinWithBalance({
                  balance: num,
                  type: type,
                })
            ),
            tx.pure.u64(num / 1000000),
          ],
          typeArguments: [type],
        });
        tx.transferObjects([coin_sell_back], currentAccount);
      }
    }
    signAndExecuteTransaction(
        {
          transaction: tx,
          chain: "sui:testnet",
        },
        {
          onSuccess: (result) => {
            console.log("executed transaction", result);
            setDigest(result.digest);

// 更新交易信息
            const newTransactions = newSwapEvents.map((event) => {
              console.log(event);

              const parsedJson = event.parsedJson as SwapParsedJson;
              const i_a = Number(parsedJson.input_amount) / 1000000000;
              const o_a = Number(parsedJson.output_amount) / 1000000000;
              const shortenString = (str: string, length: number = 4): string => {
                if (str.length <= length) return str;
                return str.slice(0, length) + "..";
              };
              // setMarketCap(parsedJson.is_buy ? marketCap + i_a : marketCap - o_a);
              return {
                account: userAccount,
                type: parsedJson.is_buy,
                SUI: parsedJson.is_buy ? i_a : o_a,
                coin: parsedJson.is_buy ? o_a : i_a,
                date: new Date().toLocaleString(),
                transaction: shortenString(digest),
              };
            });

            setTransactions((prevTransactions) => [
              ...prevTransactions,
              ...newTransactions,
            ]);
          },
        }
    );

    setInputValue(""); // Reset input value after trade
  };


  const handleButtonClick = async (value: number | string) => {
    // wei wan cheng---------------------------------------------------------------
    //
    // const allCoins = await client.getAllCoins({
    //   owner: currentAccount,
    // });
    // const Coins = allCoins.data;
    // const filteredCoins = Coins.filter(coin => coin.coinType !== "0x2::sui::SUI");
    // const balanceIf = filteredCoins.map(coin => ({
    //   balance: coin.balance,
    //   coinType: coin.coinType,
    //   coinPreviousTransaction: coin.previousTransaction,
    // }));
    // console.log("balanceIf:", balanceIf);
    // console.log('hash', hash);
    // wei wan cheng---------------------------------------------------------------
    setInputValue(value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const response = await axiosInstance.post("/api/post-reply", reply);
      console.log(response.data);

      dispatch(closeModal());
    } catch (error) {
      console.error("Error updating reply:", error);
    }
  };

  const handleAvatarChange = (base64String: string) => {
    setRep((prevReply) => ({
      ...prevReply,
      imageUrl: base64String,
    }));
  };

  return (
      <div className="container">
        <Modal
            isOpen={activeModal === "replyModal"}
            onRequestClose={() => dispatch(closeModal())}
            contentLabel="wallet profile"
            ariaHideApp={false}
            className="modal-profile"
            overlayClassName="overlay"
        >
          <div className="profile-modal">
            <form onSubmit={handleSubmit} className="wallet-form">
              <div className="form-group-avatar">
                <label>image(optional)</label>
                <div className="avatar-container">
                  <label htmlFor="avatar-upload" className="avatar-upload-label">
                    <img alt="upload" className="avatar-preview" />
                    <FileUploadWithIcon onAvatarChange={handleAvatarChange} />
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label>add a comment</label>
                <textarea
                    placeholder="comment"
                    onChange={(e) => {
                      if (hash) {
                        setRep((prevReply) => ({
                          ...prevReply,
                          content: e.target.value,
                          name: userAccount,
                          hash: hash,
                        }));
                      }
                    }}
                />
              </div>
              <button type="submit" className="modal-button submit-button">
                Post
              </button>
            </form>
            <button
                onClick={(e) => {
                  e.stopPropagation();
                  dispatch(closeModal());
                }}
                className="profile-close"
            >
              [cancel]
            </button>
          </div>
        </Modal>
        <Header />
        <div className="trade-root">
          <button
              className="trade-back-button"
              onClick={() => window.history.back()}
          >
            [go back]
          </button>
          <div>MarketCap: {formatMarketCap(marketCap)}</div>

          <div className="panel">
            <div className="leftPanel">
              {/*<div className="trade-chart">chart</div>*/}
              <div className="chart-container">
                <h1>代币价格走势图</h1>
                <Line key={visibleHistory.length} data={CoinData} options={options}/>
                <div>
                  <input
                      type="range"
                      min="0"
                      max={Math.max(0, priceHistory.length - visibleDataPoints)}
                      value={startIndex}
                      onChange={handleSliderChange}
                      style={{width: '100%'}}
                  />
                </div>
              </div>
              <div>
                {/* 展示代币信息 */}
                {suiBalance !== null && tokenBalance !== null && tokenPrice !== null && (
                    <div>
                      <p>当前SUI余额: {suiBalance} SUI</p>
                      <p>当前代币余额: {tokenBalance} Coin</p>
                      <p>代币实时价格: {tokenPrice.toFixed(10)} SUI/Coin</p>
                    </div>
                )}
              </div>
              {/*  /!*<button className="fetch-data-button" onClick={fetchObjectData}>*!/*/}
              {/*  /!*  查询代币信息*!/*/}
              {/*  /!*</button>*!/*/}

            {/*<button className="fetch-data-button" onClick={fetchObjectData}>查询代币信息</button>*/}
            <div className="trends-trades">
              <button onClick={() => setActiveDiv("Trends")}>Trends</button>
              <button onClick={() => setActiveDiv("Trades")}>Trades</button>
              {activeDiv === "Trends" && (
                  <div className="trends">
                    <div className="info-item">
                      <img
                          src={tokenInfo?.image}
                          alt="Avatar"
                          className="avatar"
                      />
                      <div className="infocontent">
                        <div
                            style={{
                              color: "white",
                              fontWeight: "bold",
                              fontSize: 15,
                            }}
                        >
                          {tokenInfo?.name} (ticker: {tokenInfo?.ticker})
                        </div>
                        <p className="infoText">{tokenInfo?.description}</p>
                      </div>
                    </div>

                    {/*<div>*/}
                    {/*  {reply_info?.map((event, index) => (*/}
                    {/*      <div key={index} className="coin-row">*/}
                    {/*        {event.imageUrl && (*/}
                    {/*            <div className="coin-image">*/}
                    {/*              (*/}
                    {/*              <img*/}
                    {/*                  src={event.imageUrl}*/}
                    {/*                  className="rounded-circle"*/}
                    {/*              />*/}
                    {/*              )*/}
                    {/*            </div>*/}
                    {/*        )}*/}
                    {/*        <div className="coin-info">*/}
                    {/*          <div>*/}
                    {/*            {event.name} {event.content}*/}
                    {/*          </div>*/}
                    {/*        </div>*/}
                    {/*      </div>*/}
                    {/*  ))}*/}
                    {/*</div>*/}
                    <button
                        onClick={() => {
                          dispatch(openModal("replyModal"));
                        }}
                    >
                      {" "}
                      Post a reply{" "}
                    </button>
                  </div>
              )}
              {activeDiv === "Trades" && (
                  <div className="trades">
                    <Tx transaction={transactions} coin={ticker}/>
                  </div>
              )}
            </div>
          </div>
          <div className="rightPanel">
            <div className="tradePanel">
              <div className="buttonPanel">
                <button
                    className={`button ${
                        buysellDiv === "Buy" ? "buy-active" : "Buybutton"
                    }`}
                    onClick={() => {
                      setBuySell("Buy");
                      setInputValue("");
                        setBuyAndSell(true);
                      }}
                  >
                    Buy
                  </button>
                  <button
                      className={`button ${
                          buysellDiv === "Sell" ? "sell-active" : ""
                      }`}
                      onClick={() => {
                        setBuySell("Sell");
                        setInputValue("");
                        setBuyAndSell(false);
                      }}
                  >
                    Sell
                  </button>
                </div>
                {buysellDiv === "Buy" && (
                    <input
                        type="number"
                        placeholder="0.0 SUI"
                        className="input"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                    />
                )}
                {buysellDiv === "Sell" && (
                    <input
                        type="number"
                        placeholder={"0.0 " + tokenInfo?.name}
                        className="input"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                    />
                )}
                <div className="amountButtons">
                  {buysellDiv === "Buy" ? (
                      <>
                        <button
                            className="amountButton"
                            onClick={() => handleButtonClick(0)}
                        >
                          Reset
                        </button>
                        <button
                            className="amountButton"
                            onClick={() => handleButtonClick(10)}
                        >
                          10 SUI
                        </button>
                        <button
                            className="amountButton"
                            onClick={() => handleButtonClick(50)}
                        >
                          50 SUI
                        </button>
                        <button
                            className="amountButton"
                            onClick={() => handleButtonClick(100)}
                        >
                          100 SUI
                        </button>
                      </>
                  ) : (
                      <>
                        <button
                            className="amountButton"
                            onClick={() => handleButtonClick(0)}
                        >
                          Reset
                        </button>
                        <button
                            className="amountButton"
                            onClick={() => handleButtonClick("25%")}
                        >
                          25%
                        </button>
                        <button
                            className="amountButton"
                            onClick={() => handleButtonClick("50%")}
                        >
                          50%
                        </button>
                        <button
                            className="amountButton"
                            onClick={() => handleButtonClick("75%")}
                        >
                          75%
                        </button>
                        <button
                            className="amountButton"
                            onClick={() => handleButtonClick("100%")}
                        >
                          100%
                        </button>
                      </>
                  )}
                </div>
                <button className="button placeTradeButton" onClick={handleTrade}>
                  Place trade
                </button>
              </div>
              <div className="infoPanel">
                <div className="info-item">
                  <img src={tokenInfo?.image} alt="Avatar" className="avatar" />
                  <div className="infocontent">
                    <div
                        style={{ color: "white", fontWeight: "bold", fontSize: 15 }}
                    >
                      {tokenInfo?.name} (ticker: {tokenInfo?.ticker})
                    </div>
                    <p className="infoText">{tokenInfo?.description}</p>
                  </div>
                </div>
                <div className="boundingcurve-alert">
                  when the market cap reaches $60,012 all the liquidity from the
                  bonding curve will be deposited into Raydium and burned.
                  progression increases as the price goes up.
                  <br />
                  there are 494,077,522 tokens still available for sale in the
                  bonding curve and there is 11.59 SOL in the bonding curve. king
                  of the hill progress: 44%
                </div>
                <div className="holders-address">
                  <h3>Holder distribution</h3>
                  <div>loading...</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default TradingApp;

