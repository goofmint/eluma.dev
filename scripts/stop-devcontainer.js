#!/usr/bin/env node
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Find and stop devcontainer by label
const command = `docker ps -q --filter "label=devcontainer.local_folder"`;

async function main() {
  try {
    const { stdout } = await execAsync(command);
    const containerIds = stdout.trim().split('\n').filter(Boolean);

    if (containerIds.length === 0) {
      console.log('No devcontainer is running');
      process.exit(0);
    }

    // Stop all containers in parallel with proper error handling
    const stopPromises = containerIds.map(async (id) => {
      try {
        await execAsync(`docker stop ${id}`);
        console.log(`✓ Stopped devcontainer: ${id}`);
        return { id, success: true };
      } catch (error) {
        console.error(`✗ Failed to stop container ${id}:`, error.message);
        return { id, success: false, error: error.message };
      }
    });

    const results = await Promise.all(stopPromises);

    // Check if any stops failed
    const failures = results.filter((r) => !r.success);
    if (failures.length > 0) {
      console.error(
        `\nFailed to stop ${failures.length} container(s). See errors above.`
      );
      process.exit(1);
    }

    console.log('\nAll devcontainers stopped successfully.');
    process.exit(0);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error('Error: docker command not found. Is Docker installed?');
    } else {
      console.error('Error:', error.message);
    }
    process.exit(1);
  }
}

main();
