import type { NextConfig } from 'next';

const securityHeaders=[
  {key:'X-Content-Type-Options',value:'nosniff'},
  {key:'X-Frame-Options',value:'DENY'},
  {key:'Referrer-Policy',value:'no-referrer'},
  {key:'X-DNS-Prefetch-Control',value:'off'},
  {key:'Cross-Origin-Opener-Policy',value:'same-origin'},
  {key:'Permissions-Policy',value:'camera=(self), microphone=(), geolocation=()'},
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers(){
    return [
      {
        source:'/:path*',
        headers:securityHeaders,
      },
      {
        source:'/api/oraculum/:path*',
        headers:[
          {key:'Cache-Control',value:'no-store, max-age=0'},
          {key:'Pragma',value:'no-cache'},
        ],
      },
    ];
  },
};

export default nextConfig;
