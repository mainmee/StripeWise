# Troubleshooting Guide 🛠️

Having trouble with Tech Xplore? This comprehensive guide covers common issues and their solutions to help you get back on track quickly!

---

## Common Issues & Quick Fixes

### 1. Model Provider Authentication Errors

#### `InferenceUpstreamError: 10000: Authentication error`

**Symptoms:**
- AI responses fail with authentication errors
- Model completions time out or fail

**Solutions:**
1. **Restart Development Server:**
   ```bash
   # Stop the current process (Ctrl+C)
   npm start
   ```

2. **Verify Local Secrets:**
   ```bash
   # Check your .dev.vars file exists and has correct values
   cat .dev.vars
   ```

3. **Check API Key Validity:**
   - Ensure your OpenAI/Azure OpenAI keys are active
   - Verify you have quota remaining on your API account
   - Test your keys independently using curl

4. **Production Secret Verification:**
   ```bash
   npx wrangler secret list --env production
   ```

### 2. Missing or Incorrect Secrets

#### `Cannot read property 'SECRET_NAME' of undefined`

**Symptoms:**
- Worker fails to start
- Configuration-related errors
- Environment variables are undefined

**Solutions:**
1. **Local Development:**
   ```bash
   # Ensure .dev.vars exists
   cp .sample.dev.vars .dev.vars
   
   # Edit with your actual values
   # See Secrets & Environment guide for details
   ```

2. **Production Deployment:**
   ```bash
   # List current secrets
   npx wrangler secret list --env production
   
   # Add missing secrets
   npx wrangler secret put SECRET_NAME --env production
   ```

3. **Required Secrets Checklist:**
   - [ ] `MODEL_PROVIDER`
   - [ ] `MCP_TOOLS_URL`
   - [ ] `AI_AZURE_*` (if using Azure) or `OPENAI_*` (if using OpenAI)
   - [ ] `API_BASE_URL`

### 3. Build and Dependency Errors

#### `Module not found` or `Package installation failed`

**Symptoms:**
- `npm install` fails
- Import errors in TypeScript
- Build process fails

**Solutions:**
1. **Clean Installation:**
   ```bash
   # Remove existing dependencies
   rm -rf node_modules package-lock.json
   
   # Fresh install
   npm install
   ```

2. **Node Version Compatibility:**
   ```bash
   # Check Node version (requires 18+)
   node --version
   
   # Update if needed
   nvm install 18
   nvm use 18
   ```

3. **Clear NPM Cache:**
   ```bash
   npm cache clean --force
   npm install
   ```

### 4. Cloudflare Deployment Issues

#### `Authentication required` or `Permission denied`

**Symptoms:**
- `npm run deploy` fails
- Cannot access Cloudflare account
- Worker deployment rejected

**Solutions:**
1. **Login to Cloudflare:**
   ```bash
   npx wrangler login
   ```

2. **Verify Authentication:**
   ```bash
   npx wrangler whoami
   ```

3. **Check Account Permissions:**
   - Ensure you have worker deployment permissions
   - Verify account is in good standing
   - Check if you've reached free tier limits

4. **Manual Authentication:**
   ```bash
   # Use API token instead of OAuth
   export CLOUDFLARE_API_TOKEN=your-token-here
   npx wrangler deploy
   ```

### 5. Frontend UI Issues

#### UI not updating or displaying incorrectly

**Symptoms:**
- Changes don't appear in browser
- Styling issues
- Components not rendering

**Solutions:**
1. **Hard Refresh:**
   ```bash
   # Clear browser cache
   Ctrl+Shift+R (Windows/Linux)
   Cmd+Shift+R (Mac)
   ```

2. **Rebuild Frontend:**
   ```bash
   npm run build
   npm start
   ```

3. **Clear Development Cache:**
   ```bash
   # Clear Vite cache
   rm -rf .vite
   npm start
   ```

4. **Check Console for Errors:**
   - Open browser DevTools (F12)
   - Look for JavaScript errors in Console tab
   - Check Network tab for failed requests

### 6. API Integration Issues

#### Remote API calls failing in local development

**Symptoms:**
- Backend API calls timeout
- CORS errors
- Connection refused errors

**Solutions:**
1. **Check Backend Server:**
   ```bash
   # Ensure backend is running
   cd tech-xplore-api-2025
   npm run dev
   
   # Test API directly
   curl http://localhost:8787/api/transactions
   ```

2. **CORS Configuration:**
   ```typescript
   // In backend, ensure CORS is properly configured
   app.use('*', cors({
     origin: 'http://localhost:8788',
     credentials: true
   }));
   ```

3. **Use Local Mock Data:**
   ```typescript
   // Mock API calls during development
   if (env.IS_LOCAL) {
     return { mockData: 'for development' };
   }
   ```

4. **Environment Variable Check:**
   ```bash
   # Verify API_BASE_URL is correct
   echo $API_BASE_URL
   ```

---

## Environment-Specific Issues

### Local Development Problems

#### Port Already in Use
```
Error: Port 8788 is already in use
```

**Solution:**
```bash
# Find and kill process using the port
lsof -ti:8788 | xargs kill -9

# Or use a different port
npm start -- --port 8789
```

#### TypeScript Compilation Errors
```
Error: Type 'X' is not assignable to type 'Y'
```

**Solution:**
```bash
# Clear TypeScript cache
npx tsc --build --clean

# Regenerate types
npm run cf-typegen

# Check tsconfig.json configuration
```

### Production Deployment Problems

#### Worker Not Responding
**Symptoms:**
- Deployed URL returns 404 or 500 errors
- Worker appears deployed but doesn't work

**Solutions:**
1. **Check Deployment Status:**
   ```bash
   npx wrangler deployments list
   ```

2. **View Live Logs:**
   ```bash
   npx wrangler tail --env production
   ```

3. **Verify Route Configuration:**
   ```bash
   # Check wrangler.jsonc routes
   cat wrangler.jsonc
   ```

#### Secrets Not Applied
**Symptoms:**
- Worker deployed successfully but configuration errors persist

**Solutions:**
1. **Redeploy After Setting Secrets:**
   ```bash
   # Set all required secrets first
   npx wrangler secret put MODEL_PROVIDER --env production
   
   # Then redeploy
   npm run deploy
   ```

2. **Verify Secret Values:**
   ```bash
   # Check which secrets are set
   npx wrangler secret list --env production
   ```

---

## Performance Issues

### Slow Response Times

#### API calls taking too long

**Symptoms:**
- Requests timeout
- UI becomes unresponsive
- Poor user experience

**Solutions:**
1. **Add Request Timeouts:**
   ```typescript
   const controller = new AbortController();
   setTimeout(() => controller.abort(), 10000); // 10 second timeout
   
   const response = await fetch(url, {
     signal: controller.signal
   });
   ```

2. **Implement Caching:**
   ```typescript
   const cache = new Map();
   
   function getCachedData(key: string) {
     if (cache.has(key)) {
       return cache.get(key);
     }
     // Fetch and cache data
   }
   ```

3. **Optimize API Calls:**
   ```typescript
   // Batch multiple requests
   const [transactions, insights, recommendations] = await Promise.all([
     fetchTransactions(userId),
     fetchInsights(userId),
     fetchRecommendations(userId)
   ]);
   ```

### Memory or Resource Issues

#### Worker exceeding limits

**Symptoms:**
- Worker crashes or restarts
- Out of memory errors
- CPU time exceeded

**Solutions:**
1. **Optimize Data Processing:**
   ```typescript
   // Process data in chunks
   function processInChunks<T>(array: T[], chunkSize: number, processor: (chunk: T[]) => void) {
     for (let i = 0; i < array.length; i += chunkSize) {
       processor(array.slice(i, i + chunkSize));
     }
   }
   ```

2. **Reduce Memory Usage:**
   ```typescript
   // Use streaming for large responses
   const stream = new ReadableStream({
     start(controller) {
       // Stream data chunk by chunk
     }
   });
   ```

---

## Debugging Techniques

### Logging and Monitoring

#### Adding Debug Logs
```typescript
// Enhanced logging for troubleshooting
function debugLog(message: string, data?: any) {
  console.log(`[DEBUG ${new Date().toISOString()}] ${message}`, data);
}

// Use in your code
debugLog('API call starting', { endpoint, params });
```

#### Real-time Log Monitoring
```bash
# Watch production logs in real-time
npx wrangler tail --env production --format pretty

# Filter for specific log levels
npx wrangler tail --env production | grep ERROR
```

### Testing API Endpoints

#### Manual API Testing
```bash
# Test backend API directly
curl -X POST http://localhost:8787/api/transactions \
  -H "Content-Type: application/json" \
  -d '{"userId": "test123"}'

# Test with authentication
curl -X POST https://your-api.workers.dev/api/financial-advice \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d '{"userId": "test123", "timeframe": "month"}'
```

#### Using Browser DevTools
1. Open DevTools (F12)
2. Go to Network tab
3. Trigger API calls through the UI
4. Examine request/response details
5. Check for CORS or authentication issues

### State and Configuration Debugging

#### Inspect Worker Environment
```typescript
// Add debugging endpoint to your worker
app.get('/debug', (c) => {
  return c.json({
    environment: c.env.ENVIRONMENT,
    modelProvider: c.env.MODEL_PROVIDER ? 'configured' : 'missing',
    timestamp: new Date().toISOString(),
    // Don't expose secret values!
  });
});
```

#### Check Local Configuration
```bash
# Verify local environment
cat .dev.vars

# Check if variables are loaded
node -e "require('dotenv').config({path: '.dev.vars'}); console.log(process.env.MODEL_PROVIDER)"
```

---

## Advanced Troubleshooting

### Network and Connectivity Issues

#### DNS or Routing Problems
```bash
# Test connectivity to Cloudflare
nslookup your-worker.workers.dev

# Test with different DNS servers
nslookup your-worker.workers.dev 8.8.8.8
```

#### SSL/TLS Issues
```bash
# Test SSL certificate
openssl s_client -connect your-worker.workers.dev:443

# Check certificate details
curl -vI https://your-worker.workers.dev
```

### Database and Storage Issues

#### State Management Problems
```typescript
// Debug ChatAgent state
export default class ChatAgent extends Agent<Env> {
  async handleMessage(message: string) {
    // Log current state
    const currentState = await this.getState();
    console.log('Current agent state:', currentState);
    
    // Your message handling logic
  }
}
```

#### KV Store Issues (if using)
```bash
# List KV namespaces
npx wrangler kv:namespace list

# Check KV storage
npx wrangler kv:key list --namespace-id YOUR_NAMESPACE_ID
```

### Model Provider Specific Issues

#### Azure OpenAI Troubleshooting
```typescript
// Test Azure OpenAI connection
async function testAzureOpenAI(env: Env) {
  const endpoint = `https://${env.AI_AZURE_RESOURCE_NAME}.openai.azure.com`;
  const response = await fetch(`${endpoint}/openai/deployments`, {
    headers: {
      'api-key': env.AI_AZURE_API_KEY,
      'Content-Type': 'application/json'
    }
  });
  
  console.log('Azure OpenAI status:', response.status);
  return response.json();
}
```

#### OpenAI API Troubleshooting
```typescript
// Test OpenAI connection
async function testOpenAI(env: Env) {
  const response = await fetch('https://api.openai.com/v1/models', {
    headers: {
      'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });
  
  console.log('OpenAI API status:', response.status);
  return response.json();
}
```

---

## Prevention and Best Practices

### Error Prevention

#### Input Validation
```typescript
// Validate inputs to prevent errors
function validateUserId(userId: string): boolean {
  return typeof userId === 'string' && userId.length > 0 && userId.length < 100;
}

function validateTimeframe(timeframe: string): boolean {
  return ['week', 'month', 'quarter', 'year'].includes(timeframe);
}
```

#### Graceful Error Handling
```typescript
// Wrap API calls with error handling
async function safeApiCall<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error('API call failed:', error);
    return fallback;
  }
}
```

### Monitoring and Alerting

#### Health Check Endpoints
```typescript
// Add health check to your worker
app.get('/health', async (c) => {
  try {
    // Check critical dependencies
    const apiHealth = await fetch(`${c.env.API_BASE_URL}/health`);
    
    return c.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      dependencies: {
        api: apiHealth.ok ? 'healthy' : 'unhealthy'
      }
    });
  } catch (error) {
    return c.json({ status: 'unhealthy', error: error.message }, 500);
  }
});
```

#### Error Tracking
```typescript
// Simple error tracking
function trackError(error: Error, context: any) {
  console.error('Tracked error:', {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString()
  });
  
  // In production, send to monitoring service
  // await sendToMonitoring(error, context);
}
```

---

## Getting Help

### Self-Service Resources

1. **📖 Documentation:**
   - [Development Guide](./development)
   - [Architecture Overview](./architecture)
   - [Secrets & Environment](./secrets-and-env)
   - [API Documentation](./api/)

2. **🌐 External Resources:**
   - [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
   - [Cloudflare AI Agents Docs](https://developers.cloudflare.com/agents/)
   - [Vite Documentation](https://vitejs.dev/)
   - [React Documentation](https://react.dev/)

### Community Support

1. **💬 Team Chat:** Ask your teammates for help
2. **🐛 Issue Tracker:** Report bugs and feature requests
3. **📧 Support Email:** Contact technical support if available
4. **🔍 Search:** Look for similar issues online

### Escalation Process

If you're still stuck after trying the solutions above:

1. **Document the Issue:**
   - What were you trying to do?
   - What happened instead?
   - What error messages did you see?
   - What steps have you already tried?

2. **Gather Debug Information:**
   ```bash
   # System info
   node --version
   npm --version
   npx wrangler --version
   
   # Project info
   cat package.json | grep version
   git log --oneline -5
   
   # Environment info
   npx wrangler secret list --env production
   ```

3. **Create Minimal Reproduction:**
   - Strip down to the smallest case that reproduces the issue
   - Include relevant code snippets
   - Provide step-by-step instructions

4. **Ask for Help:**
   - Share your documentation with the team
   - Include all relevant context
   - Be specific about what you need

---

## Quick Reference

### Essential Commands
```bash
# Development
npm start                    # Start local development
npm run build               # Build for production
npm run deploy              # Deploy to Cloudflare

# Debugging
npx wrangler tail           # View live logs
npx wrangler secret list    # List secrets
npx wrangler deployments list # Check deployments

# Troubleshooting
rm -rf node_modules && npm install  # Clean install
npx wrangler dev --clear-cache      # Clear cache
```

### Emergency Fixes
```bash
# If everything is broken:
git stash                   # Save current changes
git checkout main          # Return to known good state
npm install                # Reinstall dependencies
cp .sample.dev.vars .dev.vars  # Reset local config
npm start                  # Start fresh
```

---

**Remember:** Most issues have simple solutions! Start with the basics (restart, check configuration, verify dependencies) before diving into complex debugging. 

When in doubt, ask your team for help - they've probably faced the same issue! 🚀

---

## Next Steps

- **[Back to Development Guide](./development)** - Continue with development
- **[Secrets Configuration](./secrets-and-env)** - Fix configuration issues
- **[Architecture Overview](./architecture)** - Understand the system better
- **[Getting Started](./getting-started)** - Start from the beginning

Happy debugging! 🐛➡️✨ 