# cccsolutions-website

The CCCSolutions frontend: [Next.js](https://nextjs.org) 16 (App Router) + React 19 + Tailwind CSS v4, deployed to Cloudflare Workers via [OpenNext](https://opennext.js.org/cloudflare). See [`AGENTS.md`](./AGENTS.md) for the layout map, conventions, and env var setup.

## Getting Started

This project uses [bun](https://bun.sh):

```bash
bun install
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Scripts

- `bun run lint` / `bun run typecheck` / `bun run format:check` - the checks CI runs
- `bun run build` - `next build`
- `bun run preview` - build with OpenNext and serve the Worker locally (workerd)
- `bun run deploy` - build with OpenNext and deploy to Cloudflare Workers
