# Car Customer Connect

A Micro-SaaS application for independent auto dealerships to transform vehicle lifecycle events into automated social media marketing content.

## Project Overview

Car Customer Connect helps auto dealerships manage their vehicle inventory and create social media content for different stages of a vehicle's lifecycle (acquisition, service, ready for sale, sold).

## Features (MVP)

- Vehicle Management
- Content Generation System
- Social Media Integration
- Mobile-First Design
- Analytics & Reporting

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- GitHub account (for version control)
- Supabase account (for backend database)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/norcalchakra/carcustomerconnect.git
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. Start the development server:
   ```
   npm run dev
   ```

## Supabase Setup

1. Create a new project in Supabase
2. Navigate to the SQL Editor in your Supabase dashboard
3. Run the SQL script from `supabase/schema.sql` to create the necessary tables and security policies
4. Enable authentication in the Auth section of your Supabase dashboard
5. Create storage buckets for vehicle photos

## Project Structure

```
carcustomerconnect/
├── src/
│   ├── components/
│   │   ├── Dashboard.tsx
│   │   ├── Header.tsx
│   │   └── VehicleDetail.tsx
│   ├── lib/
│   │   ├── api.ts           # Supabase API utilities
│   │   └── supabase.ts      # Supabase client configuration
│   ├── types/
│   │   └── database.types.ts # TypeScript definitions for database schema
│   ├── App.css
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── supabase/
│   └── schema.sql          # Database schema definition
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## Database Schema

The application uses the following tables:

- `dealerships`: Store information about each dealership
- `vehicles`: Store vehicle inventory information
- `vehicle_events`: Track lifecycle events for each vehicle
- `vehicle_photos`: Store photos for each vehicle

## Next Steps

1. Implement authentication UI
2. Create full CRUD operations for vehicles
3. Implement social media integration
4. Add AI caption generation
5. Develop analytics dashboard

## License

[Your License]
