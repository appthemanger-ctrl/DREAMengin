export const generateLiveKitToken = async (roomName) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/livekit/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          roomName, 
          identity: `user-${Date.now()}` 
        })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      
      return data.token;
    } catch (error) {
      console.error('Error generating LiveKit token:', error);
      throw error;
    }
  };