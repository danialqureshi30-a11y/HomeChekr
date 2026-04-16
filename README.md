# HomeChekr MVP

HomeChekr is a Node-backed MVP for analyzing whether a home is overpriced, underpriced, or accurately priced relative to comparable homes in the same area.

## What it does

- Collects the home's price, city, ZIP code, bedroom count, bathroom count, home square footage, and estimated repair budget
- Sends the intake to a Node backend at `POST /api/analyze`
- Pulls comparable homes through a live approved data provider
- Adjusts comparable pricing for bedroom, bathroom, and home square footage, then compares that against the effective purchase price including repairs
- Returns an estimated fair value, price delta, confidence score, comparable homes, and a pricing recommendation

## Project structure

- `server.js`: lightweight Node HTTP server
- `public/`: frontend assets served by Node
- `src/analysis/`: input normalization and valuation logic
- `src/comparables/`: live provider orchestration and comparable-source normalization

## Current provider behavior

This MVP now uses the RentCast property listings API as its live approved data source for comparable sale listings.

The app no longer relies on seeded or synthetic comparable datasets for analysis.

## API setup

1. Create a RentCast account and generate an API key.
2. In PowerShell, set the key for the current session:

```powershell
$env:RENTCAST_API_KEY = "your_api_key_here"
```

3. Start the server:

```powershell
& "C:\Program Files\nodejs\node.exe" server.js
```

## Run locally

From PowerShell:

```powershell
cd "c:\Users\shabs\OneDrive\Documents\Co-Pilot Test"
$env:RENTCAST_API_KEY = "your_api_key_here"
& "C:\Program Files\nodejs\node.exe" server.js
```

Then open `http://localhost:3000`.

If you want `node` available in the current shell too:

```powershell
$env:Path = "C:\Program Files\nodejs;" + $env:Path
$env:RENTCAST_API_KEY = "your_api_key_here"
node server.js
```

## Notes

- The current live integration uses one approved API provider rather than direct site scraping.
- Direct Zillow, Redfin, Homes.com, and Realtor.com scraping is still intentionally avoided.
- If you want broader market coverage later, the next step is to add additional licensed providers such as MLS, Bridge, ATTOM, or other approved feeds alongside RentCast.
