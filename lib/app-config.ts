export function getApiUrl() {
  return process.env.API_URL?.trim() || "/api";
}

export function getBaseUrl() {
  return process.env.BASE_URL?.trim() || "http://localhost:3000";
}

export function getDatabaseName() {
  return process.env.DB_NAME?.trim() || "hazzart";
}
