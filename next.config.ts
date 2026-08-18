import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Render(일반 Node.js 프로세스)에서 실행할 self-hosting 번들을 생성한다.
  // `vinext build`가 dist/standalone/server.js를 만들어내며,
  // Cloudflare Workers 배포 경로(worker/index.ts, wrangler)는 그대로 유지된다.
  output: "standalone",
};

export default nextConfig;
