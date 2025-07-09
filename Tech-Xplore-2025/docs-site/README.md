# Tech Xplore Documentation Site

This is a VitePress-powered documentation site for the Tech Xplore AI-driven financial and sustainability platform.

## Repository Information

- **Main Repository**: [Tech-Xplore-2025](https://github.com/LallaV/Tech-Xplore-2025) - Contains the MCP Agent and this documentation site
- **API Repository**: [Tech-Xplore-API-2025](https://github.com/LallaV/Tech-Xplore-API-2025) - Backend API with financial endpoints
- **Documentation**: This VitePress site documents both the MCP Agent and API components
- **Contributing**: Please fork both repositories and submit pull requests for contributions

## Quick Start

### Fork and Setup

1. **Fork the Repository**: Visit [https://github.com/LallaV/Tech-Xplore-2025](https://github.com/LallaV/Tech-Xplore-2025) and click "Fork"

2. **Clone Your Fork**:
   ```bash
   git clone https://github.com/YOUR-USERNAME/Tech-Xplore-2025.git
   cd Tech-Xplore-2025/docs-site
   ```

3. **Install Dependencies**:
   ```bash
   npm install
   ```

4. **Start Development Server**:
   ```bash
   npm run docs:dev
   ```

5. **Visit Documentation**: Open [http://localhost:5173](http://localhost:5173)

## Development

The documentation site will be available at `http://localhost:5173` during development.

### Available Scripts

```bash
# Start development server
npm run docs:dev

# Build for production
npm run docs:build

# Preview production build
npm run docs:preview
```

### File Structure
```
docs-site/
├── .vitepress/
│   └── config.js          # VitePress configuration
├── index.md               # Homepage
├── getting-started.md     # Getting started guide
├── development.md         # Development documentation
├── architecture.md        # Architecture overview
├── api/
│   └── index.md          # API documentation
├── secrets-and-env.md     # Secrets and environment guide
├── mcp-clients.md         # MCP clients guide
├── tips.md               # Development tips
├── troubleshooting.md    # Troubleshooting guide
├── roles.md              # Team roles
└── package.json          # Dependencies and scripts
```

## Deployment

### Option 1: GitHub Pages (Recommended)

1. **Enable GitHub Pages**:
   - Go to your repository Settings > Pages
   - Select "GitHub Actions" as the source
   - The included workflow will automatically deploy your docs

2. **Automatic Deployment**:
   - Push changes to the `main` branch
   - GitHub Actions will build and deploy automatically
   - Site will be available at `https://YOUR-USERNAME.github.io/Tech-Xplore-2025`

### Option 2: Cloudflare Pages

1. **Connect Repository**:
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) > Pages
   - Create a new project from your forked repository

2. **Configure Build Settings**:
   ```
   Build command: npm run docs:build
   Build output directory: .vitepress/dist
   Root directory: docs-site
   Node.js version: 18
   ```

### Option 3: Netlify or Vercel

Both platforms support automatic deployment from GitHub repositories with similar configuration.

## Contributing

### Updating Documentation

1. **Create a Feature Branch**:
   ```bash
   git checkout -b update-docs
   ```

2. **Make Your Changes**:
   - Edit the relevant `.md` files
   - Test locally with `npm run docs:dev`

3. **Commit and Push**:
   ```bash
   git add .
   git commit -m "docs: update documentation"
   git push origin update-docs
   ```

4. **Create Pull Request**:
   - Open a PR from your branch to the main repository
   - Provide a clear description of your changes

### Content Guidelines

- **Use clear, concise language**
- **Include code examples where relevant**
- **Add cross-references between related pages**
- **Test all instructions before submitting**

### Adding New Pages

1. Create a new `.md` file in the appropriate directory
2. Add the page to the sidebar configuration in `.vitepress/config.js`
3. Use frontmatter for page metadata if needed

## Troubleshooting

### Build Issues
- Ensure Node.js version is 18 or higher
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check for syntax errors in Markdown files

### Deployment Issues
- Verify build output directory is correct
- Check build logs for errors
- Ensure all assets are properly referenced

## Support

- **VitePress Documentation**: https://vitepress.dev/
- **Main Repository**: [https://github.com/LallaV/Tech-Xplore-2025](https://github.com/LallaV/Tech-Xplore-2025)
- **API Repository**: [https://github.com/LallaV/Tech-Xplore-API-2025](https://github.com/LallaV/Tech-Xplore-API-2025)
- **Issues**: [https://github.com/LallaV/Tech-Xplore-2025/issues](https://github.com/LallaV/Tech-Xplore-2025/issues)

For project-specific questions, refer to the main Tech Xplore documentation or create an issue in the repository. 