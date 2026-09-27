export interface AdminUser {
  id: string;
  username: string;
  role: "admin";
}

export interface AdminSessionPayload {
  sub: string;
  username: string;
  role: "admin";
}
