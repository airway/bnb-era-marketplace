# ERA Marketplace

Hackathon submission for BNB Chain **Build the Era** (submit by 9 Sep 2026 UTC).

An **AI agent marketplace** on BNB Smart Chain: browse ERC-8004 identities, read the track record, compare, and start a hire. This repo is the venue — not a portfolio of agents we run.

- Brief: https://www.bnbchain.org/en/blog/build-the-era-build-the-official-bnb-agent-studio-marketplace
- Hackathon: https://www.bnbchain.org/en/hackathons/smart-money-era
- Studio docs: https://docs.bnbchain.org/developer-kit/bnbchain-studio/
- ERC-8004: https://eips.ethereum.org/EIPS/eip-8004

## What judges can click

1. Open `/` — category tiles + a live (or labeled fallback) slice of the index.
2. Open **Browse** — search, filter (monitoring, grid trading, health-factor, yield, trading, research, security, payments), hide mash names, x402-only.
3. Open an agent — ERC-8004 identity (token, registry, owner, tx) + performance block that says whether numbers are on-chain or estimated.
4. Compare two or three cards.
5. **Hire** with mock x402 or mock escrow. Confirm. Advance the job on **My hires**.

No Twitter, Discord, or captcha. No secrets in the repo.

## Run

Needs Node 20+.

```bash
npm install
npm run dev
```

Open http://localhost:3000

```bash
npm test
npm run build
```

Optional env (see `.env.example`): `SCAN_API_KEY` if you have a 8004scan key. Anonymous access works and is rate-limited.

## Demo path (90 seconds)

1. `/marketplace?category=yield` — Yield Rover / Pancake LP Ranger (reference, labeled) plus any live yield matches.
2. `/marketplace?category=health-factor` — Venus Guard.
3. Open a **Live 8004scan** card (often `Ave.ai Trading Agent` or `Q402 Agent`) — real `tokenId` on chain 56.
4. Compare that live card with a reference card.
5. Hire Watchtower (monitoring) via mock x402 → `/hires` → Advance.

## Architecture

```
Browser  →  Next.js app  →  8004scan public API (chainId=56)
                         ↘  bundled snapshot + labeled reference catalog
Hire API (in-memory) + localStorage copy for the demo clock
```

| Layer | Role |
| --- | --- |
| ERC-8004 Identity Registry `0x8004A169…a432` on BSC | On-chain agent NFT / `agentId` |
| ERC-8004 Reputation Registry `0x8004BAa1…9b63` | Feedback / track record when it exists |
| [8004scan](https://8004scan.io/developers) | Public index we query first |
| `src/data/snapshot.json` | Last successful live page (real token IDs) |
| `src/data/reference-catalog.json` | Category coverage. **Not** live token IDs |

Hire is intentionally mock: x402 / ERC-8183 are the intended rails (BNB Agent Studio + Binance x402), but this build does not send mainnet or testnet payments. Wallet connect only reads an address.

## Data honesty

- **Live 8004scan** — identity and counts from the public index. Empty feedback stays empty.
- **Bundled snapshot** — same schema, captured when the index last answered. Banner shows the timestamp.
- **Reference listing** — written for the four brief categories (plus extras) so filters and hire still work when the live page is all clones or the API is down. Track record source is `reference-estimated`.

8004scan search/stats endpoints often 500 or time out. We treat that as a fallback trigger, not a fake success.

## Stack

Next.js 15 (App Router) + TypeScript. No wallet SDK required. Vitest for classifier + hire tests.

## License

MIT for this submission unless the repo owner says otherwise.
