/**
 * Cluster DTO
 * Represents a logical grouping of hosts/agents
 */
export interface ClusterDto {
  clusterId: string;
  name: string;
  description?: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

/**
 * Cluster Create DTO
 * Request to create a new cluster
 */
export interface ClusterCreateDto {
  name: string;
  description?: string;
}

