import { useDisconnectWallet, useCurrentAccount } from "@mysten/dapp-kit";
import "./Header.css";
import NotificationBar from "./../NotificationBar";
import { useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import Modal from "react-modal";
import {
  WalletWithFeatures,
  useConnectWallet,
  useWallets,
} from "@mysten/dapp-kit";
import { useDispatch, useSelector } from "react-redux";
import {
  openModal,
  closeModal,
  setConnectedWallet,
  clearConnectedWallet,
} from "../../../store/store";
import { RootState } from "../../../store/store";
import FileUploadWithIcon from "../FileUploadWithIcon";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSun } from "@fortawesome/free-solid-svg-icons";
import Balance from "../../CreateCoin/Payment";
// import {fetchDataWithRetry} from "../../../axiosInstance.ts";
import axiosInstance from "../../../axiosInstance.ts";


const Header: React.FC = () => {
  const wallets = useWallets();
  const { mutate: connect } = useConnectWallet();
  const { mutate: disconnect } = useDisconnectWallet();
  const account = useCurrentAccount();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const activeModal = useSelector(
      (state: RootState) => state.modal.activeModal
  );
  const connectedWallet = useSelector(
      (state: RootState) => state.wallet.connectedWallet
  );
  const [walletInfo, setWalletInfo] = useState({
    account: "",
    avatar: "",
    name: "",
    bio: "",
  });
  const [connectingWallet, setConnectingWallet] = useState<WalletWithFeatures<
      Record<string, unknown>
  > | null>(null);

  useEffect(() => {
    console.log("Current account:", account);
    if (account?.address && connectingWallet) {
      handleOpenModal(connectingWallet, account.address);
    }
  }, [account]);

  useEffect(() => {
    const storedWalletInfo = localStorage.getItem("walletState");
    if (storedWalletInfo) {
      const parsedWalletInfo = JSON.parse(storedWalletInfo);

      if (parsedWalletInfo.connectedWallet) {
        dispatch(setConnectedWallet(parsedWalletInfo.connectedWallet));
        setWalletInfo(parsedWalletInfo.connectedWallet);
      }
    }
  }, []);

  // useEffect(() => {
  //   const storedWalletInfo = localStorage.getItem("walletState");
  //   if (storedWalletInfo) {
  //     const parsedWalletInfo = JSON.parse(storedWalletInfo);
  //
  //     if (parsedWalletInfo.connectedWallet) {
  //       dispatch(setConnectedWallet(parsedWalletInfo.connectedWallet));
  //       setWalletInfo(parsedWalletInfo.connectedWallet);
  //
  //       // 自动重新连接钱包
  //       connect({ wallet: parsedWalletInfo.connectedWallet }, {
  //         onSuccess: () => {
  //           console.log("Reconnected to wallet successfully");
  //         },
  //         onError: (error) => {
  //           console.error("Failed to reconnect to wallet:", error);
  //         }
  //       });
  //     }
  //   }
  // }, []);




  const defaultAvatar = "https://aggregator-devnet.walrus.space/v1/2HueBM8zsLmWlyGd9Js5X7oo9UrtaE3CXJltrc27MPk";
  const handleOpenModal = async (
      wallet: WalletWithFeatures<Record<string, unknown>>,
      accountAddress: string
  ) => {

    setWalletInfo({
      account: accountAddress,
      avatar: defaultAvatar,
      name: wallet.name,
      bio: "",
    });
    // const response = await PostDataWithRetry("/api/profile", walletInfo);
    // if (response.flag)
    const address = accountAddress;
    console.log("Address:", address);
    const checkres = await axiosInstance.get("/api/checkaddress", {
        params: {
          address: address,
        }
      }
    );
    const check = checkres.data;
    console.log("Check flag:", check);
    console.log("Wallet Info:", walletInfo);
    if (check == '1') {
      const response = await axiosInstance.post("/api/profile", walletInfo);
      const updatedWalletInfo = response.data;
      console.log("updatedWalletInfo", updatedWalletInfo);
      if (updatedWalletInfo.address != "") {
        setWalletInfo(updatedWalletInfo);
        dispatch(setConnectedWallet(updatedWalletInfo));
        dispatch(closeModal());
        console.log("Modal opened:", activeModal);

      }
    }
    if (check == '0') {
      dispatch(openModal("walletInfoModal"));
      console.log("Modal opened:", activeModal);
      console.log("Wallet Info:", walletInfo);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {

      // const updatedWalletInfo = await PostDataWithRetry("/api/profile", walletInfo);
      const response = await axiosInstance.post("/api/profile", walletInfo);
      const updatedWalletInfo = response.data;
      console.log("Profile updated:", updatedWalletInfo.flag);
      if (updatedWalletInfo.address != "") {
        setWalletInfo(updatedWalletInfo);
        dispatch(setConnectedWallet(updatedWalletInfo));
        dispatch(closeModal());
      }

    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const handleAvatarChange = (base64String: string) => {
    setWalletInfo({ ...walletInfo, avatar: base64String });
  };

  const handleDisconnect = () => {
    disconnect();
    dispatch(clearConnectedWallet());
    setWalletInfo({
      account: "",
      avatar: "",
      name: "",
      bio: "",
    });
    dispatch(closeModal());
  };

  const renderConnectButton = () => {
    if (connectedWallet) {
      return (
          <div
              className="walletprofile"
              onClick={() => {
                dispatch(openModal("walletProfile"));
              }}
          >
            (<Balance />
            SUI)
            <img
                src={connectedWallet.avatar}
                alt="Wallet Avatar"
                style={{ width: 15, height: 15, marginRight: 4, borderRadius: 2 }}
            />
            <div>{connectedWallet.name}</div>
          </div>
      );
    } else {
      return (
          <>
            <button
                className="btnc"
                onClick={() => dispatch(openModal("connectWalletModal"))}
            >
              [connect wallet]
            </button>
          </>
      );
    }
  };
  return (
      <>
        <header className="header">
          <FontAwesomeIcon
              icon={faSun}
              onClick={() => {
                navigate("/");
              }}
              className="header-icon"
          ></FontAwesomeIcon>
          <div className="social-links">
            <a href="#">[twitter]</a>
            <a href="#">[support]</a>
            <a href="#">[telegram]</a>
            <a href="#">[how it works]</a>
          </div>

          <NotificationBar />

          <Modal
              isOpen={activeModal === "connectWalletModal"}
              onRequestClose={() => dispatch(closeModal())}
              contentLabel="Wallets Modal"
              ariaHideApp={false}
              className="modal"
              overlayClassName="overlay"
          >
            <button
                onClick={(e) => {
                  e.stopPropagation();
                  dispatch(closeModal());
                }}
                className="modal-button close-button"
            >
              Close
            </button>
            <div>
              <div className="wallet">
                <ul className="wallet-list">
                  {wallets.map((wallet) => (
                      <li key={wallet.name} className="wallet-item">
                        <button
                            className="wallet-button"
                            onClick={() => {
                              setConnectingWallet(wallet);
                              connect(
                                  { wallet },
                                  {
                                    onSuccess: () => {
                                      console.log("Account onSuccess:", account);
                                    },
                                  }
                              );
                            }}
                        >
                          Connect to {wallet.name}
                        </button>
                      </li>
                  ))}
                </ul>
              </div>
            </div>
          </Modal>

          <Modal
              isOpen={activeModal === "walletInfoModal"}
              onRequestClose={() => dispatch(closeModal())}
              contentLabel="Wallet Info Modal"
              ariaHideApp={false}
              className="modal"
              overlayClassName="overlay"
          >
            <button
                onClick={() => dispatch(closeModal())}
                className="modal-button close-button"
            >
              Close
            </button>
            <form onSubmit={handleSubmit} className="wallet-form">
              <div className="form-group-avatar">
                <label>Avatar</label>
                <div className="avatar-container">
                  <label htmlFor="avatar-upload" className="avatar-upload-label">
                    <img
                        src={walletInfo.avatar || defaultAvatar}
                        alt="Avatar Preview"
                        className="avatar-preview"
                    />
                    <FileUploadWithIcon onAvatarChange={handleAvatarChange} />
                  </label>
                </div>
              </div>
              <div className="form-group">
                <label>Name</label>
                <input
                    type="text"
                    value={walletInfo.name}
                    onChange={(e) =>
                        setWalletInfo({ ...walletInfo, name: e.target.value })
                    }
                    placeholder="Name"
                />
              </div>
              <div className="form-group">
                <label>Bio</label>
                <textarea
                    value={walletInfo.bio}
                    onChange={(e) =>
                        setWalletInfo({ ...walletInfo, bio: e.target.value })
                    }
                    placeholder="Bio"
                />
              </div>
              <button type="submit" className="modal-button submit-button">
                Submit
              </button>
            </form>
          </Modal>

          <Modal
              isOpen={activeModal === "walletProfile"}
              onRequestClose={() => dispatch(closeModal())}
              contentLabel="wallet profile"
              ariaHideApp={false}
              className="modal-profile"
              overlayClassName="overlay"
          >
            <div className="profile-modal">
              <div className="profile-info">
                <img src={walletInfo.avatar} className="profile-image" />
                <div className="profile-inner">
                  <div>{walletInfo.name}</div>
                  <a
                      onClick={() => {
                        dispatch(openModal("profileModal"));
                      }}
                  >
                    Edit Profile
                  </a>
                </div>
              </div>
              <div className="profile-address">{walletInfo.account}</div>
              <button className="profile-dis" onClick={handleDisconnect}>
                Disconnect Wallet
              </button>
              <button
                  onClick={(e) => {
                    e.stopPropagation();
                    dispatch(closeModal());
                  }}
                  className="profile-close"
              >
                [Close]
              </button>
            </div>
          </Modal>

          <Modal
              isOpen={activeModal === "profileModal"}
              onRequestClose={() => dispatch(closeModal())}
              contentLabel="wallet profile"
              ariaHideApp={false}
              className="modal-pro"
              overlayClassName="overlay"
          >
            <form className="pro" onSubmit={handleSubmit}>
              <div
                  style={{ fontSize: "15px", color: "white", fontWeight: "bold" }}
              >
                Edit profile
              </div>
              <div className="pro-photo">
                <div>Profile photo</div>
                <img src={walletInfo.avatar} alt="Profile Avatar"></img>
                <FileUploadWithIcon
                    onAvatarChange={handleAvatarChange}
                ></FileUploadWithIcon>
              </div>
              <div className="pro-user">
                <div>Username</div>
                <input
                    type="text"
                    name="name"
                    value={walletInfo.name}
                    onChange={(e) =>
                        setWalletInfo({ ...walletInfo, name: e.target.value })
                    }
                    placeholder="Username"
                />
              </div>
              <div className="pro-bio">
                <div>Bio</div>
                <input
                    type="text"
                    name="bio"
                    value={walletInfo.bio}
                    onChange={(e) =>
                        setWalletInfo({ ...walletInfo, bio: e.target.value })
                    }
                    placeholder="Bio"
                />
              </div>
              <div className="pro-button">
                <button
                    type="button"
                    className="pro-button-close"
                    onClick={() => {
                      dispatch(closeModal());
                    }}
                >
                  [close]
                </button>
                <button type="submit" className="pro-button-save">
                  Save
                </button>
              </div>
            </form>
          </Modal>

          <div className="conn-links">
            {renderConnectButton()}
            <a
                onClick={() => {
                  navigate("/profile");
                }}
            >
              [view profile]
            </a>
          </div>
        </header>
      </>
  );

};

export default Header;
