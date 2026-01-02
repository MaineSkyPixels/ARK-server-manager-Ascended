/**
 * Host DTO
 * Represents a physical or virtual host machine
 */
export interface HostDto {
  hostId: string;
  hostname: string;
  ipAddress?: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

/**
 * Host Create DTO
 * Request to register a new host
 */
export interface HostCreateDto {
  hostname: string;
  ipAddress?: string;
}

