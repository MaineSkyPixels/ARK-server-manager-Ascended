import { loadConfig, AgentConfig } from './config/config';
import { ControlPlaneClient } from './api/client';
import { RegistrationManager } from './agent/registration';
import { JobPoller } from './jobs/poller';
import { JobExecutor } from './jobs/executor';

/**
 * Main agent entry point
 */
async function main() {
  console.log('ARK ASA Agent Runtime - Starting...');
  
  // Load configuration
  const config = loadConfig();
  console.log(`Agent ID: ${config.agentId}`);
  console.log(`Control Plane URL: ${config.controlPlaneUrl}`);
  console.log(`Runtime Root: ${config.runtimeRoot}`);
  
  // Create HTTP client
  const client = new ControlPlaneClient(config.controlPlaneUrl);
  
  // Create registration manager
  const registration = new RegistrationManager(client, config);
  
  // Create job executor
  const executor = new JobExecutor(client, config);
  
  // Create job poller
  const poller = new JobPoller(client, config, executor);
  
  // Register agent
  try {
    await registration.register();
  } catch (error) {
    console.error(`Failed to register agent: ${error}`);
    console.error('Agent will exit. Please check control plane connectivity.');
    process.exit(1);
  }
  
  // Start heartbeat
  registration.startHeartbeat();
  
  // Start job polling
  poller.startPolling();
  
  // Update active jobs in heartbeat
  const updateHeartbeatJobs = () => {
    registration.updateActiveJobs(executor.getActiveJobIds());
  };
  setInterval(updateHeartbeatJobs, 5000); // Update every 5 seconds
  
  // Handle graceful shutdown
  const shutdown = () => {
    console.log('Shutting down agent...');
    registration.stopHeartbeat();
    poller.stopPolling();
    // Wait for active jobs to complete (with timeout)
    setTimeout(() => {
      console.log('Agent shutdown complete');
      process.exit(0);
    }, 5000);
  };
  
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  
  console.log('Agent runtime started successfully');
}

// Run main function
main().catch(error => {
  console.error(`Fatal error: ${error}`);
  process.exit(1);
});

