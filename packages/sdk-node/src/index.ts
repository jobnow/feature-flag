export interface FeatureFlagsClientOptions {
  baseUrl: string;
  projectKey: string;
  envKey: string;
  apiKey: string;
}

export interface FlagEvaluation {
  flagKey: string;
  value: any;
  type: string;
  evaluatedFrom: 'disabled' | 'default' | 'segment' | 'rollout';
}

export interface GetOptions {
  userId?: string;
}

/**
 * Feature Flags Client for Node.js
 */
export class FeatureFlagsClient {
  private baseUrl: string;
  private projectKey: string;
  private envKey: string;
  private apiKey: string;
  private fetch: typeof fetch;

  constructor(options: FeatureFlagsClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.projectKey = options.projectKey;
    this.envKey = options.envKey;
    this.apiKey = options.apiKey;

    // Usa fetch nativo (Node 20+) ou undici se disponível
    if (typeof fetch !== 'undefined') {
      this.fetch = fetch;
    } else {
      try {
        // Tenta usar undici se disponível
        const { fetch: undiciFetch } = require('undici');
        this.fetch = undiciFetch;
      } catch {
        throw new Error(
          'fetch is not available. Please use Node.js 20+ or install undici: npm install undici'
        );
      }
    }
  }

  /**
   * Get a single flag value
   */
  async get(flagKey: string, options: GetOptions = {}): Promise<FlagEvaluation> {
    const url = new URL(
      `${this.baseUrl}/runtime/${this.projectKey}/${this.envKey}/flags/${flagKey}`
    );

    if (options.userId) {
      url.searchParams.set('userId', options.userId);
    }

    const response = await this.fetch(url.toString(), {
      method: 'GET',
      headers: {
        'x-env-key': this.apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get flag: ${response.status} ${error}`);
    }

    return response.json();
  }

  /**
   * Get all flags for the environment
   */
  async getAll(options: GetOptions = {}): Promise<FlagEvaluation[]> {
    const url = new URL(
      `${this.baseUrl}/runtime/${this.projectKey}/${this.envKey}/flags`
    );

    if (options.userId) {
      url.searchParams.set('userId', options.userId);
    }

    const response = await this.fetch(url.toString(), {
      method: 'GET',
      headers: {
        'x-env-key': this.apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get flags: ${response.status} ${error}`);
    }

    return response.json();
  }
}
