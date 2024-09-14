package SuiPumpfunc

import (
	"context"
	"crypto/ed25519"
	"encoding/json"
	"log"
	"time"

	"github.com/block-vision/sui-go-sdk/models"
	"github.com/block-vision/sui-go-sdk/sui"
)

type CoinMetadata struct {
	CoinOwner    string             `json:"coin_owner"`
	Singer       string             `json:"singer"`
	PrivateKey   ed25519.PrivateKey `json:"private_key"`
	PackageID    string             `json:"package_id"`
	Name         string             `json:"name"`
	Ticker       string             `json:"ticker"`
	Description  string             `json:"description"`
	Image        string             `json:"image"`
	Treasury     string             `json:"treasury"`
	Metadata     string             `json:"metadata"`
	Gas          string             `json:"gas"`
	Type         string             `json:"type"`
	Choice       string             `json:"choice"`
	AdminCap     string             `json:"admin_cap"`
	Configurator string             `json:"configurator"`
	TranHash     string             `json:"tran_hash"`
	BoudingCurve string             `json:"boudingcurve"`
	SuiGas       string             `json:"sui_gas"`
}

func MoveCall(ctx context.Context, cli sui.ISuiAPI, Coin CoinMetadata) (models.SuiTransactionBlockResponse, error) {
	var CallStruct models.MoveCallRequest
	var CallTransactionBlock models.SignAndExecuteTransactionBlockRequest
	if Coin.Choice == "NoTypeCall" {
		CallStruct = models.MoveCallRequest{
			Signer:          Coin.Singer,
			PackageObjectId: Coin.PackageID,
			Module:          "coin",
			Function:        "set_coin_metadata_info",
			TypeArguments:   []interface{}{},
			Arguments: []interface{}{
				Coin.Name,
				Coin.Ticker,
				Coin.Description,
				Coin.Image,
				Coin.Treasury,
				Coin.Metadata,
			},
			Gas:       Coin.Gas,
			GasBudget: "10000000",
		}
	} else if Coin.Choice == "TypeCall" {
		CallStruct = models.MoveCallRequest{
			Signer:          Coin.Singer,
			PackageObjectId: Coin.PackageID,
			Module:          "curve",
			Function:        "freeze_meta",
			TypeArguments: []interface{}{
				Coin.Type,
			},
			Arguments: []interface{}{
				Coin.Metadata,
			},
			Gas:       Coin.Gas,
			GasBudget: "10000000",
		}
	} else if Coin.Choice == "List" {
		CallStruct = models.MoveCallRequest{
			Signer:          Coin.Singer,
			PackageObjectId: Coin.PackageID,
			Module:          "curve",
			Function:        "list",
			TypeArguments: []interface{}{
				Coin.Type,
			},
			Arguments: []interface{}{
				Coin.Configurator,
				Coin.Treasury,
				Coin.Metadata,
				Coin.SuiGas,
				[]string{"twitter"},
				[]string{"twitter2"},
				[]string{"twitter3"},
				"10000000000000",
			},
			Gas:       Coin.Gas,
			GasBudget: "10000000",
		}

	}

	requestJSON, _ := json.Marshal(CallStruct)
	log.Printf("Sending request: %s\n", requestJSON)

	rsp, err := cli.MoveCall(ctx, CallStruct)
	if err != nil {
		log.Printf("Failed to call MoveCall: %s, Request: %s\n", err, requestJSON)
		return models.SuiTransactionBlockResponse{}, err
	}
	requestJSON1, _ := json.Marshal(CallTransactionBlock)
	log.Printf("Sending request: %s\n", requestJSON1)
	time.Sleep(4 * time.Second)
	rsp2, err := cli.SignAndExecuteTransactionBlock(ctx, models.SignAndExecuteTransactionBlockRequest{
		TxnMetaData: rsp,
		PriKey:      Coin.PrivateKey,
		Options: models.SuiTransactionBlockOptions{
			ShowEffects:       true,
			ShowObjectChanges: true,
		},
		RequestType: "WaitForLocalExecution",
	})

	if err != nil {
		log.Printf("Failed to execute transaction block: %s, Request: %s\n", err, requestJSON)
		return models.SuiTransactionBlockResponse{}, err
	}

	return rsp2, nil
}
