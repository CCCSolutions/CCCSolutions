/** @type {import('next').NextConfig} */

// Junior problems that are identical to a senior problem don't get their own
// solution page; the solution lives on the senior page. Anyone landing on the
// junior URL (bookmark, external link, typed by code) is sent to the senior
// page. 302 on purpose, not 301: a temporary redirect keeps the junior URL
// indexed, so searches for the junior code still surface the problem.
// Source of truth is the junior entries in constants.ts whose `link` points at
// a senior page; keep this list in sync if a new shared problem is added.
const sharedProblemRedirects = [
  ['/contest/2026/j5', '/contest/2026/s2'],
  ['/contest/2023/j4', '/contest/2023/s1'],
  ['/contest/2022/j4', '/contest/2022/s2'],
  ['/contest/2021/j5', '/contest/2021/s2'],
  ['/contest/2020/j5', '/contest/2020/s2'],
  ['/contest/2019/j4', '/contest/2019/s1'],
  ['/contest/2018/j4', '/contest/2018/s2'],
  ['/contest/2017/j5', '/contest/2017/s3'],
  ['/contest/2016/j5', '/contest/2016/s2'],
  ['/contest/2014/j4', '/contest/2014/s1'],
  ['/contest/2013/j3', '/contest/2013/s1'],
  ['/contest/2013/j5', '/contest/2013/s3'],
  ['/contest/2012/j5', '/contest/2012/s4'],
  ['/contest/2008/j5', '/contest/2008/s5'],
  ['/contest/2003/j3', '/contest/2003/s1'],
  ['/contest/2002/j3', '/contest/2002/s1'],
  ['/contest/2002/j4', '/contest/2002/s2'],
  ['/contest/2002/j5', '/contest/2002/s3'],
  ['/contest/2000/j3', '/contest/2000/s1'],
  ['/contest/2000/j4', '/contest/2000/s2'],
  ['/contest/2000/j5', '/contest/2000/s3'],
].map(([source, destination]) => ({ source, destination, statusCode: 302 }));

const nextConfig = {
  images: {
    unoptimized: true,
  },
  async redirects() {
    return sharedProblemRedirects;
  },
};

export default nextConfig;

// Gives `next dev` access to the Cloudflare context (bindings, env) so local dev
// matches the Workers runtime. No-op in production builds.
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';
initOpenNextCloudflareForDev();
