package SuiPumpfunc

import (
	"context"
	"crypto/ed25519"
	"fmt"
	"github.com/block-vision/sui-go-sdk/models"
	"github.com/block-vision/sui-go-sdk/sui"
)

func TransferSuiCoin(ctx context.Context, cli sui.ISuiAPI, address string, suiObjectId string, gasBudget string, recipient string, amount string, priKey ed25519.PrivateKey) (models.SuiTransactionBlockResponse, error) {

	rsp, err := cli.TransferSui(ctx, models.TransferSuiRequest{
		Signer:      address,
		SuiObjectId: suiObjectId,
		GasBudget:   gasBudget,
		Recipient:   recipient,
		Amount:      amount,
	})

	if err != nil {
		fmt.Println(err.Error())
		return models.SuiTransactionBlockResponse{}, nil
	}

	// 查看成功交易的URL
	rsp2, err := cli.SignAndExecuteTransactionBlock(ctx, models.SignAndExecuteTransactionBlockRequest{
		TxnMetaData: rsp,
		PriKey:      priKey,
		// 仅获取effects字段
		Options: models.SuiTransactionBlockOptions{
			ShowInput:          true,
			ShowRawInput:       true,
			ShowEffects:        true,
			ShowBalanceChanges: true,
		},
		RequestType: "WaitForLocalExecution",
	})

	if err != nil {
		fmt.Println(err.Error())
		return models.SuiTransactionBlockResponse{}, nil
	}

	return rsp2, nil
}
