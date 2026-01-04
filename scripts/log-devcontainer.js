#!/usr/bin/env node
const { exec, spawn } = require('child_process');

// Find devcontainer by label
const command = `docker ps -q --filter "label=devcontainer.local_folder"`;

exec(command, (error, stdout) => {
  if (error && error.code !== 0) {
    console.log('No devcontainer is running');
    process.exit(0);
  }

  const containerIds = stdout.trim().split('\n').filter(Boolean);

  if (containerIds.length === 0) {
    console.log('No devcontainer is running');
    process.exit(0);
  }

  // Follow logs from the first container
  const containerId = containerIds[0];
  const logsProcess = spawn('docker', ['logs', '-f', containerId], {
    stdio: 'inherit',
  });

  logsProcess.on('error', (err) => {
    console.error('Failed to get logs:', err.message);
    process.exit(1);
  });

  // Handle Ctrl+C gracefully
  process.on('SIGINT', () => {
    logsProcess.kill('SIGINT');
    process.exit(0);
  });
});
