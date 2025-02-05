import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
  }
};

export default nextConfig;
