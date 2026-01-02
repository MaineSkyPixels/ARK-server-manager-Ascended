import {
  AgentRegistrationDto,
  AgentHeartbeatDto,
  AgentResponseDto,
  AgentConfigDto,
  JobPollResponseDto,
  JobProgressDto,
  JobCompleteDto,
} from '@ark-asa/contracts';

/**
 * HTTP client for communicating with control plane
 */
export class ControlPlaneClient {
  private readonly baseUrl: string;
  
  constructor(baseUrl: string) {
    // Ensure baseUrl ends without trailing slash
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }
  
  /**
   * Register agent with control plane
   */
  async register(dto: AgentRegistrationDto): Promise<AgentResponseDto> {
    const response = await fetch(`${this.baseUrl}/agents/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dto),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Registration failed: ${response.status} ${errorText}`);
    }
    
    return response.json();
  }
  
  /**
   * Send heartbeat to control plane
   */
  async heartbeat(dto: AgentHeartbeatDto): Promise<void> {
    const response = await fetch(`${this.baseUrl}/agents/heartbeat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dto),
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Agent not found - registration may be required');
      }
      const errorText = await response.text();
      throw new Error(`Heartbeat failed: ${response.status} ${errorText}`);
    }
  }
  
  /**
   * Poll for assigned jobs
   */
  async pollJobs(agentId: string): Promise<JobPollResponseDto> {
    const response = await fetch(`${this.baseUrl}/jobs/poll?agentId=${encodeURIComponent(agentId)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Job poll failed: ${response.status} ${errorText}`);
    }
    
    return response.json();
  }
  
  /**
   * Report job progress
   */
  async reportProgress(dto: JobProgressDto): Promise<void> {
    const response = await fetch(`${this.baseUrl}/jobs/progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dto),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Progress report failed: ${response.status} ${errorText}`);
    }
  }
  
  /**
   * Report job completion
   */
  async reportComplete(dto: JobCompleteDto): Promise<void> {
    const response = await fetch(`${this.baseUrl}/jobs/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dto),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Job complete report failed: ${response.status} ${errorText}`);
    }
  }
}

