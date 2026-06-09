import {
  pbkdf2Sync,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

const ITERATIONS = 120000;
const KEY_LENGTH = 64;
const DIGEST = "sha512";

export const hashPassword = (password: string): string => {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString("hex");

  return `pbkdf2$${ITERATIONS}$${salt}$${hash}`;
};

export const comparePassword = (password: string, hashedPassword: string): boolean => {
  const [scheme, iterationsText, salt, hash] = hashedPassword.split("$");

  if (scheme !== "pbkdf2" || !iterationsText || !salt || !hash) {
    return false;
  }

  const iterations = Number(iterationsText);
  const derivedHash = pbkdf2Sync(password, salt, iterations, KEY_LENGTH, DIGEST);
  const expectedHash = Buffer.from(hash, "hex");

  if (derivedHash.length !== expectedHash.length) {
    return false;
  }

  return timingSafeEqual(derivedHash, expectedHash);
};
