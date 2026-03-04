Decentralized Social Media Aggregator - Frontend


Overview
This frontend application provides a TikTok-style interface for browsing content from decentralized social networks (Mastodon, Nostr, Bluesky) with on-chain engagement tracking. Built with React, Web3.js, and LiveKit for real-time interactions.

Key Features
🎥 TikTok-style vertical video feed
🔗 Multi-wallet support (MetaMask, WalletConnect, etc.)
❤️ On-chain engagement tracking (likes, reposts, comments)
💬 Real-time comment system using LiveKit
🌐 Multi-platform aggregation (Mastodon, Nostr, Bluesky)
📱 Mobile-first responsive design
Tech Stack
Framework: React 18
State Management: Context API
Blockchain: Web3.js, Ethereum smart contracts
Realtime: LiveKit (WebRTC)
Styling: CSS Modules
Build: Vite
Containerization: Docker
Project Structure
frontend/
├── public/              # Static assets
├── src/
│   ├── components/      # Reusable UI components
│   ├── contexts/        # Global state management
│   ├── hooks/           # Custom React hooks
│   ├── services/        # API and blockchain services
│   ├── utils/           # Utility functions
│   ├── App.jsx          # Main application component
│   └── main.jsx         # Application entry point
├── package.json         # Dependencies and scripts
└── Dockerfile           # Container configuration
Installation
Prerequisites
Node.js v18+
Yarn or npm
MetaMask browser extension (for wallet connection)
Quick Start
Clone the repository:
git clone https://github.com/your-username/decentralized-social-aggregator.git
cd decentralized-social-aggregator/frontend
Install dependencies:
yarn install
# or
npm install
Create .env file:
cp .env.example .env
# Fill in your environment variables
Start development server:
yarn dev
# or
npm run dev
Configuration
Create a .env file in the project root with the following variables:

VITE_API_BASE_URL=http://localhost:3001/api
VITE_LIVEKIT_URL=your-livekit-server-url
VITE_INFURA_PROJECT_ID=your-infura-id
VITE_CONTRACT_ADDRESS=0xYourContractAddress
Available Scripts
dev: Start development server
build: Create production build
preview: Preview production build locally
lint: Run ESLint
format: Format code with Prettier
test: Run Jest tests
Docker Deployment
Build the Docker image:
docker build -t social-aggregator-frontend .
Run the container:
docker run -p 3000:3000 --env-file .env social-aggregator-frontend
Architecture

Key Components
Feed System:

Infinite scroll with lazy loading
Platform-agnostic post normalization
Engagement tracking overlay
Wallet Integration:

Web3.js for blockchain interactions
Multi-chain support
Account management
Real-time Comments:

LiveKit WebRTC implementation
Typing indicators
Message history
IPFS Integration:

Content upload and retrieval
CID-based addressing
Pinning service
Contributing
Fork the repository
Create your feature branch (git checkout -b feature/your-feature)
Commit your changes (git commit -am 'Add some feature')
Push to the branch (git push origin feature/your-feature)
Open a Pull Request
License
This project is licensed under the MIT License - see the LICENSE file for details.

Contact
For support or inquiries, please contact calebrutto91@gmail.com Note: This frontend requires the backend service to be running for full functionality.
