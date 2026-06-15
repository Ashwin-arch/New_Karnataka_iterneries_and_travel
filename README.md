# Hidden Karnataka — Travel Guide

[![Netlify Status](https://api.netlify.com/api/v1/badges/placeholder/deploy-status)](https://amp-karnataka-nav.netlify.app)

An interactive travel guide showcasing 23 offbeat destinations in Karnataka, India. Built with Next.js 16, Google Maps API, and Tailwind CSS v4.

**Live demo:** [amp-karnataka-nav.netlify.app](https://amp-karnataka-nav.netlify.app)

## Prerequisites

- Node.js 18+
- A Google Maps API key with the following APIs enabled:
  - Maps JavaScript API
  - Places API
  - Directions API
  - Elevation API
  - Street View API

## Setup

1. Clone the repo and install dependencies:

```bash
npm install
```

2. Create a `.env.local` file in the project root:

```bash
cp .env.local.example .env.local
```

3. Add your Google Maps API key to `.env.local`:

```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

4. Start the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Build

```bash
npm run build
npm start
```

## Tech Stack

- **Next.js 16** — App Router, static-site exportable
- **React 19**, **TypeScript**, **Tailwind CSS v4**
- **Google Maps JS API** — Map, Places, Directions, Street View, Heatmap
- **Lucide React** — Icons
