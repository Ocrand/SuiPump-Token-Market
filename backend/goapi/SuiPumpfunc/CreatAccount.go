package SuiPumpfunc

import (
	"crypto/ed25519"
	"crypto/rand"
	"database/sql"
	"encoding/base64"
	"fmt"
	"goapi/SuiUtils"

	"github.com/coming-chat/go-sui/v2/account"
	"github.com/coming-chat/go-sui/v2/lib"
	"github.com/coming-chat/go-sui/v2/sui_types"
	_ "github.com/go-sql-driver/mysql" // 导入 MySQL 驱动
)

type UserAccount struct {
	ID         string `json:"user_id"`
	Address    string `json:"address"`
	PrivateKey string `json:"private_key"`
	PublicKey  string `json:"public_key"`
	Signature  string `json:"signature"`
}

func insertAccount(userAccount UserAccount) error {
	db, err := SuiUtils.DBConn()
	if err != nil {
		return fmt.Errorf("Error connecting to database: %v", err)
	}
	defer func(db *sql.DB) {
		err := db.Close()
		if err != nil {

		}
	}(db)

	insertQuery := `INSERT INTO accounts(user_id, address, private_key, public_key, signature) VALUES (?, ?, ?, ?, ?)`
	_, err = db.Exec(insertQuery, userAccount.ID, userAccount.Address, userAccount.PrivateKey, userAccount.PublicKey, userAccount.Signature)
	if err != nil {
		return fmt.Errorf("Error inserting account: %v", err)
	}
	return nil
}

// VerifySignature 验证签名
func (ua *UserAccount) VerifySignature() bool {
	// 解码Base64编码的公钥和签名
	publicKeyBytes, err := base64.StdEncoding.DecodeString(ua.PublicKey)
	if err != nil {
		fmt.Println("Error decoding public key:", err)
		return false
	}
	signatureBytes, err := base64.StdEncoding.DecodeString(ua.Signature)
	if err != nil {
		fmt.Println("Error decoding signature:", err)
		return false
	}

	// 使用公钥验证签名
	return ed25519.Verify(publicKeyBytes, []byte(ua.ID), signatureBytes)
}

func CreateAccount(userID string) (UserAccount, error) {
	// 生成随机种子
	seed := make([]byte, 32)
	_, err := rand.Read(seed)
	if err != nil {
		return UserAccount{}, fmt.Errorf("Error generating random seed: %v", err)
	}

	// 创建签名方案
	scheme := sui_types.SignatureScheme{ED25519: &lib.EmptyEnum{}} // 使用 ED25519 签名方案

	// 使用种子创建账户
	acc := account.NewAccount(scheme, seed)

	// 获取私钥并将其转换为Base64字符串
	privateKeyBytes := acc.KeyPair.PrivateKey()
	privateKeyBase64 := base64.StdEncoding.EncodeToString(privateKeyBytes)

	// 获取公钥并将其转换为Base64字符串
	publicKeyBytes := acc.KeyPair.PublicKey()
	publicKeyBase64 := base64.StdEncoding.EncodeToString(publicKeyBytes)

	// 使用账户对用户ID进行签名
	signatureBytes := acc.Sign([]byte(userID))
	signatureBase64 := base64.StdEncoding.EncodeToString(signatureBytes)

	// 创建 UserAccount 结构体
	userAccount := UserAccount{
		ID:         userID,
		Address:    acc.Address,
		PrivateKey: privateKeyBase64,
		PublicKey:  publicKeyBase64,
		Signature:  signatureBase64,
	}

	//// 插入用户账户信息到数据库
	//err = insertAccount(userAccount)
	//if err != nil {
	//	return UserAccount{}, fmt.Errorf("Error inserting account into database: %v", err)
	//}

	return userAccount, nil
}
