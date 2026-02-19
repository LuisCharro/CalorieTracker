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

echo "Smoke auth/onboarding passed."
