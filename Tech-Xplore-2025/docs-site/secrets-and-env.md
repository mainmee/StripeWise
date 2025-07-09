# Secrets & Environment Variables Guide 🔐

This comprehensive guide explains how to manage secrets and environment variables for both local development and production deployments of the Tech Xplore platform.

---

## Overview

Tech Xplore uses environment variables and secrets to configure model providers, API endpoints, and other sensitive configuration data. This approach ensures security and flexibility across different environments.

## Local Development 🛠️

### Setting Up Local Secrets

**File:** `.dev.vars` (not committed to git)

**Setup Process:**
1. Copy the sample file to create your local configuration:
   ```bash
   cp .sample.dev.vars .dev.vars
   ```
2. Fill in the required secrets based on your model provider choice
3. Never commit `.dev.vars` to version control

### Local Environment Variables

The `.dev.vars` file should contain all your local development secrets:

```bash
# Model Provider Configuration
MODEL_PROVIDER=azure_openai
MCP_TOOLS_URL=http://localhost:8788

# Azure OpenAI Configuration (if using Azure)
AI_AZURE_RESOURCE_NAME=your-azure-resource-name
AI_AZURE_API_KEY=your-azure-api-key
AI_AZURE_MODEL_DEPLOYMENT=your-model-deployment-name

# OpenAI Configuration (if using OpenAI directly)
OPENAI_API_KEY=your-openai-api-key
OPENAI_API_MODEL=gpt-4o-mini

# Backend API Configuration
API_BASE_URL=http://localhost:8787
```

---

## Production (Cloudflare) ☁️

### Important Deployment Note

⚠️ **Critical:** You cannot set secrets without your worker already deployed to Cloudflare. Follow this process:

1. **Initial Deployment**: Deploy your app first with `npm run deploy` (it won't work initially due to missing secrets)
2. **Set Secrets**: Configure all required secrets using the methods below
3. **Redeploy**: Deploy again with `npm run deploy` - the application should now work correctly

### Setting Production Secrets

#### Method 1: Cloudflare CLI (Recommended)

```bash
# Common secrets
npx wrangler secret put MODEL_PROVIDER --env production
npx wrangler secret put MCP_TOOLS_URL --env production

# Azure OpenAI secrets
npx wrangler secret put AI_AZURE_RESOURCE_NAME --env production
npx wrangler secret put AI_AZURE_API_KEY --env production
npx wrangler secret put AI_AZURE_MODEL_DEPLOYMENT --env production

# OpenAI secrets (alternative to Azure)
npx wrangler secret put OPENAI_API_KEY --env production
npx wrangler secret put OPENAI_API_MODEL --env production

# Backend API configuration
npx wrangler secret put API_BASE_URL --env production
```

#### Method 2: Cloudflare Dashboard UI

1. Log into the [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to Workers & Pages
3. Select your deployed worker
4. Go to Settings → Environment Variables
5. Add each secret in the "Production" environment

### Verifying Production Secrets

Check which secrets are currently set:

```bash
npx wrangler secret list --env production
```

---

## Required Secrets

### Common Configuration

| Secret | Description | Example |
|--------|-------------|---------|
| `MODEL_PROVIDER` | Which AI provider to use | `azure_openai` or `openai` |
| `MCP_TOOLS_URL` | MCP tools endpoint URL | Production: `https://your-worker.workers.dev` |
| `API_BASE_URL` | Backend API base URL | `https://your-api-worker.workers.dev` |

### Azure OpenAI Configuration

Required when `MODEL_PROVIDER=azure_openai`:

| Secret | Description | Example |
|--------|-------------|---------|
| `AI_AZURE_RESOURCE_NAME` | Azure OpenAI resource name | `my-openai-resource` |
| `AI_AZURE_API_KEY` | Azure OpenAI API key | `abc123...` |
| `AI_AZURE_MODEL_DEPLOYMENT` | Model deployment name | `gpt-4o-mini` |

### OpenAI Direct Configuration

Required when `MODEL_PROVIDER=openai`:

| Secret | Description | Example |
|--------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key | `sk-...` |
| `OPENAI_API_MODEL` | OpenAI model name | `gpt-4o-mini` |

### Optional Configuration

| Secret | Description | Default |
|--------|-------------|---------|
| `LOG_LEVEL` | Logging verbosity | `info` |
| `RATE_LIMIT_REQUESTS` | Max requests per minute | `100` |
| `CACHE_TTL` | Cache time-to-live (seconds) | `300` |

---

## Configuration Patterns

### Multi-Environment Setup

You can configure different environments for different stages:

```bash
# Development
npx wrangler secret put MODEL_PROVIDER --env development

# Staging
npx wrangler secret put MODEL_PROVIDER --env staging

# Production
npx wrangler secret put MODEL_PROVIDER --env production
```

### Model Provider Switching

Easily switch between providers by updating the `MODEL_PROVIDER` secret:

```bash
# Switch to Azure OpenAI
npx wrangler secret put MODEL_PROVIDER --env production
# Enter: azure_openai

# Switch to OpenAI direct
npx wrangler secret put MODEL_PROVIDER --env production
# Enter: openai
```

### API Integration Configuration

Configure backend API integration:

```bash
# Local development
MCP_TOOLS_URL=http://localhost:8788
API_BASE_URL=http://localhost:8787

# Production
MCP_TOOLS_URL=https://your-mcp-agent.workers.dev
API_BASE_URL=https://your-api.workers.dev
```

---

## Security Best Practices 🌟

### Development Security

- **Never commit secrets** to source control
- **Use `.gitignore`** to ensure `.dev.vars` is never tracked
- **Rotate keys regularly** for long-running projects
- **Use different keys** for development and production

### Production Security

- **Principle of least privilege**: Only grant necessary permissions
- **Regular rotation**: Update API keys periodically
- **Monitor usage**: Track API usage for anomalies
- **Environment isolation**: Keep development and production secrets separate

### Team Collaboration

- **Document requirements**: Clearly specify which secrets are needed
- **Share setup instructions**: Provide clear onboarding for new team members
- **Use team accounts**: Consider shared Azure/OpenAI accounts for consistency
- **Backup secrets safely**: Store production secrets in a secure team password manager

---

## Adding New Secrets

When you need to add new configuration:

### 1. Update TypeScript Types

Edit `worker-configuration.d.ts` to add your new environment variable:

```typescript
interface Env {
  // Existing secrets...
  
  // Add your new secret
  NEW_SECRET_NAME: string;
}
```

### 2. Add to Local Development

Update your `.dev.vars` file:

```bash
# Add your new secret
NEW_SECRET_NAME=your-local-value
```

### 3. Set Production Secret

Deploy the updated worker and set the production secret:

```bash
npx wrangler secret put NEW_SECRET_NAME --env production
```

### 4. Use in Code

Access your secret in the worker code:

```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const mySecret = env.NEW_SECRET_NAME;
    // Use the secret...
  }
};
```

---

## Configuration vs Secrets

### Use Environment Variables (wrangler.jsonc) for:
- **Non-sensitive configuration**: Feature flags, public URLs
- **Build-time constants**: Version numbers, environment names
- **Public settings**: Default timeouts, public API endpoints

```json
{
  "vars": {
    "ENVIRONMENT": "production",
    "VERSION": "1.0.0",
    "PUBLIC_API_URL": "https://api.example.com"
  }
}
```

### Use Secrets for:
- **API keys and tokens**: OpenAI keys, database passwords
- **Private URLs**: Internal service endpoints
- **Sensitive configuration**: Database connection strings

---

## Troubleshooting

### Common Issues

#### Secret Not Found
```
Error: Secret 'SECRET_NAME' not found
```
**Solution**: Set the secret using `npx wrangler secret put SECRET_NAME --env production`

#### Wrong Environment
```
Error: Using development configuration in production
```
**Solution**: Ensure you're setting secrets with the correct `--env` flag

#### Permission Denied
```
Error: You do not have permission to edit this worker
```
**Solution**: Check your Cloudflare account permissions and authentication

#### Local Secrets Not Loading
```
Error: Cannot read property 'SECRET_NAME' of undefined
```
**Solution**: Ensure `.dev.vars` exists and contains the required secrets

### Debugging Tips

1. **Check secret existence**:
   ```bash
   npx wrangler secret list --env production
   ```

2. **Verify authentication**:
   ```bash
   npx wrangler whoami
   ```

3. **Test local configuration**:
   ```bash
   npm start
   # Check logs for configuration loading
   ```

4. **Validate production deployment**:
   ```bash
   npx wrangler tail --env production
   # Watch real-time logs during API calls
   ```

---

## Advanced Configuration

### Environment-Specific Model Providers

Configure different AI providers per environment:

```bash
# Development: Use OpenAI for cost efficiency
npx wrangler secret put MODEL_PROVIDER --env development
# Enter: openai

# Production: Use Azure OpenAI for enterprise features
npx wrangler secret put MODEL_PROVIDER --env production
# Enter: azure_openai
```

### Load Balancing and Failover

Configure multiple API endpoints for resilience:

```bash
# Primary API endpoint
npx wrangler secret put API_BASE_URL --env production
# Enter: https://api-primary.workers.dev

# Backup API endpoint
npx wrangler secret put API_BACKUP_URL --env production
# Enter: https://api-backup.workers.dev
```

### Feature Flags via Secrets

Use secrets for feature toggles:

```bash
# Enable experimental features
npx wrangler secret put ENABLE_EXPERIMENTAL_FEATURES --env staging
# Enter: true

npx wrangler secret put ENABLE_EXPERIMENTAL_FEATURES --env production
# Enter: false
```

---

## Useful Resources

- **[Cloudflare Workers: Environment Variables & Secrets](https://developers.cloudflare.com/workers/configuration/secrets/)**
- **[Cloudflare Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/commands/#secret)**
- **[Azure OpenAI Documentation](https://docs.microsoft.com/en-us/azure/cognitive-services/openai/)**
- **[OpenAI API Documentation](https://platform.openai.com/docs)**

---

## Next Steps

- **[Back to Development Guide](./development)** - Continue with development setup
- **[Architecture Overview](./architecture)** - Understand how secrets fit into the system
- **[Troubleshooting Guide](./troubleshooting)** - Common issues and solutions
- **[Deployment Guide](./development#deploying-to-cloudflare)** - Deploy your configured application

Need help with secrets management? Check the [Troubleshooting Guide](./troubleshooting) or reach out to your team! 🚀 