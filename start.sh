#!/bin/bash

echo "🚀 Starting Advanced Fact & Claim Verification System"
echo "====================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed"
    exit 1
fi

echo "✅ Prerequisites check passed"

# Start frontend
echo "🎨 Starting Next.js application with advanced AI verification..."
cd frontend

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚠️  Creating .env.local file from template..."
    cp .env.example .env.local
    echo "📝 Please edit frontend/.env.local with your API keys:"
    echo "   - GROQ_API_KEY=your_groq_api_key_here"
    echo "   - OPENAI_API_KEY=your_openai_api_key_here (for image analysis)"
    echo "   - COMPOSIO_API_KEY=your_composio_api_key_here"
    echo "   - NEWS_API_KEY=your_news_api_key_here"
    echo "   - EXA_API_KEY=your_exa_api_key_here"
    echo "   - TWITTER_BEARER_TOKEN=your_twitter_bearer_token_here"
    echo "   - GOOGLE_API_KEY=your_google_api_key_here"
    echo "   - SERP_API_KEY=your_serp_api_key_here"
fi

# Install Node dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Node.js dependencies (including LangChain.js and search toolkits)..."
    npm install
fi

echo "🌐 Starting Next.js server on http://localhost:3000"
echo ""
echo "🔍 Available Search Sources:"
echo "   • NewsAPI - Current events and news verification"
echo "   • Composio Web Search - Enhanced web search capabilities"
echo "   • Google Search - General web search via SerpAPI"
echo "   • Twitter/X Search - Social media verification"
echo "   • Exa Search - High-quality citations and academic sources"
echo "   • Google Trends - Trending topics analysis"
echo "   • Google Scholar - Academic and research papers"
echo "   • OpenAI Vision - Image analysis and text extraction"
echo ""

npm run dev

echo ""
echo "🎉 System started successfully!"
echo "================================"
echo "Application: http://localhost:3000"
echo ""
echo "Features:"
echo "• Multi-source fact verification"
echo "• Image analysis with AI vision"
echo "• Real-time claim highlighting"
echo "• Academic and news source integration"
echo ""
echo "Press Ctrl+C to stop the service"