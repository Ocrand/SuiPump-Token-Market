package SuiPumpfunc

import (
	"encoding/json"
	"fmt"
	"goapi/SuiUtils"
)

// 定义结构体来存储JSON数据
type BuildOutput struct {
	Modules      []string `json:"modules"`
	Dependencies []string `json:"dependencies"`
	Digest       []int    `json:"digest"`
}

// MoveBuild 执行Move构建命令并解析输出，返回modules和dependencies
func MoveBuild(dir string) ([]string, []string, error) {
	cmd, err := SuiUtils.ExecuteSuiCommand("move", "build", "--dump-bytecode-as-base64", "--path", dir)
	if err != nil {
		return nil, nil, fmt.Errorf("error building move modules: %v", err)
	}

	// 解析JSON输出
	var result BuildOutput
	err = json.Unmarshal([]byte(cmd), &result)
	if err != nil {
		return nil, nil, fmt.Errorf("error parsing JSON output: %v", err)
	}

	// 返回结果
	return result.Modules, result.Dependencies, nil
}
