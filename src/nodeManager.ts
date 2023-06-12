import axios from 'axios';
import CryptoJS from 'crypto-js';

class InvalidNodeIndexError extends Error {
  constructor(index: number) {
    super(`Invalid node index: ${index}`);
    this.name = "InvalidNodeIndexError";
  }
}

export interface NodeConfig {
  host: string;
  port?: number;
  ssl?: boolean;
  username?: string;
  password?: string;
  enabled?: boolean;
}

export interface Request {
  method: string;
  params?: any[];
}

export class nodeManager {
  private nodes: NodeConfig[] = [];
  private currentIndex = 0;
  private pendingRequests: Record<string, Request> = {};
  
  private generateRequestId() {
    let id;
    do {
      id = 'req-' + CryptoJS.lib.WordArray.random(6).toString();
    } while (this.pendingRequests[id]);
    return id;
  }

  async add(node: Partial<NodeConfig>) {
    if (!node.host) {
      throw new Error('Host is required');
    }

    let url = new URL(node.host);

    const parsedNodeConfig: NodeConfig = {
      host: url.hostname,
      port: node.port ?? (url.port ? parseInt(url.port) : 8332),
      ssl: node.ssl ?? (url.protocol === 'https:' ? true : false),
      username: (node.username ?? url.username) || '',
      password: (node.password ?? url.password) || '',
      enabled: node.enabled ?? true,
    };
	
	const request = this.createRequest('getblockchaininfo');
	const test = await this.sendRequest(request, parsedNodeConfig);

    if (!test.data) {
      throw new Error('Invalid node response');
    }

    this.nodes.push(parsedNodeConfig);
  }

  remove(index: number) {
  if (typeof index !== 'number' || index < 0 || index >= this.nodes.length) {
    throw new InvalidNodeIndexError(index);
  }
  this.nodes.splice(index, 1);
}

enable(index: number) {
  if (typeof index !== 'number' || index < 0 || index >= this.nodes.length) {
    throw new InvalidNodeIndexError(index);
  }
  this.nodes[index].enabled = true;
}

disable(index: number) {
  if (typeof index !== 'number' || index < 0 || index >= this.nodes.length) {
    throw new InvalidNodeIndexError(index);
  }
  this.nodes[index].enabled = false;
}

  list() {
    return this.nodes.map((node, index) => ({
      index,
      host: node.host,
      port: node.port,
	  ssl: node.ssl,
      enabled: node.enabled,
    }));
  }

  getNextIndex() {
  let index;
  do {
    if (this.currentIndex >= this.nodes.length - 1) {
      this.currentIndex = 0;
    } else {
      this.currentIndex++;
    }
    index = this.currentIndex;
  } while (!this.nodes[index].enabled);
  return index;
}
  
  createRequest(method: string, params: any[] = []): Request {
    if (!method || typeof method !== 'string') {
      throw new Error("Invalid method");
    }
    
    return {
      method,
      params,
    };
  }

  async sendRequest(requests: Request | Request[], nodeConfig?: NodeConfig): Promise<any> {
    if (!Array.isArray(requests)) {
      requests = [requests];
    }

    let node = nodeConfig ? nodeConfig : this.nodes[this.getNextIndex()];

    for (let request of requests) {
      const requestId = this.generateRequestId();
      request.params = request.params || [];
      this.pendingRequests[requestId] = request;
    }

    const config = {
      auth: {
        username: node.username || "",
        password: node.password || "",
      },
    };

    try {
		const protocol = node.ssl ? 'https' : 'http';
		const response = await axios.post(`${protocol}://${node.host}:${node.port}`, requests, config);

      for (let responseData of response.data) {
        const requestId = responseData.id;
        if (!responseData.error) {
          delete this.pendingRequests[requestId];
        } else {
          throw new Error(responseData.error.message);
        }
      }

      return response.data;
    } catch (error) {
      const remainingRequests = Object.values(this.pendingRequests);
      if (remainingRequests.length > 0) {
        return this.sendRequest(remainingRequests);
      }
    }
  }
}
