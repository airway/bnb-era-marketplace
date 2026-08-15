# ERA Marketplace

Hackathon submission for BNB Chain **Build the Era** (intake by **2026-09-09 12:00 UTC**).

[Intake form](https://forms.gle/9g9XPNFwnYaHAz9L8) · [Brief](https://www.bnbchain.org/en/blog/build-the-era-build-the-official-bnb-agent-studio-marketplace) · [Studio docs](https://docs.bnbchain.org/developer-kit/bnbchain-studio/)

A marketplace for **ERC-8004 agents already live on BNB Smart Chain**. Not a portfolio of agents we operate.

## Public URL

**https://airway.github.io/**

Durable GitHub Pages (user site). No captcha, no account wall. Static export of this branch; `_next` assets are published (not Jekyll-stripped). Hire is client-side: live A2A quote, then you sign ERC-8183 `createJob` → `registerJob` → `setBudget` → approve U → `fund()` (U moves into AgenticCommerce escrow). `notify_funded` is sent from the browser.

`vercel.json` is a real Next.js config (framework + build). The durable judge URL is GitHub Pages above — an anonymous Vercel deploy expires in an hour, so it is not the public URL.

The Cloudflare Worker `https://bnb-era-marketplace.iceline.workers.dev` may lag this branch until it is redeployed. Do not use `https://airway.github.io/bnb-era-marketplace/` — project Pages is not enabled.

## Rubric coverage

1. **Functionality** — Land on `/` → pick one of four desks → read identity + live strategy + hire checklist → request an A2A quote → **Start hire** signs `createJob` → `registerJob` → `setBudget` → approve U → `fund()`. Job id is read from `JobCreated`. Status is not `funded` until `fund()` confirms. No account, captcha, or X/Discord.
2. **Data quality** — Live 8004scan search + BSC `tokenURI` / `ownerOf` on `0x8004A169…a432`. Operator `/status`, `/strategy`, `/performance` when the registration publishes them. Empty feedback stays empty. Fallback is a dated snapshot of **the same real token IDs**.
3. **Agent diversity** — Four equal desks: **Rebalancing** (LP ranges / auto-reset), **Grid trading**, **Yield optimisation**, **Health factor monitoring**.

## Demo (judges)

1. `/` — four desks.
2. `/desks/rebalancing` — **BNB LP Range Rebalancer** `#265375` (live Pancake V3 range, APR, last reset).
3. `/desks/grid` — **positioncrew-bounded-grid** `#266234` (real grid identity). Agent Studio `#267697` is filtered — it is a `/launch` stub with no A2A. Registration A2A is a Termix `{agentId}` placeholder; the card says so.
4. `/desks/yield` — **BNB Yield Optimizer** `#265876` (identity + A2A URL are live; operator host was HTTP 502 when probed — we do not invent APR). Agent Studio `#267698` is filtered.
5. `/desks/health-factor` — **BNB Lending Guardian** `#266933` (live Venus HF / thresholds; HF unpublished stays unpublished).
6. Identity → **Start hire** → wallet signs createJob → registerJob → setBudget → approve U → fund() on AgenticCommerce `0xEa4DAa3100A767e86FDed867729ae7446476EBA6` (U token `0xcE24439F2D9C6a2289F741120FE202248B666666`). `notify_funded` runs after fund() with the JobCreated id.

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

Optional: `BSC_RPC_URL` (public dataseed is the default). No API keys required. Operator `/activate` on some agents requires an operator key — we do not ship one.

## What we measured (2026-08-15)

- 8004scan `GET /agents?chainId=56&search=rebalance` returns `#265375`.
- LP operator `https://bnb-lp-api.172-104-171-139.nip.io/status` publishes range, in-range, APR, PnL, rebalance_count.
- LP A2A `message/send` + `negotiate` returns a signed ERC-8183 quote (`verifying_contract` = official AgenticCommerce).
- Guardian `https://bnb-guardian.172-104-171-139.nip.io/status` publishes HF / risk; A2A negotiate returns price `1e18` U.
- Yield operator `bnb-yield.172-104-171-139.nip.io` returned **502** — listed as down, not estimated.
- `tokenURI` + `ownerOf` succeed. `totalSupply()` on the identity proxy **reverts**.
- Ave.ai / Q402 / `example-agent.ai` clones are filtered.

## Stack

Next.js 15. Hire rail is ERC-8183 (BNBAgent / Pieverse kernel) plus optional live x402 probe. Mock x402 / escrow clock removed. A hire is not labelled funded until `fund()` confirms on-chain.

## License

MIT unless the repo owner says otherwise.
