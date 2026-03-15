import { create } from 'ipfs-http-client';

export default class IpfsService {
  constructor() {
    this.client = create({
      host: process.env.IPFS_HOST ?? 'ipfs.infura.io',
      port: Number(process.env.IPFS_PORT) || 5001,
      protocol: process.env.IPFS_PROTOCOL ?? 'https',
    });
  }

  async uploadContent(content) {
    try {
      const result = await this.client.add(content);
      return result.cid.toString();
    } catch (error) {
      console.error('IPFS upload error:', error);
      throw new Error('Failed to upload to IPFS');
    }
  }

  async getContent(cid) {
    try {
      const chunks = [];
      for await (const chunk of this.client.cat(cid)) {
        chunks.push(chunk);
      }
      return Buffer.concat(chunks).toString();
    } catch (error) {
      console.error('IPFS retrieval error:', error);
      throw new Error('Failed to retrieve content from IPFS');
    }
  }

  async pinContent(cid) {
    try {
      await this.client.pin.add(cid);
      return true;
    } catch (error) {
      console.error('IPFS pinning error:', error);
      return false;
    }
  }
}