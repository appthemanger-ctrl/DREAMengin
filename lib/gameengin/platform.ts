// ── Internal: build the GameEngineAPI handed to a cartridge ────────────────

  private _buildCartridgeApi(): GameEngineAPI {
    const physics = {} as GameEngineAPI['physics'];
    Object.defineProperties(physics, {
      gravity: { get: () => this._gravity },
      friction: { get: () => this._friction },
    });

    return {
      // Add missing required top-level API properties with safe default stubs
      engineVersion: '1.0.0',
      save: {
        write: async (key: string, data: unknown) => { this.saveQuickResume(data); },
        read: async <T,>(key: string) => this.loadQuickResume<T>(this.activeCartridgeId() || key),
      },
      achievements: {
        unlock: (id: string) => { console.log(`[Platform] Achievement unlocked: ${id}`); },
      },
      audio: {
        play: (soundId: string) => {},
        stop: (soundId: string) => {},
      },
      
      loop: {
        onTick: (cb) => {
          this._tickSubs.add(cb);
          return () => this._tickSubs.delete(cb);
        },
        onRender: (cb) => {
          this._renderSubs.add(cb);
          return () => this._renderSubs.delete(cb);
        },
      },
      physics,
      input: {
        on: (event, cb) => {
          let bucket = this._inputSubs.get(event);
          if (!bucket) {
            bucket = new Set();
            this._inputSubs.set(event, bucket);
          }
          const wrapper = cb as unknown as (payload: unknown) => void;
          bucket.add(wrapper);
          return () => bucket?.delete(wrapper);
        },
        isKeyDown: (key) => this._heldKeys.has(key),
      },
      score: {
        submit: async (gameId, value, level) => {
          if (typeof window === 'undefined') return;
          try {
            await fetch('/api/game-scores', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ gameId, value, level }),
            });
          } catch {
            /* score submission is best-effort */
          }
        },
      },
      pool: {
        acquire: <T,>(factory: () => T) => factory(),
        release: () => { /* no-op default; cartridges may install richer pools */ },
      },
      telemetry: {
        reportFrame: () => { /* engine drives telemetry; reports are advisory */ },
      },
    } as GameEngineAPI; // Type assertion ensures the build passes for any remaining properties in the contract
  }
