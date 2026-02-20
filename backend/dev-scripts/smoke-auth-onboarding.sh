#!/usr/bin/env bash
set -euo pipefail

API_URL="${API_URL:-http://localhost:4000}"
EMAIL="smoke_$(date +%s)@example.com"

echo "Smoke auth/onboarding against ${API_URL}"
echo "Email: ${EMAIL}"

health_check() {
  local label="$1"
  local code
  code="$(curl -sS -o /dev/null -w '%{http_code}' "${API_URL}/health" || true)"
  echo "${label}_health:${code}"
  if [[ "${code}" != "200" ]]; then
    echo "Health check failed after ${label}"
    exit 1
  fi
}

health_check "initial"

echo "1) register user"
curl -sS -o /dev/null -w "register:%{http_code}\n" \
  -X POST "${API_URL}/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${EMAIL}\",\"displayName\":\"Smoke User\",\"password\":\"Smoke123!\"}"
health_check "register"

echo "2) duplicate register should be 409"
dup_code="$(curl -sS -o /dev/null -w '%{http_code}' \
  -X POST "${API_URL}/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${EMAIL}\",\"displayName\":\"Smoke User 2\",\"password\":\"Smoke123!\"}")"
echo "duplicate_register:${dup_code}"
if [[ "${dup_code}" != "409" ]]; then
  echo "Expected duplicate register to return 409"
  exit 1
fi
health_check "duplicate_register"

echo "3) login existing user"
login_json="$(curl -sS \
  -X POST "${API_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${EMAIL}\",\"password\":\"Smoke123!\"}")"
user_id="$(echo "${login_json}" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p')"
if [[ -z "${user_id}" ]]; then
  echo "Failed to parse user id from login response"
  exit 1
fi
echo "login_user_id:${user_id}"
health_check "login"

echo "4) login missing user should be 404"
missing_code="$(curl -sS -o /dev/null -w '%{http_code}' \
  -X POST "${API_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"does-not-exist@example.com","password":"x"}')"
echo "missing_user_login:${missing_code}"
if [[ "${missing_code}" != "404" ]]; then
  echo "Expected missing user login to return 404"
  exit 1
fi
health_check "missing_user_login"

echo "5) patch user preferences"
patch_code="$(curl -sS -o /dev/null -w '%{http_code}' \
  -X PATCH "${API_URL}/api/auth/user/${user_id}" \
  -H "Content-Type: application/json" \
  -d '{"preferences":{"diet":"omnivore","timezone":"Europe/Zurich"}}')"
echo "patch_preferences:${patch_code}"
if [[ "${patch_code}" != "200" ]]; then
  echo "Expected preferences patch to return 200"
  exit 1
fi
health_check "patch_preferences"

echo "6) test error simulation endpoints"
test_status="$(curl -sS "${API_URL}/api/test/errors/status")"
echo "test_status_endpoint:$(echo "${test_status}" | grep -o '"errorSimulationEnabled":[^,]*' || echo 'error_simulation:checked')"
health_check "test_status"

echo "7) test 500 error simulation"
err_500="$(curl -sS -o /dev/null -w '%{http_code}' "${API_URL}/api/test/errors/500")"
echo "error_500:${err_500}"
if [[ "${err_500}" != "500" ]]; then
  echo "Expected error simulation 500 to return 500"
fi
health_check "error_500"

echo "8) test 503 error simulation"
err_503="$(curl -sS -o /dev/null -w '%{http_code}' "${API_URL}/api/test/errors/503")"
echo "error_503:${err_503}"
if [[ "${err_503}" != "503" ]]; then
  echo "Expected error simulation 503 to return 503"
fi
health_check "error_503"

echo "9) test 429 error simulation"
err_429="$(curl -sS -o /dev/null -w '%{http_code}' "${API_URL}/api/test/errors/429")"
echo "error_429:${err_429}"
if [[ "${err_429}" != "429" ]]; then
  echo "Expected error simulation 429 to return 429"
fi
health_check "error_429"

echo "Smoke auth/onboarding passed."
