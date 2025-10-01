module.exports = {
  apps: [
    {
      name: 'neoshop-ultra',
      script: 'npm',
      args: 'start',
      cwd: '/opt/neoshop-ultra',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        DATABASE_URL: process.env.DATABASE_URL,
        REDIS_URL: process.env.REDIS_URL,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
        STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
        STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
        STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
        BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
        RESEND_API_KEY: process.env.RESEND_API_KEY,
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 3000,
        DATABASE_URL: process.env.DATABASE_URL_STAGING,
        REDIS_URL: process.env.REDIS_URL_STAGING,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL_STAGING,
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET_STAGING,
        STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY_STAGING,
        STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY_STAGING,
        STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET_STAGING,
        BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN_STAGING,
        RESEND_API_KEY: process.env.RESEND_API_KEY_STAGING,
      },
      // Process management
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      max_memory_restart: '1G',
      
      // Logging
      log_file: '/var/log/neoshop-ultra/combined.log',
      out_file: '/var/log/neoshop-ultra/out.log',
      error_file: '/var/log/neoshop-ultra/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Monitoring
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'uploads', 'backups'],
      
      // Health check
      health_check_grace_period: 3000,
      health_check_interval: 30000,
      
      // Advanced options
      kill_timeout: 5000,
      listen_timeout: 3000,
      shutdown_with_message: true,
      
      // Environment specific settings
      node_args: '--max-old-space-size=2048',
      
      // Source map support
      source_map_support: true,
      
      // Auto restart on file changes (development only)
      watch_options: {
        usePolling: true,
        interval: 1000,
      },
    },
  ],
  
  // Deployment configuration
  deploy: {
    production: {
      user: 'deploy',
      host: ['your-server.com'],
      ref: 'origin/main',
      repo: 'git@github.com:your-username/neoshop-ultra.git',
      path: '/opt/neoshop-ultra',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
    },
    staging: {
      user: 'deploy',
      host: ['staging-server.com'],
      ref: 'origin/staging',
      repo: 'git@github.com:your-username/neoshop-ultra.git',
      path: '/opt/neoshop-ultra-staging',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env staging',
      'pre-setup': '',
    },
  },
}




