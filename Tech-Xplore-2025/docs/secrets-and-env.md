# Secrets & Environment Variables Guide 🔐

This guide explains how to manage secrets and environment variables for both local development and production deployments.

---


## Local Development 🛠️

- **File:** `.dev.vars` (not committed to git)
- **How to set up:**
  1. Copy `sample.dev.vars` to `.dev.vars`:
     ```bash
     cp sample.dev.vars .dev.vars
     ```
  2. Fill in the required secrets (see below).

---

## Production (Cloudflare) ☁️

### IMPORTANT

You will not be able to set these secrets without your worker already available on Cloudflare. This means you should deploy your app first with `npm run deploy` (it of course won't work as it is missing important configuration info), set the secrets, and then deploy again. Thereafter the application should work as expected.

- **How to set up:**
  - Use the Cloudflare CLI to set secrets for your deployed worker:
    ```bash
    npx wrangler secret put SECRET_NAME --env production
    ```
  - Or use the Cloudflare dashboard UI.

---

## Required Secrets

### Common
- `MCP_TOOLS_URL`: Endpoint URL for MCP tools (e.g., `http://localhost:5173/sse` for dev)
- `MODEL_PROVIDER`: Which model provider to use (`azure` or `openai`)

### If using **Azure OpenAI**
- `AI_AZURE_RESOURCE_NAME`: Name of your Azure OpenAI resource
- `AI_AZURE_API_KEY`: API key for Azure OpenAI
- `AI_AZURE_MODEL_DEPLOYMENT`: Name of the model deployment (e.g., `gpt-4o-mini`)

### If using **OpenAI API (direct)**
- `OPENAI_API_KEY`: API key for OpenAI
- `OPENAI_API_MODEL`: Model name (e.g., `gpt-4o-mini`)

---

## Tips & Best Practices 🌟
- **Never commit secrets** to source control!
- **Add new secrets** to both `.dev.vars` and production as needed.
- **Update `Env` types** in [`worker-configuration.d.ts`](../worker-configuration.d.ts) if you add new secrets.
- **You can add new secrets** to act as configuration values, even if they are not necessarily sensitive information. Alternatively, you can use the `wrangler.jsonc` to configure environment variables for local and production (deployed) - this is good practice for non-sensitive configurations, but this absolutely cannot contain secrets, as this file is committed to source control! If you are unsure about what counts as a secret, just stick to `dev.vars` and Cloudflare secrets. In fact, some non-sensitive data is currently stored using secrets in this starter anyways :)
- **You use the Cloudflare Dashboard UI** to add secrets via if you prefer to UI to the CLI commands

---

## More Info
- [Cloudflare Workers: Environment Variables & Secrets](https://developers.cloudflare.com/workers/configuration/secrets/)
- [Cloudflare Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/commands/#secret)

Return to the [Development Guide](../DEVELOPMENT.md) 🚀
