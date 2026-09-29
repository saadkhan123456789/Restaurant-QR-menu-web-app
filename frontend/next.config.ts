import type { NextConfig } from "next";
import os from "os";

function getLocalNetworkIPs(): string[] {
  const ips: string[] = [];
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] ?? []) {
      if (iface.family === "IPv4" && !iface.internal) {
        ips.push(iface.address);
      }
    }
  }
  return ips;
}

const nextConfig: NextConfig = {
  // Allows phones/other devices on the LAN to load the dev server.
  // Recomputed from the machine's current network interfaces on every
  // dev server start, so it keeps working even if the IP changes.
  allowedDevOrigins: getLocalNetworkIPs(),
};

export default nextConfig;
