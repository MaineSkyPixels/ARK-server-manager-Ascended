import { Controller, Get, Post, Body, Query, Param, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBody, ApiParam } from '@nestjs/swagger';
import { JobsService } from './jobs.service';
import { JobPollResponseDto, JobProgressDto, JobCompleteDto, JobResponseDto } from '@ark-asa/contracts';
import { JobProgressDtoClass } from './dto/job-progress.dto';
import { JobCompleteDtoClass } from './dto/job-complete.dto';

@ApiTags('jobs')
@Controller('jobs')
export class JobsController {
  private readonly logger = new Logger(JobsController.name);

  constructor(private readonly jobsService: JobsService) {}

  @Get('poll')
  @ApiOperation({ summary: 'Poll for jobs assigned to an agent' })
  @ApiQuery({ name: 'agentId', required: true, description: 'Agent identifier' })
  @ApiResponse({
    status: 200,
    description: 'List of jobs assigned to the agent',
    type: Object,
  })
  @ApiResponse({ status: 404, description: 'Agent not found' })
  async pollJobs(@Query('agentId') agentId: string): Promise<JobPollResponseDto> {
    this.logger.debug(`Job poll request from agent: ${agentId}`);
    return this.jobsService.pollJobs(agentId);
  }

  @Post('progress')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Report job progress update' })
  @ApiBody({ type: JobProgressDtoClass })
  @ApiResponse({
    status: 204,
    description: 'Progress update received',
  })
  @ApiResponse({ status: 404, description: 'Job or job run not found' })
  async reportProgress(@Body() dto: JobProgressDtoClass): Promise<void> {
    this.logger.debug(`Job progress update: ${dto.jobId}`);
    await this.jobsService.reportProgress(dto);
  }

  @Post('complete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Report job completion (success, failure, or cancellation)' })
  @ApiBody({ type: JobCompleteDtoClass })
  @ApiResponse({
    status: 204,
    description: 'Completion report received',
  })
  @ApiResponse({ status: 404, description: 'Job or job run not found' })
  @ApiResponse({ status: 400, description: 'Invalid completion status' })
  async reportCompletion(@Body() dto: JobCompleteDtoClass): Promise<void> {
    this.logger.log(`Job completion report: ${dto.jobId} - ${dto.status}`);
    await this.jobsService.reportCompletion(dto);
  }

  @Get(':jobId')
  @ApiOperation({ summary: 'Get job details by ID' })
  @ApiParam({ name: 'jobId', description: 'Job identifier' })
  @ApiResponse({
    status: 200,
    description: 'Job details including progress information',
    type: Object,
  })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async getJob(@Param('jobId') jobId: string): Promise<JobResponseDto> {
    this.logger.debug(`Fetching job: ${jobId}`);
    return this.jobsService.getJobById(jobId);
  }
}

