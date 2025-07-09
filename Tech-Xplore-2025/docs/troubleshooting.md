# Troubleshooting Guide 🛠️

Having trouble? Here are some common issues and solutions to help you get back on track!

---

## Common Issues & Fixes

### 1. `InferenceUpstreamError: 10000: Authentication error`
- **Solution:**
  - Stop the process and run `npm start` again.
  - Double-check your secrets in `.dev.vars` or Cloudflare secrets.

### 2. Missing or Incorrect Secrets
- **Solution:**
  - Ensure all required secrets are set (see [Secrets & Env Guide](secrets-and-env.md)).
  - For local dev, check `.dev.vars`.
  - For production, use `npx wrangler secret list --env production` to verify.

### 3. Build or Dependency Errors
- **Solution:**
  - Run `npm install` to ensure all dependencies are installed.
  - Delete `node_modules` and `package-lock.json` and reinstall if issues persist.

### 4. Cloudflare Deployment Fails
- **Solution:**
  - Make sure you are authenticated (`npx wrangler login`).
  - Check your Cloudflare account permissions.
  - Review the deployment logs for error details.

### 5. UI Not Updating or Broken
- **Solution:**
  - Make sure the frontend build is up to date (`npm run build`).
  - Clear your browser cache (hard refresh).

### 6. Issues making request to remote APIs when running locally
- **Solution:**
  - Mock out the call to the remote API when running locally (by using the IS_LOCAL environment variable)
  - Clear your browser cache (hard refresh).

---

## Helpful Docs
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Cloudflare AI Agents Docs](https://developers.cloudflare.com/agents/)
- [Vite Docs](https://vitejs.dev/)
- [React Docs](https://react.dev/)

If you're still stuck, open an issue or ask for help in your team chat! 💬

Return to the [Development Guide](../DEVELOPMENT.md) 🚀
