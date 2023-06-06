import axios from 'axios';

interface NodeConfig {
  host: string;
  port?: number;
  username?: string;
  password?: string;
  ssl?: boolean;
  enabled?: boolean;
}

export class nodeManager {
  private nodes: NodeConfig[] = [];
  private currentIndex = 0;

  private createNodeAddress(node: NodeConfig) {
    let nodeAddress = node.host;
    if (node.port) {
      nodeAddress += `:${node.port}`;
    }
    return nodeAddress;
  }

  async add(node: NodeConfig) {
    if (typeof node !== 'object') {
      throw new Error('Invalid node configuration object');
    }

    node.enabled = node.enabled === false ? false : true;  // default to enabled unless explicitly set to false

    try {
      // Test the node here by making a sample request
      const nodeAddress = this.createNodeAddress(node);
      const result = await axios.get(nodeAddress);
      
      if (!result.data) {
        throw new Error('Invalid node response');
      }
      
    } catch (Error) {
      node.enabled = false; // disable node that failed the test
    }

    this.nodes.push(node);
  }

  remove(index: number) {
    if (typeof index !== 'number' || index < 0 || index >= this.nodes.length) {
      throw new Error('Invalid index for removing node');
    }

    this.nodes.splice(index, 1);
  }

  enable(index: number) {
    if (typeof index !== 'number' || index < 0 || index >= this.nodes.length) {
      throw new Error('Invalid index for enabling node');
    }

    this.nodes[index].enabled = true;
  }

  disable(index: number) {
    if (typeof index !== 'number' || index < 0 || index >= this.nodes.length) {
      throw new Error('Invalid index for disabling node');
    }

    this.nodes[index].enabled = false;
  }

  list() {
    return this.nodes.map((node, index) => ({
      index,
      host: node.host,
      port: node.port,
      enabled: node.enabled,
    }));
  }

  getNextIndex() {
    // If maximum index reached, start over from 0
    if (this.currentIndex >= this.nodes.length - 1) {
      this.currentIndex = 0;
    } else {
      this.currentIndex++;
    }

    return this.currentIndex;
  }
  
  async request(payload: any) {
    if (this.nodes.length === 0) {
      throw new Error("No nodes are available");
    }

    try {
      const node = this.nodes[this.currentIndex];
      
      // Only make request if the node is enabled
      if (node.enabled) {
        // Implement the logic for sending the request to the node using axios.
        // If the request fails, increment this.currentIndex and try the next node.
      } else {
        throw new Error('Current node is disabled');
      }

    } catch (Error) {
      this.getNextIndex();  // Switch to next node
      this.request(payload);  // Retry request with the next node
    }
  }
}
