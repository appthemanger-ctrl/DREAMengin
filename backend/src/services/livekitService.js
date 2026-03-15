import { AccessToken } from 'livekit-server-sdk';

export default class LiveKitService {
  constructor() {
    this.apiKey = process.env.LIVEKIT_API_KEY ?? '';
    this.apiSecret = process.env.LIVEKIT_API_SECRET ?? '';
  }

  generateToken(roomName, participantIdentity) {
    if (!this.apiKey || !this.apiSecret) {
      throw new Error('LiveKit credentials not configured');
    }
    const at = new AccessToken(this.apiKey, this.apiSecret, {
      identity: participantIdentity,
    });
    at.addGrant({ roomJoin: true, room: roomName });
    return at.toJwt();
  }

  async createRoom(roomName) {
    if (!this.apiKey || !this.apiSecret) {
      throw new Error('LiveKit credentials not configured');
    }
    return { roomName };
  }

  async listParticipants(roomName) {
    if (!this.apiKey || !this.apiSecret) {
      throw new Error('LiveKit credentials not configured');
    }
    return [];
  }
}