import { useEventSubscriber } from "../useEventSubscriber";
import { getFaucetHost, requestSuiFromFaucetV0 } from "@mysten/sui/faucet";
// Define a type for the parsed JSON structure
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

type ListParsedJson = {
  object_id: string; // assuming object::ID is a string or some unique identifier
  token_type: string; // assuming ascii::String is a string
  sui_balance_val: number; // assuming u64 is a number
  token_balance_val: number; // assuming u64 is a number
  virtual_sui_amt: number; // assuming u64 is a number
  target_supply_threshold: number; // assuming u64 is a number
  creator: string; // assuming address is a string
  ticker: string; // assuming ascii::String is a string
  name: string; // assuming string::String is a string
  description: string; // assuming string::String is a string
  url: string | null; // assuming option::Option<0x2::url::Url> is a string or null
  coin_metadata_id: string; // assuming object::ID is a string or some unique identifier
  twitter: string | null; // assuming option::Option<ascii::String> is a string or null
  telegram: string | null; // assuming option::Option<ascii::String> is a string or null
  website: string | null; // assuming option::Option<ascii::String> is a string or null
  migration_target: number;
};

const Query: React.FC = () => {
  const fentchFacet = async () => {
    await requestSuiFromFaucetV0({
      host: getFaucetHost("testnet"),
      recipient:
        "0x01010b63c0a3aa8b83447f88ba9409a8de66e045f04bfcea7287e8798ecf7b40",
    });
  };

  const packageid =
    "0xb1e82eb8efe2690827fe11deea6dccf869a37beb651c388a962b9ebd48c82675";
  const { newSwapEvents, newListEvent } = useEventSubscriber(packageid);

  return (
    <div>
      <button onClick={fentchFacet}>facet</button>
      <div>
        {newListEvent.map((event) => {
          const parsedJson = event.parsedJson as ListParsedJson;

          return <p>{parsedJson.object_id}</p>;
        })}
      </div>
      <div>
        {newSwapEvents.map((event, index) => {
          const parsedJson = event.parsedJson as SwapParsedJson;

          return <li key={index}>{JSON.stringify(parsedJson)}</li>;
        })}
      </div>

      {/* <EventSubscriber /> */}
    </div>
  );
};

export default Query;
