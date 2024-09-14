package SuiPumpfunc

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strconv"

	"github.com/block-vision/sui-go-sdk/models"
	"github.com/block-vision/sui-go-sdk/sui"
)

// ObjectInfo 用于存储对象的ID和余额
type ObjectInfo struct {
	ObjectID string
	Balance  int64
}

func GasFind(ctx context.Context, cli sui.ISuiAPI, address string) ([]ObjectInfo, error) {
	var GasStruct models.SuiXGetOwnedObjectsRequest
	fmt.Println("GasFind")
	suiObjectResponseQuery := models.SuiObjectResponseQuery{
		// 只获取effects字段
		Options: models.SuiObjectDataOptions{
			ShowType:    true,
			ShowContent: true,
			ShowBcs:     true,
			ShowOwner:   true,
		},
	}
	requestJSON, _ := json.Marshal(GasStruct)
	log.Printf("Sending request: %s\n", requestJSON)
	rsp, err := cli.SuiXGetOwnedObjects(ctx, models.SuiXGetOwnedObjectsRequest{
		Address: address,
		Query:   suiObjectResponseQuery,
		Limit:   5,
	})

	if err != nil {
		fmt.Println(err.Error())
		return nil, nil
	}

	// 遍历返回的数据，筛选出类型为sui的对象
	var results []ObjectInfo
	// 遍历返回的数据，筛选出类型为sui的对象
	for _, obj := range rsp.Data {
		if obj.Data.Type == "0x2::coin::Coin<0x2::sui::SUI>" {
			if balanceStr, ok := obj.Data.Content.Fields["balance"].(string); ok {
				balance, err := strconv.ParseInt(balanceStr, 10, 64)
				if err != nil {
					continue // 出错则跳过当前对象
				}
				if balance > 20000000 {
					results = append(results, ObjectInfo{ObjectID: obj.Data.ObjectId, Balance: balance})
				}
			}
		}
	}
	return results, nil
}
