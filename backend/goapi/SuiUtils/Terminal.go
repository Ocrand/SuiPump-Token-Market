package SuiUtils

import (
	"bytes"
	"fmt"
	"os/exec"
)

// ExecuteSuiCommand 执行 Sui 客户端命令并返回输出
func ExecuteSuiCommand(args ...string) (string, error) {
	// 使用 sui 作为基础命令，并附加任何额外的参数
	cmd := exec.Command("sui", args...)

	// 创建一个用于捕获标准输出的缓冲区
	var stdout bytes.Buffer
	cmd.Stdout = &stdout

	// 创建一个用于捕获标准错误的缓冲区
	var stderr bytes.Buffer
	cmd.Stderr = &stderr

	// 运行命令
	err := cmd.Run()
	if err != nil {
		return "", fmt.Errorf("error executing sui command: %v, stderr: %s", err, stderr.String())
	}

	// 返回标准输出的内容
	return stdout.String(), nil
}
