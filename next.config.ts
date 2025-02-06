/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
  },
  experimental: {
    serverActions: true,
  }
}

module.exports = nextConfig
