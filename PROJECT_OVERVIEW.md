# HomeChekr Project Overview

## Summary

HomeChekr is a web application that helps users decide whether a home is overpriced, underpriced, or fairly priced relative to comparable homes in the same market.

The app collects:

- asking price
- city
- ZIP code
- bedrooms
- bathrooms
- home square footage
- estimated repair budget
- optional notes

It then compares the home against live comparable listings and evaluates the effective purchase price, which includes the estimated repair budget.

## Core Pricing Logic

HomeChekr calculates value by:

1. retrieving comparable homes from a live property data provider
2. filtering listings to find reasonably similar homes
3. adjusting comparable prices for:
   - bedrooms
   - bathrooms
   - home square footage
4. comparing the adjusted market value to:
   - asking price
   - asking price plus repairs cost

The app returns:

- estimated fair value
- effective purchase price
- price delta
- confidence score
- comparable homes
- pricing recommendation

## Tech Stack

- Frontend:
  - HTML
  - CSS
  - Vanilla JavaScript
- Backend:
  - Node.js
- Deployment model:
  - static frontend
  - serverless API function for analysis
- External API:
  - RentCast

## Project Structure

- `index.html`
  - main frontend page used in production
- `app.js`
  - frontend form handling and API request logic
- `styles.css`
  - frontend styling
- `api/analyze.js`
  - serverless API handler for deployed environments like Vercel
- `server.js`
  - local Node server for localhost development
- `src/analysis/`
  - valuation and input normalization logic
- `src/comparables/`
  - comparable listing lookup and provider integrations

## Live Data Flow

The deployed app sends a request to:

- `POST /api/analyze`

That request is processed by:

- `api/analyze.js`

Which then calls:

- `src/analysis/analyze-home.js`
- `src/comparables/providers/rentcast.js`

The RentCast provider requires:

- `RENTCAST_API_KEY`

## Current State

The project is set up for:

- local development with Node
- GitHub source control
- Vercel deployment
- live comparable analysis using RentCast

## Future Enhancements

Potential next improvements:

- improve comparable filtering by property type
- compute true geographic distance between subject home and comps
- add property type selection to the intake form
- add school district, year built, and neighborhood signals
- save and export pricing reports
- support multiple live data providers
