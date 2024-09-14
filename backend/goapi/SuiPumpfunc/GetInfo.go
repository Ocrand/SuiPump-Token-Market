package SuiPumpfunc

import (
	"database/sql"
	"errors"
	"fmt"
	"goapi/SuiUtils"
)

type Info struct {
	Id           string `json:"id"`
	CoinOwner    string `json:"coin_owner"`
	CreatedBy    string `json:"created_by"`
	PackageID    string `json:"package_id"`
	Name         string `json:"name"`
	Description  string `json:"description"`
	Ticker       string `json:"ticker"`
	Image        string `json:"image"`
	Treasury     string `json:"treasury"`
	Metadata     string `json:"metadata"`
	AdminCap     string `json:"admin_cap"`
	Configurator string `json:"configurator"`
	boudingCurve string `json:"boudingcurve"`
}

type CreatedInfo struct {
	ImageUrl     string `json:"imageUrl"`
	CreatedBy    string `json:"createdBy"`
	Name         string `json:"name"`
	Ticker       string `json:"ticker"`
	Description  string `json:"description"`
	Digest       string `json:"digest"`
	BoudingCurve string `json:"boudingcurve"`
}

type AllInfo struct {
	Id           string `json:"id"`
	ImageUrl     string `json:"imageUrl"`
	CreatedBy    string `json:"createdBy"`
	Name         string `json:"name"`
	Ticker       string `json:"ticker"`
	Description  string `json:"description"`
	Digest       string `json:"digest"`
	BoudingCurve string `json:"boudingcurve"`
}

func GetInfoByHash(hash string) (*Info, error) {
	// 假设 db 是 *sql.DB 类型的数据库连接
	var info Info
	db, _ := SuiUtils.DBConn()
	query := `SELECT id, CoinOwner, singer, package_id, coin_name, ticker, description, image, treasury, metadata, admin_cap, configurator, boudingCurve FROM coinInformations WHERE tran_hash = ?`
	row := db.QueryRow(query, hash)
	err := row.Scan(&info.Id, &info.CoinOwner, &info.CreatedBy, &info.PackageID, &info.Name, &info.Ticker, &info.Description, &info.Image, &info.Treasury, &info.Metadata, &info.AdminCap, &info.Configurator, &info.boudingCurve)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil // 没有找到记录
		}
		return nil, err // 查询错误
	}
	return &info, nil
}

func GetInfoByID(id string) (*Info, error) {
	// 假设 db 是 *sql.DB 类型的数据库连接
	var info Info
	db, _ := SuiUtils.DBConn()
	query := `SELECT id, CoinOwner, singer, package_id, coin_name, ticker, description, image, treasury, metadata, configurator, boudingCurve FROM coinInformation WHERE id = ?`
	row := db.QueryRow(query, id)
	err := row.Scan(&info.Id, &info.CoinOwner, &info.CreatedBy, &info.PackageID, &info.Name, &info.Ticker, &info.Description, &info.Image, &info.Treasury, &info.Metadata, &info.Configurator, &info.boudingCurve)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil // 没有找到记录
		}
		return nil, err // 查询错误
	}
	return &info, nil
}

func GetInfoByOwner(address string) ([]CreatedInfo, error) {
	// 假设 db 是 *sql.DB 类型的数据库连接
	db, _ := SuiUtils.DBConn()
	query := `SELECT singer, coin_name ,ticker, description, image, tran_hash, boudingCurve FROM coinInformations WHERE CoinOwner = ?`

	// 使用 db.Query 进行查询，获取多个结果
	rows, err := db.Query(query, address)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var createdInfos []CreatedInfo

	// 遍历查询结果
	for rows.Next() {
		var createdInfo CreatedInfo
		err := rows.Scan(&createdInfo.CreatedBy, &createdInfo.Name, &createdInfo.Ticker, &createdInfo.Description, &createdInfo.ImageUrl, &createdInfo.Digest, &createdInfo.BoudingCurve)
		if err != nil {
			return nil, err
		}
		createdInfos = append(createdInfos, createdInfo)
	}

	// 检查是否在扫描结果时遇到错误
	if err := rows.Err(); err != nil {
		return nil, err
	}

	return createdInfos, nil
}

func GetAllInfoByOrder(order string) ([]AllInfo, error) {
	// 假设 db 是 *sql.DB 类型的数据库连接
	db, _ := SuiUtils.DBConn()
	query := fmt.Sprintf(`SELECT id, CoinOwner, coin_name, ticker, description, image, tran_hash, boudingCurve FROM coinInformations ORDER BY id %s`, order)

	// 使用 db.Query 进行查询，获取多个结果
	rows, err := db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var AllInfos []AllInfo

	// 遍历查询结果
	for rows.Next() {
		var AllInfo AllInfo
		err := rows.Scan(&AllInfo.Id, &AllInfo.CreatedBy, &AllInfo.Name, &AllInfo.Ticker, &AllInfo.Description, &AllInfo.ImageUrl, &AllInfo.Digest, &AllInfo.BoudingCurve)
		if err != nil {
			return nil, err
		}
		AllInfos = append(AllInfos, AllInfo)
	}

	// 检查是否在扫描结果时遇到错误
	if err := rows.Err(); err != nil {
		return nil, err
	}

	return AllInfos, nil
}
