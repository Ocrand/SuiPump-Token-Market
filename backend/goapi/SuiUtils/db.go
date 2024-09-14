package SuiUtils

import (
	"database/sql"
	"fmt"
	"log"

	_ "github.com/go-sql-driver/mysql" // 导入 MySQL 驱动
	"gopkg.in/ini.v1"
)

// LoadConfig 读取配置文件
func LoadConfig() (map[string]string, error) {
	cfg, err := ini.Load("../config/settings.config")
	if err != nil {
		return nil, fmt.Errorf("failed to load config file: %v", err)
	}

	dbConfig := make(map[string]string)
	dbConfig["user"] = cfg.Section("mysql").Key("user").String()
	dbConfig["password"] = cfg.Section("mysql").Key("password").String()
	dbConfig["dbname"] = cfg.Section("mysql").Key("dbname").String()
	dbConfig["host"] = cfg.Section("mysql").Key("host").String()
	dbConfig["port"] = cfg.Section("mysql").Key("port").String()

	return dbConfig, nil
}

// DBConn 创建数据库连接
func DBConn() (*sql.DB, error) {
	dbConfig, err := LoadConfig()
	if err != nil {
		return nil, err
	}

	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s",
		dbConfig["user"], dbConfig["password"], dbConfig["host"], dbConfig["port"], dbConfig["dbname"])

	db, err := sql.Open("mysql", dsn)
	if err != nil {
		return nil, err
	}
	return db, nil
}

func InitDB() error {
	dbConfig, err := LoadConfig()
	if err != nil {
		log.Fatalf("Failed to load database config: %v", err)
	}

	db, err := DBConn()
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// 创建 coinInformation 表
	err = createTableIfNotExists(db, dbConfig["dbname"], "coinInformations", `
        CREATE TABLE coinInformations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            CoinOwner VARCHAR(255) NOT NULL,
            singer VARCHAR(255) NOT NULL,
            package_id VARCHAR(255) NOT NULL,
            coin_name VARCHAR(255) NOT NULL,
            ticker VARCHAR(255) NOT NULL,
            description TEXT NOT NULL,
            image TEXT NOT NULL,
            treasury VARCHAR(255) NOT NULL,
            metadata TEXT NOT NULL,
            choice VARCHAR(255) NOT NULL,
            admin_cap VARCHAR(255) NOT NULL,
            configurator VARCHAR(255) NOT NULL,
            tran_hash VARCHAR(255) NOT NULL,
            boudingCurve VARCHAR(255) NOT NULL
        );
    `)

	// 创建 singersPrivateKeys 表
	err = createTableIfNotExists(db, dbConfig["dbname"], "singersPrivateKeys", `
        CREATE TABLE singersPrivateKeys (
            id INT AUTO_INCREMENT PRIMARY KEY,
            singer VARCHAR(255) NOT NULL UNIQUE,
            private_key BLOB NOT NULL
        );
    `)
	//创建walletprofie表
	err = createTableIfNotExists(db, dbConfig["dbname"], "WalletProfile", `
		CREATE TABLE WalletProfile (
			id INT AUTO_INCREMENT PRIMARY KEY,
			Address VARCHAR(255) NOT NULL UNIQUE,
			Name VARCHAR(255) NOT NULL,
			Avatar MEDIUMTEXT NOT NULL,
			Bio VARCHAR(255) NOT NULL
		);
	`)
	return err
}

func createTableIfNotExists(db *sql.DB, dbName, tableName, createTableQuery string) error {
	var checkTableName string
	err := db.QueryRow("SELECT table_name FROM information_schema.tables WHERE table_schema = ? AND table_name = ?", dbName, tableName).Scan(&checkTableName)
	switch {
	case err == sql.ErrNoRows:
		// 表不存在，创建表
		_, err = db.Exec(createTableQuery)
		if err != nil {
			log.Fatalf("Failed to create table %s: %v", tableName, err)
		}
		fmt.Printf("Table '%s' created.\n", tableName)
	case err != nil:
		// 其他错误
		log.Fatalf("Error checking table existence for %s: %v", tableName, err)
	default:
		// 表已存在
		fmt.Printf("Table '%s' already exists. Skipping creation.\n", tableName)
	}
	return err
}
