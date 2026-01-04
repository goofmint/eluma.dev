#!/usr/bin/env node
const { exec } = require('child_process');

// Find and stop devcontainer by label
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

  containerIds.forEach((id) => {
    exec(`docker stop ${id}`, (stopError) => {
      if (stopError) {
        console.error(`Failed to stop container ${id}:`, stopError.message);
        process.exit(1);
      }
      console.log(`Stopped devcontainer: ${id}`);
    });
  });
});
