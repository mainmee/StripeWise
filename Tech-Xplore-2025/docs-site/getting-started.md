# Getting Started 🚀

Welcome to Tech Xplore! This comprehensive guide will help you get up and running with the AI-driven financial and sustainability platform.

## What is th project about?

This is a complete AI-driven financial and sustainability advisor platform that consists of:

- **🤖 MCP Agent Framework**: Build powerful AI agents using the Model Context Protocol
- **💰 Financial Advisory API**: Comprehensive financial health analysis and recommendations
- **🌱 Sustainability Focus**: ESG investments and carbon footprint tracking
- **💻 Web Interface**: React-based chat interface for seamless user interaction

This project consists of a React frontend web app, and Cloudflare Durable Object magic to implement a basic Chatbot agent, and an MCP server which exposes tools to that Chatbot to invoke. The entire application is hosted on Cloudflare workers, written in TypeScript, and free to run and deploy (up to Cloudflare's generous free-tier allowance). ☁️🤖

## Prerequisites ✨

Before getting started, make sure you have:

1. **Node.js & npm**: Install `npm`, a package manager for Node.js. [Installation guide](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) 💻

2. **Model Context Protocol (MCP) Knowledge**: Learn about MCP from the [official documentation](https://modelcontextprotocol.io/introduction). Don't worry though! This project has been carefully scaffolded so you only need to know the basics to get started. 🧩

3. **Cloudflare Workers**: Basic understanding of Cloudflare Workers. Here's a [short but informative article](https://www.macrometa.com/articles/what-are-cloudflare-workers) on what they are and how they work. Again, this project is set up so you don't need to configure your worker from scratch. 🌐

4. **Cloudflare Account**: [Create a free Cloudflare account](https://developers.cloudflare.com/fundamentals/account/create-account/) for deployment.

## Quick Start

### 1. Fork and Clone the Repositories

#### Repository Overview
The Tech Xplore project consists of two main repositories:
- **[Tech-Xplore-2025](https://github.com/LallaV/Tech-Xplore-2025)** - Main MCP Agent, React frontend, and chat interface
- **[Tech-Xplore-API-2025](https://github.com/LallaV/Tech-Xplore-API-2025)** - Backend API with financial and sustainability endpoints

#### Fork the Repositories
1. **Fork the Main Repository**: Visit [https://github.com/LallaV/Tech-Xplore-2025](https://github.com/LallaV/Tech-Xplore-2025) and click "Fork"
2. **Fork the API Backend Repository**: Visit [https://github.com/LallaV/Tech-Xplore-API-2025](https://github.com/LallaV/Tech-Xplore-API-2025) and click "Fork"

#### Clone Your Forks
```bash
# Clone your forked repositories (replace YOUR-USERNAME with your GitHub username)
git clone https://github.com/YOUR-USERNAME/Tech-Xplore-2025.git
git clone https://github.com/YOUR-USERNAME/Tech-Xplore-API-2025.git
```

#### Add Upstream Remotes (for updates)
```bash
# In the Main MCP Agent repository
cd Tech-Xplore-2025
git remote add upstream https://github.com/LallaV/Tech-Xplore-2025.git

# In the API repository  
cd ../Tech-Xplore-API-2025
git remote add upstream https://github.com/LallaV/Tech-Xplore-API-2025.git
```

### 2. Set Up the MCP Agent (Tech-Xplore-2025)

```bash
cd Tech-Xplore-2025

# Install dependencies
npm install

# Copy sample environment variables
cp .sample.dev.vars .dev.vars

# Edit .dev.vars with your configuration
# See the Secrets & Environment section for details

# Start development server
npm start
```

### 3. Set Up the API Backend (Tech-Xplore-API-2025)

```bash
cd Tech-Xplore-API-2025

# Install dependencies
npm install

# Start development server
npm run dev

# Visit the Swagger UI
# http://localhost:8787/ui
```

### 4. Access the Application

- **MCP Agent Chat Interface**: [http://localhost:8788](http://localhost:8788)
- **API Swagger Documentation**: [http://localhost:8787/ui](http://localhost:8787/ui)

## Next Steps

1. **📖 [Read the Development Guide](./development)** - Learn about the project structure and development workflow
2. **🏗️ [Understand the Architecture](./architecture)** - Explore how all components work together
3. **🔧 [Configure Secrets](./secrets-and-env)** - Set up your environment variables and API keys
4. **🚀 [Deploy to Production](./development#deploying-to-cloudflare)** - Get your app live on Cloudflare

## Project Structure Overview

```
Tech-Xplore-2025/          # MCP Agent & Frontend
├── src/
│   ├── app.tsx           # React chat interface
│   ├── server.ts         # Worker entry point
│   ├── chat.ts           # ChatAgent definition
│   ├── mcp.ts            # MCP Agent & tools
│   └── components/       # UI components
└── docs/                 # Documentation

Tech-Xplore-API-2025/     # Backend API
├── src/
│   ├── index.ts          # API routes & OpenAPI
│   └── endpoints/        # API implementations
└── README.md             # API documentation
```

## Key Features

- **🔄 Real-time Chat**: Interactive AI agent for financial advice
- **📊 Financial Analysis**: Spending insights and investment recommendations
- **🌱 Sustainability Tracking**: Carbon footprint and ESG investment guidance
- **📚 Comprehensive Documentation**: Interactive Swagger UI with full API docs
- **⚡ Fast Deployment**: One-command deployment to Cloudflare Workers
- **🔒 Secure**: Environment-based configuration with secrets management

## Architecture Overview

Tech Xplore consists of two main components working together:

1. **MCP Agent (Tech-Xplore-2025)**: The conversational AI agent built with Cloudflare's MCP framework
2. **API Backend (Tech-Xplore-API-2025)**: RESTful APIs providing financial and sustainability data

The MCP agent calls the backend APIs to provide rich, contextual responses to user queries about their financial health and sustainability goals.

## Contributing to the Project

### Forking Workflow

Since this is an open-source project, we use a forking workflow:

1. **Fork the Repositories**: Fork both repositories - [Tech-Xplore-2025](https://github.com/LallaV/Tech-Xplore-2025) and [Tech-Xplore-API-2025](https://github.com/LallaV/Tech-Xplore-API-2025)
2. **Clone Your Fork**: Clone your forked repository to your local machine
3. **Create Feature Branch**: Create a new branch for your changes
4. **Make Changes**: Implement your features or fixes
5. **Submit Pull Request**: Open a PR from your fork back to the main repository

### Keeping Your Fork Updated

To keep your fork synchronized with the upstream repository:

```bash
# Fetch upstream changes
git fetch upstream

# Merge upstream changes into your main branch
git checkout main
git merge upstream/main

# Push updates to your fork
git push origin main
```

### Contributing Guidelines

- **Create meaningful commit messages** describing your changes
- **Test your changes locally** before submitting a PR
- **Follow the existing code style** and conventions
- **Update documentation** if you add new features
- **Be respectful and collaborative** in discussions

## Related Projects

This project is adapted from the [Cloudflare Agents starter repo](https://github.com/cloudflare/agents-starter). Check it out for additional documentation and examples. 📚

The backend API repository is available at [https://github.com/LallaV/Tech-Xplore-API-2025](https://github.com/LallaV/Tech-Xplore-API-2025).

## Need Help?

- 📚 [Browse Documentation](/)
- 🛠️ [Development Guide](./development)
- 🏗️ [Architecture Overview](./architecture)
- 🆘 [Troubleshooting Guide](./troubleshooting)
- 🐛 [Report Issues](https://github.com/LallaV/Tech-Xplore-2025/issues)

## License 📝

MIT License - feel free to use this project as a foundation for your own AI-driven financial applications!

---

**Ready to start building?** Head over to the [Development Guide](./development) to dive deeper into the codebase! 🎉 