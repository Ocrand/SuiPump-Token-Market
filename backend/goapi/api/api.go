package main

import (
	"context"
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"goapi/SuiPumpfunc"
	"goapi/SuiUtils"
	"log"
	"net/http"
	"regexp"
	"strings"
	"time"

	"github.com/block-vision/sui-go-sdk/models"
	"github.com/block-vision/sui-go-sdk/signer"
	"github.com/block-vision/sui-go-sdk/sui"
	"github.com/block-vision/sui-go-sdk/utils"
	"github.com/rs/cors"
)

type Profile struct {
	Account string `json:"account"`
	Name    string `json:"name"`
	Avatar  string `json:"avatar"`
	Bio     string `json:"bio"`
	Flag    string `json:"flag"`
}

type CoinInformation struct {
	CoinOwner    string `json:"coin_owner"`
	Singer       string `json:"singer"`
	Name         string `json:"name"`
	Ticker       string `json:"ticker"`
	Description  string `json:"description"`
	Image        string `json:"image"`
	PackageID    string `json:"package_id"`
	AdminCap     string `json:"admin_cap"`
	Configurator string `json:"configurator"`
	Treasury     string `json:"treasury"`
	Metadata     string `json:"metadata"`
	TranHash     string `json:"hash"`
	BoudingCurve string `json:"boudingcurve"`
}

func CheckAddress(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	db, err := SuiUtils.DBConn()
	if err != nil {
		log.Printf("Failed to connect to database: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	defer db.Close()

	address := r.URL.Query().Get("address")
	if address == "" {
		http.Error(w, "Bad request: missing address", http.StatusBadRequest)
		return
	}
	//验证address是否存在于数据库中
	var checkFlag Profile
	err = db.QueryRow("SELECT Address FROM WalletProfile WHERE Address = ?", address).Scan(&address)
	if err != nil {
		if err == sql.ErrNoRows {
			checkFlag.Flag = "0"
		}

	} else {
		checkFlag.Flag = "1"
		fmt.Println("address", address)
		err = db.QueryRow("SELECT Address, Name, Avatar, Bio FROM WalletProfile WHERE Address = ?", address).Scan(&checkFlag.Account, &checkFlag.Name, &checkFlag.Avatar, &checkFlag.Bio)
		if err != nil {
			log.Printf("Error querying existing profile: %v", err)
			http.Error(w, "Internal server error", http.StatusInternalServerError)
		}
		defer db.Close()
	}
	fmt.Println("checkFlag", checkFlag)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(checkFlag)
}

func InsertProfileByAddress(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// 连接数据库
	db, err := SuiUtils.DBConn()
	if err != nil {
		log.Printf("Failed to connect to database: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	defer db.Close() // 确保在函数结束时关闭数据库连接

	// 解析 JSON 数据
	var profile Profile
	if err := json.NewDecoder(r.Body).Decode(&profile); err != nil {
		log.Printf("Error decoding JSON: %v", err)
		http.Error(w, "Bad request: "+err.Error(), http.StatusBadRequest)
		return
	} // 检查地址是否已存在
	fmt.Println("profile", profile)

	// 检查地址是否已存在并获取数据
	var existingProfile Profile
	err = db.QueryRow("SELECT Address, Name, Avatar, Bio FROM WalletProfile WHERE Address = ?", profile.Account).Scan(&existingProfile.Account, &existingProfile.Name, &existingProfile.Avatar, &existingProfile.Bio)
	if err != nil {
		if err == sql.ErrNoRows {
			// 如果没有记录，插入新记录
			_, err = db.Exec("INSERT INTO WalletProfile (Address, Name, Avatar, Bio) VALUES (?, ?, ?, ?)",
				profile.Account, profile.Name, profile.Avatar, profile.Bio)
			if err != nil {
				log.Printf("Error inserting new profile: %v", err)
				http.Error(w, "Internal server error", http.StatusInternalServerError)
				return
			}
			profile.Flag = "new"
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusCreated)
			json.NewEncoder(w).Encode(profile)
		} else {
			log.Printf("Error querying existing profile: %v", err)
			http.Error(w, "Internal server error", http.StatusInternalServerError)
		}
	} else {
		// 如果地址已存在，返回查询到的数据

		//先检查返回值是否一致
		if profile.Name != existingProfile.Name || profile.Avatar != existingProfile.Avatar || profile.Bio != existingProfile.Bio {
			// 数据不一致，更新数据

			existingProfile.Name = profile.Name
			existingProfile.Avatar = profile.Avatar
			existingProfile.Bio = profile.Bio
			_, err = db.Exec("UPDATE WalletProfile SET Name = ?, Avatar = ?, Bio = ? WHERE Address = ?", profile.Name, profile.Avatar, profile.Bio, profile.Account)
			if err != nil {
				log.Printf("Error updating profile: %v", err)
				http.Error(w, "Internal server error", http.StatusInternalServerError)
				return
			}
		}
		existingProfile.Flag = "exist"
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(existingProfile)
	}
}

// StoreCoinMetadata stores the coin metadata into the database.
func StoreCoinMetadata(db *sql.DB, coin SuiPumpfunc.CoinMetadata) error {
	// Store the main information about the coin
	query := `
        INSERT INTO coinInformations (CoinOwner, singer, package_id, coin_name, ticker, description, image, treasury, metadata, choice, admin_cap, configurator, tran_hash, boudingCurve)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
	_, err := db.Exec(query, coin.CoinOwner, coin.Singer, coin.PackageID, coin.Name, coin.Ticker, coin.Description, coin.Image, coin.Treasury, coin.Metadata, coin.Choice, coin.AdminCap, coin.Configurator, coin.TranHash, coin.BoudingCurve)
	if err != nil {
		return err
	}

	// Store the singer's private key in a separate table
	// Since ed25519.PrivateKey is already a []byte, just store it directly
	privateKeyBase64 := base64.StdEncoding.EncodeToString(coin.PrivateKey)

	query = `
        INSERT INTO singersPrivateKeys (singer, private_key)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE private_key=VALUES(private_key)`
	_, err = db.Exec(query, coin.Singer, privateKeyBase64)
	if err != nil {
		return err
	}

	return nil
}

func handleCreateCoin(w http.ResponseWriter, r *http.Request) {
	var flag1, flag2 string
	var CoinType string
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	err := r.ParseMultipartForm(10 << 20) // 10 MB
	if err != nil {
		log.Printf("Error parsing multipart form: %v", err)
		http.Error(w, "Error parsing multipart form", http.StatusBadRequest)
		return
	}

	reqData := struct {
		UserID      string `json:"user_id"`
		CoinName    string `json:"name"`
		Ticker      string `json:"ticker"`
		Description string `json:"description"`
		Image       string `json:"image"`
	}{
		UserID:      r.FormValue("user_id"),
		CoinName:    r.FormValue("name"),
		Ticker:      r.FormValue("ticker"),
		Description: r.FormValue("description"),
		Image:       r.FormValue("image"),
	}

	CoinInformation := CoinInformation{
		CoinOwner:    reqData.UserID,
		Name:         reqData.CoinName,
		Ticker:       reqData.Ticker,
		Description:  reqData.Description,
		Image:        reqData.Image,
		PackageID:    "", // Will be filled later
		AdminCap:     "", // Will be filled later
		Configurator: "", // Will be filled later
		TranHash:     "", // Will be filled later
		BoudingCurve: "", // Will be filled later
	}
	fmt.Println("reqData")
	fmt.Println(reqData)
	var ctx = context.Background()
	var cli = sui.NewSuiClient("https://sui-testnet-rpc.publicnode.com")
	// 输入你的主账户地址
	MyCoinObject := "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
	//录入主账户
	MainAccount, err := signer.NewSignertWithMnemonic("xxxx")
	if err != nil {
		http.Error(w, fmt.Sprintf("Error creating main account: %v", err), http.StatusInternalServerError)
		return
	}

	// 创建账户
	CoinAccount, err := SuiPumpfunc.CreateAccount(reqData.UserID)
	CoinInformation.Singer = CoinAccount.Address
	if err != nil {
		http.Error(w, fmt.Sprintf("Error creating coin account: %v", err), http.StatusInternalServerError)
		return
	}
	fmt.Println(CoinAccount)
	//私钥解码
	priKeyBytes, err := base64.StdEncoding.DecodeString(CoinAccount.PrivateKey)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error decoding private key: %v", err), http.StatusInternalServerError)
		return
	}
	CoinPrivateKey := priKeyBytes

	CreatedCoin := SuiPumpfunc.CoinMetadata{
		CoinOwner:   reqData.UserID,
		Singer:      CoinAccount.Address,
		PrivateKey:  CoinPrivateKey,
		Name:        reqData.CoinName,
		Ticker:      reqData.Ticker,
		Description: reqData.Description,
		Image:       reqData.Image,
	}

	//激活新账户
	ActiveSruct := models.PaySuiRequest{
		Signer:      MainAccount.Address,
		SuiObjectId: []string{MyCoinObject},
		Recipient:   []string{CoinAccount.Address},
		Amount:      []string{"100000000"},
		GasBudget:   "15000000",
	}
	ActiveRsp, ActiveErr := cli.PaySui(ctx, ActiveSruct)
	time.Sleep(4 * time.Second)
	utils.PrettyPrint(ActiveRsp)
	if ActiveErr != nil {
		http.Error(w, fmt.Sprintf("Error pay account: %v", err), http.StatusInternalServerError)
		return
	}
	time.Sleep(4 * time.Second)
	ActiveRsp2, ActiveRspErr := cli.SignAndExecuteTransactionBlock(ctx, models.SignAndExecuteTransactionBlockRequest{
		TxnMetaData: ActiveRsp,
		PriKey:      MainAccount.PriKey,
		// 仅获取effects字段
		Options: models.SuiTransactionBlockOptions{
			ShowEffects:       true,
			ShowObjectChanges: true,
		},
		RequestType: "WaitForLocalExecution",
	})
	utils.PrettyPrint(ActiveRsp2)
	if ActiveRspErr != nil {
		http.Error(w, fmt.Sprintf("Error Active: %v", ActiveRspErr), http.StatusInternalServerError)
		return

	}

	GasSruct := models.PaySuiRequest{
		Signer:      MainAccount.Address,
		SuiObjectId: []string{MyCoinObject},
		Recipient:   []string{CoinAccount.Address},
		Amount:      []string{"1000000000"},
		GasBudget:   "15000000",
	}
	time.Sleep(4 * time.Second)
	GasRsp, GasErr := cli.PaySui(ctx, GasSruct)
	utils.PrettyPrint(GasRsp)
	if GasErr != nil {
		http.Error(w, fmt.Sprintf("Error pay account: %v", GasErr), http.StatusInternalServerError)
		return
	}
	time.Sleep(4 * time.Second)
	GasRsp2, GasRspErr := cli.SignAndExecuteTransactionBlock(ctx, models.SignAndExecuteTransactionBlockRequest{
		TxnMetaData: GasRsp,
		PriKey:      MainAccount.PriKey,
		// 仅获取effects字段
		Options: models.SuiTransactionBlockOptions{
			ShowEffects:       true,
			ShowObjectChanges: true,
		},
		RequestType: "WaitForLocalExecution",
	})
	utils.PrettyPrint(GasRsp2)
	if GasRspErr != nil {
		http.Error(w, fmt.Sprintf("Error Active: %v", GasRspErr), http.StatusInternalServerError)
		return
	}
	var SuiObjectId, GasObjectID string
	if GasRsp2.Effects.Status.Status == "success" {
		for _, obj1 := range ActiveRsp2.ObjectChanges {
			if obj1.Type == "created" {
				SuiObjectId = obj1.ObjectId
			}
		}
		for _, obj2 := range GasRsp2.ObjectChanges {
			if obj2.Type == "created" {
				GasObjectID = obj2.ObjectId
			}
		}
		fmt.Println("SuiObjectId:", SuiObjectId)
		flag1 = "success"
	} else {
		flag1 = "fail"
		http.Error(w, fmt.Sprintf("Error Active: %v", err), http.StatusInternalServerError)
	}
	//合约发布部分
	if flag1 == "success" {
		//账户上发布合约
		modules := []string{
			"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BAEICgELCQEIFAEEAQgRAQgHAgkABQEIAQYLDAEIEgsAAQkACAgICggKCwkBCBQBBgsPAQkAAQICBwsMAQkAAwIHCw8BCQADAgsMAQkABwgTCQELDAEJAAMDAwMLDAEIEgMDAQgDCEFkbWluQ2FwB0JhbGFuY2UMQm9uZGluZ0N1cnZlF0JvbmRpbmdDdXJ2ZUxpc3RlZEV2ZW50BENvaW4MQ29pbk1ldGFkYXRhDENvbmZpZ3VyYXRvcgJJRBdNaWdyYXRpb25Db21wbGV0ZWRFdmVudBVNaWdyYXRpb25QZW5kaW5nRXZlbnQGT3B0aW9uBlBvaW50cwNTVUkGU3RyaW5nCVN3YXBFdmVudAtUcmVhc3VyeUNhcAlUeENvbnRleHQIVHlwZU5hbWUDVUlEA1VybAphZGFwdGVyX2lkBmFtb3VudAVhc2NpaQdiYWxhbmNlBWJjX2lkA2J1eQRjb2luEGNvaW5fbWV0YWRhdGFfaWQRY29uZmlybV9taWdyYXRpb24HY3JlYXRvcgVjdXJ2ZQtkZXNjcmlwdGlvbgRlbWl0GGVtaXRfYm9uZGluZ19jdXJ2ZV9ldmVudB5lbWl0X21pZ3JhdGlvbl9jb21wbGV0ZWRfZXZlbnQcZW1pdF9taWdyYXRpb25fcGVuZGluZ19ldmVudA9lbWl0X3N3YXBfZXZlbnQFZXZlbnQDZmVlC2ZyZWV6ZV9tZXRhDWZyZWV6ZV9vYmplY3QJZnJlZXplX3RyB2ZyZWV6ZXIMZnJvbV9iYWxhbmNlA2dldBZnZXRfY29pbl9tZXRhZGF0YV9pbmZvDGdldF9kZWNpbWFscw9nZXRfZGVzY3JpcHRpb24MZ2V0X2ljb25fdXJsCGdldF9pbmZvCGdldF9uYW1lEWdldF9vdXRwdXRfYW1vdW50DGdldF9yZXNlcnZlcwpnZXRfc3ltYm9sAmlkBGluaXQMaW5wdXRfYW1vdW50DGludG9fYmFsYW5jZQtpbnRvX3N0cmluZwlpc19hY3RpdmUGaXNfYnV5BGpvaW4EbGlzdAtsaXN0aW5nX2ZlZQdtaWdyYXRlDW1pZ3JhdGlvbl9mZWUQbWlncmF0aW9uX3RhcmdldAxtaW50X2JhbGFuY2UEbmFtZQNuZXcGb2JqZWN0CW9iamVjdF9pZAZvcHRpb24Nb3V0cHV0X2Ft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",
		}

		dependencies := []string{
			"0x0000000000000000000000000000000000000000000000000000000000000001",
			"0x0000000000000000000000000000000000000000000000000000000000000002",
		}
		CreatedCoin.Gas = SuiObjectId
		CoinGasBudget := "100000000"
		time.Sleep(4 * time.Second)
		PublishRsp, PublishErr := SuiPumpfunc.Publish(ctx, cli, CoinAccount.Address, modules, dependencies, SuiObjectId, CoinGasBudget, CoinPrivateKey)
		if PublishErr != nil {
			http.Error(w, fmt.Sprintf("Error publish: %v", err), http.StatusInternalServerError)
			return
		}
		if PublishRsp.Effects.Status.Status == "success" {
			CreatedCoin.TranHash = PublishRsp.Digest
			CoinInformation.TranHash = PublishRsp.Digest
			flag2 = "success"
			objectIDTypeMap := make(map[string]string)
			var packageIDSet string
			for _, change := range PublishRsp.ObjectChanges {
				if change.ObjectId != "" {
					objectIDTypeMap[change.ObjectId] = change.ObjectType
				}
				if change.PackageId != "" {
					packageIDSet = change.PackageId
					CoinInformation.PackageID = packageIDSet
				}
			}
			re := regexp.MustCompile(`0x2::coin::CoinMetadata<([^>]+)>`)
			// 遍历 map 并检查类型前缀
			for objectID, objectType := range objectIDTypeMap {
				if strings.HasPrefix(objectType, "0x2::coin::CoinMetadata") {
					CreatedCoin.Metadata = objectID
					CoinInformation.Metadata = objectID
					matches := re.FindStringSubmatch(objectType)
					CoinType = matches[1]
					CreatedCoin.Type = CoinType
				}
				if strings.HasPrefix(objectType, "0x2::coin::TreasuryCap") {
					CreatedCoin.Treasury = objectID
					CoinInformation.Treasury = objectID

				}
				if strings.HasSuffix(objectType, "::curve::AdminCap") {
					CreatedCoin.AdminCap = objectID
					CoinInformation.AdminCap = objectID
				}
				if strings.HasSuffix(objectType, "::curve::Configurator") {
					CreatedCoin.Configurator = objectID
					CoinInformation.Configurator = objectID
				}
			}
			CreatedCoin.PackageID = packageIDSet
		} else {
			flag2 = "fail"
			http.Error(w, "Error publishing move modules", http.StatusInternalServerError)
			return
		}

		if flag2 == "success" {
			time.Sleep(4 * time.Second)
			CreatedCoin.Choice = "NoTypeCall"
			SetProfileRsp, SetProfileErr := SuiPumpfunc.MoveCall(ctx, cli, CreatedCoin)
			if SetProfileErr != nil {
				http.Error(w, fmt.Sprintf("Error setting profile: %v", err), http.StatusInternalServerError)
				fmt.Println("Error setting profile: %v", SetProfileErr)
			}
			utils.PrettyPrint(SetProfileRsp)
			time.Sleep(4 * time.Second)
			CreatedCoin.Choice = "List"
			CreatedCoin.SuiGas = GasObjectID
			//CreatedCoin.Gas = SuiObjectId2
			ListRsp, ListErr := SuiPumpfunc.MoveCall(ctx, cli, CreatedCoin)
			fmt.Println("ListRsp")
			utils.PrettyPrint(ListRsp)
			if ListErr != nil {
				http.Error(w, fmt.Sprintf("Error listing: %v", err), http.StatusInternalServerError)
				fmt.Println("Error listing: %v", ListErr)
			}
			if ListRsp.Effects.Status.Status == "success" {
				for _, change := range ListRsp.ObjectChanges {
					if change.Type == "created" {
						CreatedCoin.BoudingCurve = change.ObjectId
						CoinInformation.BoudingCurve = change.ObjectId
					}
				}
				w.Header().Set("Content-Type", "application/json")
				json.NewEncoder(w).Encode(CoinInformation)
			}
		}
		db, err := SuiUtils.DBConn()
		if err != nil {
			log.Printf("Database connection error: %v", err)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
			return
		}
		defer db.Close()

		// 存储数据
		if err := StoreCoinMetadata(db, CreatedCoin); err != nil {
			log.Printf("Failed to store coin metadata: %v", err)
			http.Error(w, "Failed to store data", http.StatusInternalServerError)
			return
		}
	}
}

//func UploadImageToWalrus(w http.ResponseWriter, r *http.Request) (string, error) {
//
//}

// 根据hash查找代币信息
func fetchTokenInfoHandler(w http.ResponseWriter, r *http.Request) {
	// 从 URL 中获取 tokenHash
	tokenHash := r.URL.Path[len("/api/trade/"):]

	// 数据库连接（请根据你的配置进行修改）
	db, err := SuiUtils.DBConn()
	if err != nil {
		log.Println("Error connecting to database:", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	defer db.Close()

	// 查询数据库获取 token 信息
	var tokenInfo CoinInformation
	err = db.QueryRow("SELECT CoinOwner, singer, package_id, name, ticker, description, image, treasury, metadata, configurator, boudingCurve FROM CoinInformations WHERE tran_hash = ?", tokenHash).Scan(&tokenInfo.CoinOwner, &tokenInfo.Singer, &tokenInfo.PackageID, &tokenInfo.Name, &tokenInfo.Ticker, &tokenInfo.Description, &tokenInfo.Image, &tokenInfo.Treasury, &tokenInfo.Metadata, &tokenInfo.Configurator, &tokenInfo.BoudingCurve)
	if err != nil {
		if err == sql.ErrNoRows {
			http.NotFound(w, r)
		} else {
			log.Println("Error fetching token info:", err)
			http.Error(w, "Internal server error", http.StatusInternalServerError)
		}
		return
	}
	fmt.Println("tokenInfo", tokenInfo)
	// 将结果编码为 JSON 并发送响应
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tokenInfo)
}

// 日志中间件
func logMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		// 请求前打印
		log.Printf("Started %s %s", r.Method, r.URL.Path)

		next.ServeHTTP(w, r)

		// 请求后打印
		log.Printf("Completed in %v", time.Since(start))
	})
}

func getInfoHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	//fmt.Println("r.URL.Query().Get(order)", r.URL.Query().Get("order"))

	// 尝试获取三种种可能的参数
	//id := r.URL.Query().Get("id")
	//hash := r.URL.Query().Get("hash")
	address := r.URL.Query().Get("address")
	order := r.URL.Query().Get("order")
	//var info *SuiPumpfunc.Info

	//// 根据提供的参数调用不同的函数
	//if hash != "" {
	//	info, err = SuiPumpfunc.GetInfoByHash(hash)
	//}
	//if id != "" {
	//	info, err = SuiPumpfunc.GetInfoByID(id)
	//}
	if order != "" {
		AllInfos, err := SuiPumpfunc.GetAllInfoByOrder(order)
		if err != nil {
			log.Printf("Error getting information: %v", err)
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return
		}
		if len(AllInfos) == 0 {
			http.NotFound(w, r)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(AllInfos)

	}
	if address != "" {
		//fmt.Println(1111)
		CreatedCoinInfos, err := SuiPumpfunc.GetInfoByOwner(address)
		fmt.Println(CreatedCoinInfos)
		if err != nil {
			log.Printf("Error getting information: %v", err)
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return
		}
		if len(CreatedCoinInfos) == 0 {
			http.NotFound(w, r)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(CreatedCoinInfos)
	}
}

func main() {
	_ = SuiUtils.InitDB()
	mux := http.NewServeMux()
	// 使用日志中间件包装处理函数
	mux.Handle("/api/create-coin", logMiddleware(http.HandlerFunc(handleCreateCoin)))
	mux.Handle("/api/get-info/", logMiddleware(http.HandlerFunc(getInfoHandler)))
	//mux.Handle("/api/reply", logMiddleware(http.HandlerFunc(handleReply)))
	mux.Handle("/api/checkaddress", logMiddleware(http.HandlerFunc(CheckAddress)))

	mux.Handle("/api/profile", logMiddleware(http.HandlerFunc(InsertProfileByAddress)))
	mux.Handle("/api/trade/", logMiddleware(http.HandlerFunc(fetchTokenInfoHandler)))
	// 设置 CORS
	handler := cors.Default().Handler(mux)

	log.Println("Listening on :9001")
	if err := http.ListenAndServe(":9001", handler); err != nil {
		log.Fatalf("Error starting server: %s", err)
	}
}
