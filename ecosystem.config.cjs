module.exports = {
  apps: [{
    name: 'hopms',
    script: 'npm',
    args: 'run dev -- --port 5169 --host',
    env: {
      NODE_ENV: 'development',
      VITE_API_URL: 'http://37.27.142.148:3000'
    },
    watch: false,
    instances: 1,
    autorestart: true,
    max_memory_restart: '1G'
  }]
}; 