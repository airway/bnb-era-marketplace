# ERA Marketplace

Hackathon submission for BNB Chain **Build the Era** (intake by **2026-09-09 12:00 UTC**).

[Intake form](https://forms.gle/9g9XPNFwnYaHAz9L8) · [Brief](https://www.bnbchain.org/en/blog/build-the-era-build-the-official-bnb-agent-studio-marketplace) · [Studio docs](https://docs.bnbchain.org/developer-kit/bnbchain-studio/)

A marketplace for **ERC-8004 agents already live on BNB Smart Chain**. Not a portfolio of agents we operate.

## Rubric coverage

1. **Functionality** — Land on `/` → pick one of four desks → read identity + registration + hire checklist → activate. No account, captcha, or X/Discord.
2. **Data quality** — Live 8004scan search + direct BSC `tokenURI` / `ownerOf` on `0x8004A169…a432`. Empty feedback stays empty. Fallback is a dated snapshot of **the same real token IDs**, labeled.
3. **Agent diversity** — Four equal desks: **Rebalancing**, **Grid trading**, **Yield optimisation**, **Health factor monitoring**. Same explainer, mandate, and hire path on each.

## Run

```bash
npm install
npm run dev
```

http://localhost:3000

```bash
npm test
npm run build
```

Optional: `BSC_RPC_URL` (public dataseed is the default). No API keys required.

Public URL for judges: deploy this repo to Vercel (`npx vercel`) or any Node host. This environment has no Vercel/Cloudflare login, so a durable preview URL is not published from the agent. Cloudflare `wrangler deploy --temporary` only lives 60 minutes and is not used.

## Demo (judges)

1. `/` — four desks, first-timer steps.
2. `/desks/rebalancing` — live search; open **BNB LP Range Rebalancer** `#265375`.
3. `/desks/grid` — **GridMaster Ops** `#267697`.
4. `/desks/yield` — **Yield Compass** `#267698`.
5. `/desks/health-factor` — **BNB Lending Guardian** `#266933` or **HealthGuard** `#259573`.
6. Compare two → **Activate** (mock x402) → `/hires` → Advance.

## What we measured (2026-08-15)

- 8004scan `GET /agents?chainId=56&search=rebalance` returns live hits (e.g. `#265375`).
- `search=grid trading`, `yield`, `health factor` / `venus` also return live BSC identities.
- `tokenURI` + `ownerOf` succeed on the identity registry via `bsc-dataseed.binance.org`.
- `totalSupply()` on that proxy **reverts** (not ERC-721 Enumerable). We do not invent a story beyond that revert.
- 8004scan search **sometimes times out**. Then we serve `src/data/coverage-snapshot.json` (real token IDs only).

## Stack

Next.js 15. Hire is mock x402 / escrow on purpose.

## License

MIT unless the repo owner says otherwise.
