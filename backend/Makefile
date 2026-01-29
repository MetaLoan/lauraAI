.PHONY: build run test clean init-db

# 构建项目
build:
	go build -o lauraai-backend cmd/server/main.go

# 运行服务器
run:
	go run cmd/server/main.go

# 初始化数据库
init-db:
	./init-db.sh

# 运行测试
test:
	go test ./...

# 清理构建文件
clean:
	rm -f lauraai-backend

# 安装依赖
deps:
	go mod download
	go mod tidy

# 完整设置（初始化数据库 + 安装依赖）
setup: deps init-db
	@echo "设置完成！请创建 .env 文件并配置环境变量"
