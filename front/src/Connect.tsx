import { ConnectModal, useCurrentAccount } from "@mysten/dapp-kit";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "./store/store";
import { openModal, closeModal } from "./store/store";
const Connect = () => {
  const activeModal = useSelector(
    (state: RootState) => state.modal.activeModal
  );
  const dispatch = useDispatch();
  const currentAccount = useCurrentAccount();

  return (
    <ConnectModal
      trigger={
        <button
          onClick={() => {
            dispatch(openModal("connect"));
          }}
          disabled={!!currentAccount}
        >
          {" "}
          {currentAccount ? "Connected" : "Connect"}
        </button>
      }
      open={activeModal === "connect"}
      onOpenChange={() => {
        dispatch(closeModal());
      }}
    />
  );
};

export default Connect;
