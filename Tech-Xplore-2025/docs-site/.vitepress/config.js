import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Tech Xplore Documentation',
  description: 'Comprehensive documentation for Tech Xplore MCP Agent and API',
  
  themeConfig: {
    // logo: '/logo.svg', // TODO: Add logo file to public directory
    
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Getting Started', link: '/getting-started' },
      { text: 'Architecture', link: '/architecture' },
      { text: 'API Reference', link: '/api/' },
      { text: 'Development', link: '/development' }
    ],

    sidebar: {
      '/': [
        {
          text: 'Introduction',
          items: [
            { text: 'Overview', link: '/' },
            { text: 'Getting Started', link: '/getting-started' },
            { text: 'Development Setup', link: '/development' }
          ]
        },
        {
          text: 'Architecture',
          items: [
            { text: 'System Overview', link: '/architecture' },
            { text: 'User Roles', link: '/roles' },
            { text: 'MCP Clients', link: '/mcp-clients' }
          ]
        },
        {
          text: 'API Documentation',
          items: [
            { text: 'API Reference', link: '/api/' }
          ]
        },
        {
          text: 'Configuration',
          items: [
            { text: 'Secrets & Environment', link: '/secrets-and-env' }
          ]
        },
        {
          text: 'Resources',
          items: [
            { text: 'Development Tips', link: '/tips' },
            { text: 'Troubleshooting', link: '/troubleshooting' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/LallaV/Tech-Xplore-2025' }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2025 Tech Xplore Team'
    },

    search: {
      provider: 'local'
    },

    editLink: {
      pattern: 'https://github.com/LallaV/Tech-Xplore-2025/edit/main/docs-site/:path'
    }
  },

  head: [
    // ['link', { rel: 'icon', href: '/favicon.ico' }], // TODO: Add favicon to public directory
    ['meta', { name: 'theme-color', content: '#646cff' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:locale', content: 'en' }],
    ['meta', { property: 'og:title', content: 'Tech Xplore Documentation' }],
    ['meta', { property: 'og:site_name', content: 'Tech Xplore Docs' }],
    ['meta', { property: 'og:url', content: 'https://your-docs-url.com' }]
  ]
}) 