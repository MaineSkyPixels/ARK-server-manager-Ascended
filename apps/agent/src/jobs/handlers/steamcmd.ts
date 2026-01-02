import { JobAssignmentDto, JobType } from '@ark-asa/contracts';
import { SteamCMDManager } from '../../runtime/steamcmd';
import { BuildActivator } from '../../runtime/build-activator';
import { getRuntimePaths } from '../../config/config';
import * as path from 'path';
import * as fs from 'fs';

/**
 * SteamCMD job handlers
 * Handles INSTALL_SERVER and UPDATE_SERVER jobs
 */
export class SteamCMDHandler {
  private readonly steamCmd: SteamCMDManager;
  private readonly buildActivator: BuildActivator;
  private readonly runtimeRoot: string;
  private readonly supportsHardlinks: boolean;

  constructor(runtimeRoot: string, supportsHardlinks: boolean) {
    this.runtimeRoot = runtimeRoot;
    this.supportsHardlinks = supportsHardlinks;
    this.steamCmd = new SteamCMDManager(runtimeRoot);
    this.buildActivator = new BuildActivator(runtimeRoot, supportsHardlinks);
  }

  /**
   * Handle a SteamCMD job
   */
  async handle(
    job: JobAssignmentDto,
    reportProgress: (percent: number, message: string) => Promise<void>,
  ): Promise<Record<string, unknown>> {
    switch (job.jobType) {
      case JobType.INSTALL_SERVER:
        return this.installServer(job, reportProgress);
      case JobType.UPDATE_SERVER:
        return this.updateServer(job, reportProgress);
      default:
        throw new Error(`Unsupported job type for SteamCMD: ${job.jobType}`);
    }
  }

  /**
   * Install ASA server
   */
  private async installServer(
    job: JobAssignmentDto,
    reportProgress: (percent: number, message: string) => Promise<void>,
  ): Promise<Record<string, unknown>> {
    await reportProgress(5, 'Preparing server installation...');

    // Get parameters
    const gameType = (job.parameters.gameType as string) || 'ASA';
    const appId = (job.parameters.appId as number) || (gameType === 'ASA' ? 2430930 : 346110); // ASA: 2430930, ASE: 346110
    const beta = job.parameters.beta as string | undefined;
    const betaPassword = job.parameters.betaPassword as string | undefined;
    const buildId = (job.parameters.buildId as string) || `build-${Date.now()}`;

    // Validate game type
    if (gameType !== 'ASA' && gameType !== 'ASE') {
      throw new Error(`Invalid game type: ${gameType}. Must be ASA or ASE.`);
    }

    await reportProgress(10, 'Setting up staging directory...');

    // Stage in temp directory first (idempotency: check if already exists)
    const paths = getRuntimePaths(this.runtimeRoot);
    const tempDir = path.join(paths.temp, job.jobId);
    const stagingDir = path.join(tempDir, 'staging');

    // Check if already installed (idempotency check)
    const cacheBuildDir = path.join(paths.cache.serverBuilds, gameType, buildId);
    if (fs.existsSync(cacheBuildDir)) {
      const isValid = await this.steamCmd.validateInstallation(
        path.join(cacheBuildDir, 'ShooterGame'),
      );
      if (isValid) {
        await reportProgress(100, `Build ${buildId} already installed in cache`);
        return {
          buildId,
          status: 'already_installed',
          cachePath: cacheBuildDir,
          message: 'Build was already installed',
        };
      }
    }

    // Ensure temp directory exists
    if (!fs.existsSync(stagingDir)) {
      fs.mkdirSync(stagingDir, { recursive: true });
    }

    await reportProgress(20, 'Running SteamCMD installation...');

    // Install via SteamCMD
    const installResult = await this.steamCmd.installOrUpdate(
      appId,
      stagingDir,
      beta,
      betaPassword,
    );

    await reportProgress(60, 'Validating installation...');

    // Validate installation
    const isValid = await this.steamCmd.validateInstallation(stagingDir);
    if (!isValid) {
      throw new Error('Installation validation failed - required files missing');
    }

    await reportProgress(70, 'Moving to cache...');

    // Move to cache (atomic operation)
    const finalCacheDir = path.join(paths.cache.serverBuilds, gameType, installResult.buildId);
    if (fs.existsSync(finalCacheDir)) {
      // Already exists - remove staging
      fs.rmSync(stagingDir, { recursive: true, force: true });
    } else {
      // Move staging to cache
      fs.mkdirSync(path.dirname(finalCacheDir), { recursive: true });
      fs.renameSync(stagingDir, finalCacheDir);
    }

    // Clean up temp directory
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.warn(`Failed to clean up temp directory: ${error}`);
    }

    await reportProgress(100, `Server installed successfully (build: ${installResult.buildId})`);

    return {
      buildId: installResult.buildId,
      cachePath: finalCacheDir,
      gameType,
      status: 'installed',
    };
  }

  /**
   * Update ASA server
   */
  private async updateServer(
    job: JobAssignmentDto,
    reportProgress: (percent: number, message: string) => Promise<void>,
  ): Promise<Record<string, unknown>> {
    await reportProgress(5, 'Preparing server update...');

    // Get parameters
    const gameType = (job.parameters.gameType as string) || 'ASA';
    const appId = (job.parameters.appId as number) || (gameType === 'ASA' ? 2430930 : 346110);
    const beta = job.parameters.beta as string | undefined;
    const betaPassword = job.parameters.betaPassword as string | undefined;
    const currentBuildId = job.parameters.currentBuildId as string | undefined;

    await reportProgress(10, 'Setting up staging directory...');

    // Stage update in temp directory
    const paths = getRuntimePaths(this.runtimeRoot);
    const tempDir = path.join(paths.temp, job.jobId);
    const stagingDir = path.join(tempDir, 'staging');

    // Ensure temp directory exists
    if (!fs.existsSync(stagingDir)) {
      fs.mkdirSync(stagingDir, { recursive: true });
    }

    await reportProgress(20, 'Running SteamCMD update...');

    // Update via SteamCMD
    const updateResult = await this.steamCmd.installOrUpdate(
      appId,
      stagingDir,
      beta,
      betaPassword,
    );

    await reportProgress(60, 'Validating update...');

    // Validate update
    const isValid = await this.steamCmd.validateInstallation(stagingDir);
    if (!isValid) {
      throw new Error('Update validation failed - required files missing');
    }

    // Check if this is the same build (idempotency)
    if (currentBuildId === updateResult.buildId) {
      await reportProgress(100, `Server already at build ${updateResult.buildId}`);
      
      // Clean up staging
      fs.rmSync(stagingDir, { recursive: true, force: true });
      
      return {
        buildId: updateResult.buildId,
        status: 'already_updated',
        message: 'Server was already at this build',
      };
    }

    await reportProgress(70, 'Moving to cache...');

    // Move to cache (atomic operation)
    const finalCacheDir = path.join(paths.cache.serverBuilds, gameType, updateResult.buildId);
    if (fs.existsSync(finalCacheDir)) {
      // Already exists - remove staging
      fs.rmSync(stagingDir, { recursive: true, force: true });
    } else {
      // Move staging to cache
      fs.mkdirSync(path.dirname(finalCacheDir), { recursive: true });
      fs.renameSync(stagingDir, finalCacheDir);
    }

    // Clean up temp directory
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.warn(`Failed to clean up temp directory: ${error}`);
    }

    await reportProgress(100, `Server updated successfully (build: ${updateResult.buildId})`);

    return {
      buildId: updateResult.buildId,
      cachePath: finalCacheDir,
      gameType,
      previousBuildId: currentBuildId,
      status: 'updated',
    };
  }
}

