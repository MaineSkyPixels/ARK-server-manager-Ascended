import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { AgentConfigDto } from '@ark-asa/contracts';

/**
 * Agent configuration loaded from file and environment
 */
export interface AgentConfig {
  // Agent identity
  agentId: string;
  version: string;
  
  // Control plane connection
  controlPlaneUrl: string;
  
  // Runtime paths (rooted at D:\Ark ASA ASM\runtime)
  runtimeRoot: string;
  
  // Agent behavior
  pollIntervalSeconds: number;
  heartbeatIntervalSeconds: number;
  maxRetries: number;
  
  // Capabilities
  supportsHardlinks: boolean;
  maxConcurrentJobs: number;
  supportedGameTypes: string[];
}

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: Partial<AgentConfig> = {
  version: '0.1.0',
  controlPlaneUrl: process.env.CONTROL_PLANE_URL || 'http://localhost:3000',
  runtimeRoot: 'D:\\Ark ASA ASM\\runtime',
  pollIntervalSeconds: 5,
  heartbeatIntervalSeconds: 30,
  maxRetries: 3,
  maxConcurrentJobs: 5,
  supportedGameTypes: ['ASA'],
};

/**
 * Configuration file path
 */
const CONFIG_FILE_PATH = path.join(
  DEFAULT_CONFIG.runtimeRoot!,
  'agent',
  'config.json'
);

/**
 * Load agent configuration from file and environment
 */
export function loadConfig(): AgentConfig {
  // Ensure runtime directories exist
  ensureRuntimeDirectories();
  
  // Load from file if it exists
  let fileConfig: Partial<AgentConfig> = {};
  if (fs.existsSync(CONFIG_FILE_PATH)) {
    try {
      const fileContent = fs.readFileSync(CONFIG_FILE_PATH, 'utf-8');
      fileConfig = JSON.parse(fileContent);
    } catch (error) {
      console.warn(`Failed to load config file: ${error}. Using defaults.`);
    }
  }
  
  // Generate agentId if not set
  const agentId = fileConfig.agentId || 
                  process.env.AGENT_ID || 
                  generateAgentId();
  
  // Detect hardlink support
  const supportsHardlinks = detectHardlinkSupport();
  
  // Merge: env vars > file config > defaults
  const config: AgentConfig = {
    ...DEFAULT_CONFIG,
    ...fileConfig,
    agentId,
    supportsHardlinks,
    controlPlaneUrl: process.env.CONTROL_PLANE_URL || fileConfig.controlPlaneUrl || DEFAULT_CONFIG.controlPlaneUrl!,
    pollIntervalSeconds: parseInt(
      process.env.POLL_INTERVAL_SECONDS || 
      String(fileConfig.pollIntervalSeconds || DEFAULT_CONFIG.pollIntervalSeconds!)
    ),
    heartbeatIntervalSeconds: parseInt(
      process.env.HEARTBEAT_INTERVAL_SECONDS || 
      String(fileConfig.heartbeatIntervalSeconds || DEFAULT_CONFIG.heartbeatIntervalSeconds!)
    ),
    maxRetries: parseInt(
      process.env.MAX_RETRIES || 
      String(fileConfig.maxRetries || DEFAULT_CONFIG.maxRetries!)
    ),
    maxConcurrentJobs: parseInt(
      process.env.MAX_CONCURRENT_JOBS || 
      String(fileConfig.maxConcurrentJobs || DEFAULT_CONFIG.maxConcurrentJobs!)
    ),
  } as AgentConfig;
  
  // Save config to file for persistence
  saveConfig(config);
  
  return config;
}

/**
 * Ensure runtime directory structure exists
 */
function ensureRuntimeDirectories(): void {
  const runtimeRoot = DEFAULT_CONFIG.runtimeRoot!;
  const dirs = [
    path.join(runtimeRoot, 'agent'),
    path.join(runtimeRoot, 'cache', 'server_builds', 'ASA'),
    path.join(runtimeRoot, 'cache', 'mods'),
    path.join(runtimeRoot, 'instances'),
    path.join(runtimeRoot, 'backups'),
    path.join(runtimeRoot, 'logs', 'jobs'),
    path.join(runtimeRoot, 'logs', 'instances'),
    path.join(runtimeRoot, 'temp'),
  ];
  
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

/**
 * Generate a unique agent ID
 */
function generateAgentId(): string {
  const hostname = os.hostname();
  const timestamp = Date.now();
  return `agent-${hostname}-${timestamp}`;
}

/**
 * Detect if the filesystem supports hardlinks
 * On Windows with NTFS, hardlinks are supported
 */
function detectHardlinkSupport(): boolean {
  try {
    // Test hardlink creation in temp directory
    const testDir = path.join(DEFAULT_CONFIG.runtimeRoot!, 'temp', 'hardlink-test');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    const testFile = path.join(testDir, 'test-source.txt');
    const testLink = path.join(testDir, 'test-link.txt');
    
    // Create test file
    fs.writeFileSync(testFile, 'test');
    
    try {
      // Try to create hardlink (Windows: fs.linkSync, but we'll use fs.copyFileSync as fallback)
      // On Windows, we can use fs.linkSync for hardlinks
      fs.linkSync(testFile, testLink);
      
      // Cleanup
      fs.unlinkSync(testLink);
      fs.unlinkSync(testFile);
      fs.rmdirSync(testDir);
      
      return true;
    } catch {
      // Cleanup on failure
      try {
        if (fs.existsSync(testLink)) fs.unlinkSync(testLink);
        if (fs.existsSync(testFile)) fs.unlinkSync(testFile);
        if (fs.existsSync(testDir)) fs.rmdirSync(testDir);
      } catch {}
      
      return false;
    }
  } catch {
    return false;
  }
}

/**
 * Save configuration to file
 */
function saveConfig(config: AgentConfig): void {
  try {
    const configDir = path.dirname(CONFIG_FILE_PATH);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    // Don't save runtime-detected values
    const configToSave: Partial<AgentConfig> = {
      agentId: config.agentId,
      version: config.version,
      controlPlaneUrl: config.controlPlaneUrl,
      runtimeRoot: config.runtimeRoot,
      pollIntervalSeconds: config.pollIntervalSeconds,
      heartbeatIntervalSeconds: config.heartbeatIntervalSeconds,
      maxRetries: config.maxRetries,
      maxConcurrentJobs: config.maxConcurrentJobs,
      supportedGameTypes: config.supportedGameTypes,
    };
    
    fs.writeFileSync(
      CONFIG_FILE_PATH,
      JSON.stringify(configToSave, null, 2),
      'utf-8'
    );
  } catch (error) {
    console.warn(`Failed to save config file: ${error}`);
  }
}

/**
 * Get normalized runtime paths
 */
export function getRuntimePaths(runtimeRoot: string) {
  return {
    agent: path.join(runtimeRoot, 'agent'),
    cache: {
      serverBuilds: path.join(runtimeRoot, 'cache', 'server_builds'),
      mods: path.join(runtimeRoot, 'cache', 'mods'),
    },
    instances: path.join(runtimeRoot, 'instances'),
    backups: path.join(runtimeRoot, 'backups'),
    logs: {
      agent: path.join(runtimeRoot, 'logs', 'agent.log'),
      jobs: path.join(runtimeRoot, 'logs', 'jobs'),
      instances: path.join(runtimeRoot, 'logs', 'instances'),
    },
    temp: path.join(runtimeRoot, 'temp'),
  };
}

