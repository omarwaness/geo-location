# Geo Location Explorer

A real-time location tracking app built with Next.js, MapLibre GL, and Prisma. Draw custom zones on the map, simulate a person walking, and get notified when they enter or leave zones.

![Screenshot](public/screenshot.png)

![Screenshot](public/screenshot-2.png)


## Features

- Interactive map with dark/light theme support
- Draw custom polygon zones directly on the map
- Simulated person marker that walks randomly at realistic speed
- Marker turns **blue** inside a zone, **red** outside
- Toast notifications on zone entry/exit
- Live metrics panel (status, current zone, coordinates)
- Zones persisted to PostgreSQL via Prisma

## Prerequisites

- Node.js 18+
- A PostgreSQL database (or use [Prisma Postgres](https://www.prisma.io/postgres))

## Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/omarwaness/geo-location.git
   cd geo-location
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up the database**

   Create a `.env` file in the root with your PostgreSQL connection string:

   ```env
   DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"
   ```

   Or create a free hosted database:

   ```bash
   npx create-db
   ```

4. **Run migrations**

   ```bash
   npx prisma migrate dev
   ```

5. **Generate the Prisma client**

   ```bash
   npx prisma generate
   ```

6. **Start the dev server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Tech Stack

- [Next.js 16](https://nextjs.org) (App Router)
- [MapLibre GL](https://maplibre.org) for the interactive map
- [Prisma 7](https://www.prisma.io) with PostgreSQL
- [Tailwind CSS 4](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com) components
- [Sonner](https://sonner.emilkowal.dev) for toast notifications
