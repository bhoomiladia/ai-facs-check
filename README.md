# Fact & Claim Verification System

A Next.js application that extracts claims from text/URLs and verifies them using real-time web search with AI-powered analysis.

## Tech Stack

**Frontend & Backend:**
- Next.js 15+ (App Router with API Routes)
- TypeScript
- Tailwind CSS
- Lucide React (icons)
- Shadcn/ui components

**AI & Search:**
- Groq (llama-3.1-8b-instant) for lightning-fast inference
- Tavily Search API for structured web results

## Project Structure

```
fact-verification-system/
├── frontend/               # Next.js application
│   ├── src/
│   │   ├── app/           # App router pages & API routes
│   │   ├── components/    # React components
│   │   ├── types/         # TypeScript definitions
│   │   └── lib/          # Utilities
│   ├── package.json       # Node dependencies
│   ├── .env.local         # Environment variables
│   └── tailwind.config.js # Tailwind configuration
├── start.sh               # Startup script
└── README.md             # Documentation
```

## Setup Instructions

1. **Set up API Keys**: Copy `frontend/.env.example` to `frontend/.env.local` and add your:
   - `GROQ_API_KEY` (for llama-3.1-8b-instant)
   - `TAVILY_API_KEY` (for web search)

2. **Run the System**: Execute `./start.sh` to start the application

3. **Access the Application**: http://localhost:3000

## Features

- **Claim Extraction**: AI-powered extraction of verifiable claims from text
- **Real-time Verification**: Parallel processing with live progress tracking
- **Interactive Text Highlighting**: Original text with color-coded claim verification
- **Evidence Analysis**: Detailed evidence sources and reasoning for each claim
- **Modern UI**: Dark-mode professional design with responsive layout

## Core Architecture

- **Claim Extraction**: AI identifies atomic, verifiable claims from input text
- **Evidence Gathering**: Optimized search queries fetch relevant sources via Tavily
- **Verification Analysis**: Claims are compared against evidence with confidence scoring
- **Interactive Results**: Color-coded text highlighting and detailed evidence drawers

## API Endpoints

- `POST /api/verify` - Verify claims from text or URL
- Returns structured verification results with claims, evidence, and confidence scores