import { AccessToken } from 'livekit-server-sdk';

export default class LiveKitService {
  constructor() {
    // Mock credentials for testing
    this.apiKey = 'mock-api-key';
    this.apiSecret = 'mock-api-secret';
  }

  generateToken(roomName, participantIdentity) {
    // Mock implementation for testing
    console.log('Generating mock token for:', { roomName, participantIdentity });
    return 'mock-token-' + Date.now();
  }

  async createRoom(roomName) {
    // Mock implementation for testing
    console.log('Creating mock room:', roomName);
    return { roomName };
  }

  async listParticipants(roomName) {
    // Mock implementation for testing
    console.log('Listing mock participants for room:', roomName);
    return [];
  }
}