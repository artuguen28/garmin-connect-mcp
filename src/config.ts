import dotenv from "dotenv";

dotenv.config();

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

export const config = {
  garminUsername: requireEnv("GARMIN_USERNAME"),
  garminPassword: requireEnv("GARMIN_PASSWORD"),
  port: Number(process.env.PORT ?? "3000"),
};
