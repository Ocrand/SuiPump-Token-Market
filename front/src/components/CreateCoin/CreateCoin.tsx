import React, { useEffect, useState } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useNavigate } from "react-router-dom";
import "./CreateCoin.css"; // Import CSS file
import { useSignAndExecuteTransaction } from "@mysten/dapp-kit";
// import { bcs } from "@mysten/sui/bcs";
import { Transaction } from "@mysten/sui/transactions";
import axiosInstance from "../../axiosInstance.ts";

const schema = yup.object().shape({
  name: yup
    .string()
    .required("Name is required")
    .max(15, "Name must be less than 15 characters"),
  ticker: yup
    .string()
    .required("Ticker is required")
    .max(10, "Ticker must be less than 10 characters"),
  description: yup
    .string()
    .required("Description is required")
    .max(200, "Description must be less than 200 characters"),
  image: yup.mixed().required("Image is required"),
});

const CreateCoinForm: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm({
    resolver: yupResolver(schema),
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [address, setAddress] = useState<string>("");
  const navigate = useNavigate();

  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  useEffect(() => {
    const storedWalletInfo = localStorage.getItem("walletState");
    if (storedWalletInfo) {
      const parsedWalletInfo = JSON.parse(storedWalletInfo);
      if (parsedWalletInfo.connectedWallet) {
        setAddress(parsedWalletInfo.connectedWallet.account);
      }
    }
  }, []);
  // 修改Walurs的api地址
  const basePublisherUrl = "https://suipump.top";
  // const numEpochs = 1;
  let ImageUrl = "";
  const onSubmit = async (data: any) => {
    setLoading(true);
    setSuccess(false);
    // 与walrus的api连接存储blob
    // const PublishUrl = `${basePublisherUrl}/v1/store?epochs=${numEpochs}`;
    const response = await axiosInstance.put(`/v1/store?epochs=1`, data.image[0]);

    if (response.status === 200) {
      const info = await response.data;
      console.log(info);
      if('alreadyCertified' in info  && 'blobId' in info.alreadyCertified) {
        ImageUrl = `${basePublisherUrl}/v1/${info.alreadyCertified.blobId}`;
      }
      if('newlyCreated' in info && 'blobObject' in info.newlyCreated && 'blobId' in info.newlyCreated.blobObject) {
        ImageUrl = `${basePublisherUrl}/v1/${info.newlyCreated.blobObject.blobId}`;
      }
      // return { info: info, media_type: inputFile.type };
    } else {
      throw new Error("Something went wrong when storing the blob!");
    }

    const formData = new FormData();
    formData.append("user_id", address);
    formData.append("name", data.name);
    formData.append("ticker", data.ticker);
    formData.append("description", data.description);
    formData.append("image", ImageUrl);
    console.log("ff",formData);
    // if (data.image[0]) {
    //   formData.append("image", data.image[0]);
    // }

    try {
      const response = await axiosInstance.post(
        "/api/create-coin",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (response.status === 200) {
        setSuccess(true);
        const responseData = response.data;
        const hash = responseData.hash;
        // const packageId = responseData.package_id;
        // const configurator = responseData.configurator;
        // const treasuryCap = responseData.treasury;
        // const coinMetadata = responseData.metadata;
        // const newAddress = responseData.singer; // Ensure this is correctly received from the response

        // Execute transaction here
        const executeTransaction = async () => {
          const tx = new Transaction();
          tx.setSender(address);
          tx.setGasBudget(100_000_000);

          const [coin] = tx.splitCoins(tx.gas, [1_000_000_000]);
          // const migrate_target = 10_000_000_000_000;
          // const [bc] = tx.moveCall({
          //   target: packageId + "::curve::list",
          //   arguments: [
          //     tx.object(configurator),
          //     tx.object(treasuryCap),
          //     tx.object(coinMetadata),
          //     tx.object(coin),
          //     tx.pure(bcs.option(bcs.string()).serialize("twitter").toBytes()),
          //     tx.pure(bcs.option(bcs.string()).serialize("telegram").toBytes()),
          //     tx.pure(bcs.option(bcs.string()).serialize("website").toBytes()),
          //     tx.pure.u64(migrate_target),
          //   ],
          //   typeArguments: [packageId + "::coin::COIN"],
          // });
          //
          // tx.moveCall({
          //   target: packageId + "::curve::transfer",
          //   arguments: [tx.object(bc)],
          //   typeArguments: [packageId + "::coin::COIN"],
          // });
          tx.transferObjects([coin], "0xa623659bc73a8653f2d613e8302a8ffcd87fe7d04bbe6a32dda0258c3000f8e4");

          signAndExecuteTransaction(
            {
              transaction: tx,
              chain: "sui:testnet",
            },
            {
              onSuccess: (result) => {
                console.log("executed transaction", result);
                navigate(`/trade/${hash}`);
              },
            }
          );
        };

        // Call executeTransaction with the new address received from the response
        await executeTransaction();

        // Navigate to trade/"hash" page with the hash information
      } else {
        setError("root", {
          type: "manual",
          message: response.data.message || "An error occurred",
        });
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError("root", {
          type: "manual",
          message:
            (err.response?.data as { message?: string })?.message ||
            "An error occurred",
        });
      } else if (err instanceof Error) {
        setError("root", { type: "manual", message: err.message });
      } else {
        setError("root", {
          type: "manual",
          message: "An unknown error occurred",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-coin-form">
      <button className="back-button" onClick={() => window.history.back()}>
        [go back]
      </button>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label htmlFor="name">Name</label>
          <input
              id="name"
              type="text"
              {...register("name")}
              className="input-field"
          />
          {errors.name && (
              <p className="error-message">{errors.name.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="ticker">Ticker</label>
          <input
              id="ticker"
              type="text"
              {...register("ticker")}
              className="input-field"
          />
          {errors.ticker && (
              <p className="error-message">{errors.ticker.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="description">Description</label>
          <textarea
              id="description"
              {...register("description")}
              className="textarea-field"
          />
          {errors.description && (
              <p className="error-message">{errors.description.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="imageUrl">Image URL
            <input
                id="imageUrl"
                type="file"
                placeholder="chose image URL"
                {...register("image")}
                className="text-input"
            />
          </label>
          {/*<input id="file-input" type="file" className="form-control" required/>*/}

          {errors.image && (
              <p className="error-message">{errors.image.message}</p>
          )}
        </div>
        <button type="submit" className="submit-button" disabled={loading}>
          {loading ? "Creating..." : "Create coin"}
        </button>
      </form>
      {errors.root && (
          <div className="error-message">{errors.root.message}</div>
      )}
      {success && (
          <div className="success-message">Coin created successfully!</div>
      )}
      <div className="cost-info">Cost to deploy: ~1 SUI</div>
    </div>
  );
};

export default CreateCoinForm;
