module.exports = {
  apps: [{
    name: 'hopms',
    script: 'npm',
    args: 'run preview',
    env: {
      PORT: 5169,
      NODE_ENV: 'production'
    },
    watch: false,
    instances: 1,
    autorestart: true,
    max_memory_restart: '1G'
  }]
}; 