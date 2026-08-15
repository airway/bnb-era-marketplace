# ERA Marketplace

Hackathon submission for BNB Chain **Build the Era** (intake by **2026-09-09 12:00 UTC**).

[Intake form](https://forms.gle/9g9XPNFwnYaHAz9L8) · [Brief](https://www.bnbchain.org/en/blog/build-the-era-build-the-official-bnb-agent-studio-marketplace) · [Studio docs](https://docs.bnbchain.org/developer-kit/bnbchain-studio/)

A marketplace for **ERC-8004 agents already live on BNB Smart Chain**. Not a portfolio of agents we operate.

## Public URL

**https://airway.github.io/**

Launch Pad: republish the Worker `https://bnb-era-marketplace.iceline.workers.dev` from `cursor/bnb-era-marketplace-c781` with `npm run deploy` (OpenNext + `wrangler deploy` using `wrangler.jsonc`). This environment cannot write the iceline account.

GitHub Pages is static and has no `/api/a2a`. Browser A2A for `#265375` posts only to `https://era-a2a-proxy.iceline.workers.dev/api/a2a`.

Hire rails: `POST /api/hire` accepts `paymentRail=x402` (on-chain ERC-20 transfer from a live HTTP 402 or A2A price) and `erc-8183` (AgenticCommerce `fund()`). Mocks stay rejected. Status is not funded until the on-chain settle confirms.

## Rubric coverage

1. **Functionality** — Land on `/` → pick one of four desks → read identity + live strategy + hire checklist → request an A2A quote → **Start hire** signs `createJob` → `registerJob` → `setBudget` → approve U → `fund()`. Job id is read from `JobCreated`. Status is not `funded` until `fund()` confirms. No account, captcha, or X/Discord.
2. **Data quality** — Live 8004scan search + BSC `tokenURI` / `ownerOf` on `0x8004A169…a432`. Operator `/status`, `/strategy`, `/performance` when the registration publishes them. Empty feedback stays empty. Fallback is a dated snapshot of **the same real token IDs**.
3. **Agent diversity** — Four equal desks: **Rebalancing** (LP ranges / auto-reset), **Grid trading**, **Yield optimisation**, **Health factor monitoring**.

## Demo (judges)

1. `/` — four desks.
2. `/desks/rebalancing` — **BNB LP Range Rebalancer** `#265375` (live Pancake V3 range, APR, last reset).
3. `/desks/grid` — three registered BSC identities: **positioncrew-bounded-grid** `#266234`, **DeFiBot** `#172801`, **TradePilot** `#177310`. Agent Studio `#267697` is filtered. Registration A2A is a Termix `{agentId}` template; we substitute the token id and probe the live Termix card (`status` / `presence`). That card is not a negotiable A2A (POST 401). We do not invent a fourth grid agent or a hire price.
4. `/desks/yield` — live yield identities from 8004scan. `#265876` is unfeatured: the operator host returns HTTP 502, so it is not treated as a live A2A and does not lead the desk. We do not invent a replacement operator or APR. Agent Studio `#267698` is filtered.
5. `/desks/health-factor` — **BNB Lending Guardian** `#266933` (live Venus HF / thresholds). An empty account (`health_factor` null, collateral 0, debt 0) shows unknown — not the Venus `999` / `SAFE` sentinel.
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
- Guardian `https://bnb-guardian.172-104-171-139.nip.io/status` publishes HF / risk; empty Venus account is `null` / `0` / `0` with a `999` performance sentinel — we print unknown, not `999.00` / `SAFE`. A2A negotiate returns price `1e18` U.
- Yield operator `bnb-yield.172-104-171-139.nip.io` returned **502** — unfeatured, not estimated.
- Grid `#266234` Termix card `GET .../a2a/agents/266234/card` returns live `status` / `presence`. Host `/status` is 404. POST to the card is 401 — not a quote path.
- `tokenURI` + `ownerOf` succeed. `totalSupply()` on the identity proxy **reverts**.
- Ave.ai / Q402 / `example-agent.ai` clones are filtered.

## Stack

Next.js 15 on Cloudflare Workers (OpenNext). Hire rails: live x402 exact (ERC-20 transfer) and ERC-8183 escrow. Mock x402 / escrow clock removed. A hire is not labelled funded until the on-chain settle confirms.

## License

MIT unless the repo owner says otherwise.
