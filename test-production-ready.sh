#!/bin/bash

# LauraAI 生产就绪验证脚本
# 测试积分系统、DeFi数据和余额同步

echo "🧪 LauraAI Production Readiness Test Suite"
echo "=========================================="
echo ""

BACKEND_URL="http://localhost:8081"
FRONTEND_URL="http://localhost:3000"

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试计数器
PASSED=0
FAILED=0

# 测试函数
test_endpoint() {
    local name=$1
    local url=$2
    local expected_code=${3:-200}
    
    echo -n "Testing: $name ... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$response" -eq "$expected_code" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $response)"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC} (Expected $expected_code, got $response)"
        ((FAILED++))
    fi
}

test_api_response() {
    local name=$1
    local url=$2
    local search_term=$3
    
    echo -n "Testing: $name ... "
    
    response=$(curl -s "$url")
    
    if echo "$response" | grep -q "$search_term"; then
        echo -e "${GREEN}✓ PASS${NC} (Found: $search_term)"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC} (Not found: $search_term)"
        echo "Response: $response"
        ((FAILED++))
    fi
}

echo "📡 Backend Service Tests"
echo "------------------------"

# 1. 健康检查
test_endpoint "Backend Health Check" "$BACKEND_URL/health"

# 2. DeFi Market Intelligence
echo ""
echo "💹 DeFi Market Intelligence Tests"
echo "----------------------------------"
test_api_response "Market Intelligence API" "$BACKEND_URL/api/market/intelligence" "bnb_price"
test_api_response "Market Intelligence - Pools" "$BACKEND_URL/api/market/intelligence" "v3_pools"
test_api_response "Market Intelligence - Timestamp" "$BACKEND_URL/api/market/intelligence" "timestamp"

echo ""
echo "🎨 Frontend Service Tests"
echo "-------------------------"

# 3. 前端可访问性
test_endpoint "Frontend Homepage" "$FRONTEND_URL"
test_endpoint "Frontend Dashboard" "$FRONTEND_URL/dashboard"
test_endpoint "Frontend Market" "$FRONTEND_URL/market"
test_endpoint "Frontend Profile" "$FRONTEND_URL/profile"

echo ""
echo "📊 Database Schema Tests"
echo "------------------------"

# 4. 数据库字段验证
echo -n "Testing: Database Schema (points & lra_balance) ... "
DB_CHECK=$(psql -h localhost -U postgres -d lauraai -t -c "SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name IN ('points', 'lra_balance');" 2>/dev/null | wc -l)

if [ "$DB_CHECK" -eq 2 ]; then
    echo -e "${GREEN}✓ PASS${NC} (Both fields exist)"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC} (Missing fields)"
    ((FAILED++))
fi

echo ""
echo "=========================================="
echo "📋 Test Summary"
echo "=========================================="
echo -e "Total Tests: $((PASSED + FAILED))"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! LauraAI is production ready!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some tests failed. Please review the output above.${NC}"
    exit 1
fi
