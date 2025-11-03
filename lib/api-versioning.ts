import { NextRequest, NextResponse } from 'next/server';
import { logger } from './logger';

// API version interface
interface ApiVersion {
  version: string;
  supported: boolean;
  deprecated: boolean;
  deprecationDate?: string;
  sunsetDate?: string;
  changelog?: string;
}

// API version configuration
const API_VERSIONS: Record<string, ApiVersion> = {
  'v1': {
    version: 'v1',
    supported: true,
    deprecated: false,
  },
  'v2': {
    version: 'v2',
    supported: true,
    deprecated: false,
  },
  'v3': {
    version: 'v3',
    supported: false,
    deprecated: true,
    deprecationDate: '2024-01-01',
    sunsetDate: '2024-12-31',
    changelog: 'Version 3 is deprecated. Please migrate to v2.',
  },
};

// Default API version
const DEFAULT_VERSION = 'v1';

// API versioning class
class ApiVersioning {
  private versions: Record<string, ApiVersion>;
  private defaultVersion: string;

  constructor(versions: Record<string, ApiVersion> = API_VERSIONS, defaultVersion: string = DEFAULT_VERSION) {
    this.versions = versions;
    this.defaultVersion = defaultVersion;
  }

  // Extract version from request
  extractVersion(request: NextRequest): string | null {
    const url = request.nextUrl;
    const pathname = url.pathname;
    
    // Check for version in path: /api/v1/...
    const versionMatch = pathname.match(/^\/api\/(v\d+)\//);
    if (versionMatch) {
      return versionMatch[1]!;
    }

    // Check for version in query parameter: /api/...?version=v1
    const versionParam = url.searchParams.get('version');
    if (versionParam) {
      return versionParam;
    }

    // Check for version in header: X-API-Version: v1
    const versionHeader = request.headers.get('X-API-Version');
    if (versionHeader) {
      return versionHeader;
    }

    // Check for version in Accept header: application/vnd.api+json;version=v1
    const acceptHeader = request.headers.get('Accept');
    if (acceptHeader) {
      const versionMatch = acceptHeader.match(/version=([^;]+)/);
      if (versionMatch) {
        return versionMatch[1]!;
      }
    }

    return null;
  }

  // Get version information
  getVersionInfo(version: string): ApiVersion | null {
    return this.versions[version] || null;
  }

  // Check if version is supported
  isVersionSupported(version: string): boolean {
    const versionInfo = this.getVersionInfo(version);
    return versionInfo?.supported || false;
  }

  // Check if version is deprecated
  isVersionDeprecated(version: string): boolean {
    const versionInfo = this.getVersionInfo(version);
    return versionInfo?.deprecated || false;
  }

  // Get default version
  getDefaultVersion(): string {
    return this.defaultVersion;
  }

  // Get supported versions
  getSupportedVersions(): string[] {
    return Object.keys(this.versions).filter(version => 
      this.versions[version]?.supported
    );
  }

  // Get deprecated versions
  getDeprecatedVersions(): string[] {
    return Object.keys(this.versions).filter(version => 
      this.versions[version]?.deprecated
    );
  }

  // Handle version in request
  handleVersion(request: NextRequest): { version: string; response?: NextResponse } {
    const requestedVersion = this.extractVersion(request);
    const version = requestedVersion || this.defaultVersion;

    // Check if version exists
    if (!this.versions[version]) {
      logger.warn('API version not found', {
        requestedVersion,
        supportedVersions: this.getSupportedVersions(),
        path: request.nextUrl.pathname,
      });

      return {
        version: this.defaultVersion,
        response: NextResponse.json(
          {
            error: {
              message: 'API version not found',
              code: 'VERSION_NOT_FOUND',
              statusCode: 400,
              timestamp: new Date().toISOString(),
              supportedVersions: this.getSupportedVersions(),
            },
          },
          { status: 400 }
        ),
      };
    }

    // Check if version is supported
    if (!this.isVersionSupported(version)) {
      logger.warn('API version not supported', {
        requestedVersion: version,
        supportedVersions: this.getSupportedVersions(),
        path: request.nextUrl.pathname,
      });

      return {
        version: this.defaultVersion,
        response: NextResponse.json(
          {
            error: {
              message: 'API version not supported',
              code: 'VERSION_NOT_SUPPORTED',
              statusCode: 400,
              timestamp: new Date().toISOString(),
              supportedVersions: this.getSupportedVersions(),
            },
          },
          { status: 400 }
        ),
      };
    }

    // Check if version is deprecated
    if (this.isVersionDeprecated(version)) {
      const versionInfo = this.getVersionInfo(version);
      logger.warn('API version deprecated', {
        requestedVersion: version,
        deprecationDate: versionInfo?.deprecationDate,
        sunsetDate: versionInfo?.sunsetDate,
        path: request.nextUrl.pathname,
      });

      // Add deprecation warning headers
      const response = NextResponse.next();
      response.headers.set('X-API-Version-Deprecated', 'true');
      response.headers.set('X-API-Version-Deprecation-Date', versionInfo?.deprecationDate || '');
      response.headers.set('X-API-Version-Sunset-Date', versionInfo?.sunsetDate || '');
      response.headers.set('X-API-Version-Changelog', versionInfo?.changelog || '');

      return { version, response };
    }

    return { version };
  }

  // Add version headers to response
  addVersionHeaders(response: NextResponse, version: string): NextResponse {
    const versionInfo = this.getVersionInfo(version);
    
    if (versionInfo) {
      response.headers.set('X-API-Version', version);
      response.headers.set('X-API-Version-Supported', versionInfo.supported.toString());
      response.headers.set('X-API-Version-Deprecated', versionInfo.deprecated.toString());
      
      if (versionInfo.deprecationDate) {
        response.headers.set('X-API-Version-Deprecation-Date', versionInfo.deprecationDate);
      }
      
      if (versionInfo.sunsetDate) {
        response.headers.set('X-API-Version-Sunset-Date', versionInfo.sunsetDate);
      }
    }

    return response;
  }

  // Get version-specific route
  getVersionedRoute(route: string, version: string): string {
    // Remove existing version from route
    const cleanRoute = route.replace(/^\/api\/v\d+\//, '/api/');
    
    // Add version to route
    return cleanRoute.replace('/api/', `/api/${version}/`);
  }

  // Get version-specific middleware
  getVersionedMiddleware(version: string): any {
    // This would return version-specific middleware
    // For now, return a generic middleware
    return null;
  }

  // Add new version
  addVersion(version: string, versionInfo: ApiVersion): void {
    this.versions[version] = versionInfo;
  }

  // Remove version
  removeVersion(version: string): void {
    delete this.versions[version];
  }

  // Update version
  updateVersion(version: string, updates: Partial<ApiVersion>): void {
    if (this.versions[version]) {
      this.versions[version] = { ...this.versions[version], ...updates };
    }
  }

  // Get all versions
  getAllVersions(): Record<string, ApiVersion> {
    return { ...this.versions };
  }
}

// Create API versioning instance
export const apiVersioning = new ApiVersioning();

// Create specialized API versioning
export const createApiVersioning = (versions: Record<string, ApiVersion>, defaultVersion: string = DEFAULT_VERSION) => {
  return new ApiVersioning(versions, defaultVersion);
};

// API versioning middleware
export function withApiVersioning(
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>, 
  versioning: ApiVersioning = apiVersioning
) {
  return async function (request: NextRequest, ...args: any[]): Promise<NextResponse> {
    // Handle version
    const { version, response } = versioning.handleVersion(request);
    
    if (response) {
      return response;
    }

    // Execute original handler with version context
    const result = await handler(request, ...args);

    // Add version headers to response
    if (result instanceof NextResponse) {
      return versioning.addVersionHeaders(result, version);
    }

    return result;
  };
}

// Version-specific route handler
export function createVersionedRoute(version: string, handler: any) {
  return function (request: NextRequest, ...args: any[]) {
    // Add version context to request
    (request as any).apiVersion = version;
    
    return handler(request, ...args);
  };
}

// Version compatibility checker
export function checkVersionCompatibility(version: string, requiredVersion: string): boolean {
  const versionParts = version.replace('v', '').split('.').map(Number);
  const requiredParts = requiredVersion.replace('v', '').split('.').map(Number);

  for (let i = 0; i < Math.max(versionParts.length, requiredParts.length); i++) {
    const versionPart = versionParts[i] || 0;
    const requiredPart = requiredParts[i] || 0;

    if (versionPart > requiredPart) {
      return true;
    } else if (versionPart < requiredPart) {
      return false;
    }
  }

  return true;
}

// Version migration helper
export function createVersionMigration(fromVersion: string, toVersion: string, migrationFn: (data: any) => any) {
  return function (data: any) {
    logger.info('Migrating data between API versions', {
      fromVersion,
      toVersion,
      dataType: typeof data,
    });

    return migrationFn(data);
  };
}

// Export version constants
export { API_VERSIONS, DEFAULT_VERSION as DEFAULT_API_VERSION };

export default apiVersioning;