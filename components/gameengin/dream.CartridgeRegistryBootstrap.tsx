'use client';

import { useEffect } from 'react';
import { registerCartridges } from '@/lib/gameengin/registerCartridges';

export default function CartridgeRegistryBootstrap( {
  useEffect(() => {
    registerCartridges();
  }, []);

  return null;
}
