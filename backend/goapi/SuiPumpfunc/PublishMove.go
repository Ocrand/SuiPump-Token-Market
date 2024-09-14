package SuiPumpfunc

import (
	"context"
	"crypto/ed25519"
	"fmt"
	"github.com/block-vision/sui-go-sdk/models"
	"github.com/block-vision/sui-go-sdk/models/sui_types"
	"github.com/block-vision/sui-go-sdk/sui"
	"github.com/block-vision/sui-go-sdk/utils"
	"time"
)

// PublishRequest 结构体定义
type PublishRequest struct {
	Sender          string   `json:"sender"`
	CompiledModules []string `json:"compiled_modules"`
	Dependencies    []string `json:"dependencies"`
	Gas             string   `json:"gas"`
	GasBudget       string   `json:"gasBudget"`
}

type TxnMetaData struct {
	Gas          []sui_types.SuiObjectRef `json:"gas"`
	InputObjects []interface{}            `json:"inputObjects"`
	TxBytes      string                   `json:"txBytes"`
}

// Publish 发布模块到区块链
func Publish(ctx context.Context, cli sui.ISuiAPI, sender string, compiledModules []string, dependencies []string, gas string, gasBudget string, PriKey ed25519.PrivateKey) (models.SuiTransactionBlockResponse, error) {
	// 发送发布请求
	a := models.PublishRequest{
		Sender:          sender,
		CompiledModules: compiledModules,
		Dependencies:    dependencies,
		Gas:             gas,
		GasBudget:       gasBudget,
	}
	utils.PrettyPrint(a)
	rsp, err := cli.Publish(ctx, models.PublishRequest{
		Sender:          sender,
		CompiledModules: compiledModules,
		Dependencies:    dependencies,
		Gas:             gas,
		GasBudget:       gasBudget,
	})

	if err != nil {
		return models.SuiTransactionBlockResponse{}, nil
	}
	time.Sleep(4 * time.Second)
	// 返回结果
	rsp2, err := cli.SignAndExecuteTransactionBlock(ctx, models.SignAndExecuteTransactionBlockRequest{
		TxnMetaData: rsp,
		PriKey:      PriKey,
		// 仅获取effects字段
		Options: models.SuiTransactionBlockOptions{
			ShowInput:         true,
			ShowRawInput:      true,
			ShowEffects:       true,
			ShowObjectChanges: true,
		},
		RequestType: "WaitForLocalExecution",
	})

	if err != nil {
		fmt.Println(err.Error())
		return models.SuiTransactionBlockResponse{}, nil
	}
	return rsp2, nil
}
