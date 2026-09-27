import { hash } from "bcryptjs";

const password = process.argv[2];

if (!password) {
  console.error('Usage: node scripts/hash-admin-password.mjs "<password>"');
  process.exit(1);
}

if (password.length < 8 || password.length > 128) {
  console.error("Password must be between 8 and 128 characters.");
  process.exit(1);
}

const passwordHash = await hash(password, 12);
console.log(passwordHash);
