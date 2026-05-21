'use client';

import { registerCartridges } from '@/lib/gameengin/registerCartridges';
import { useEffect } from 'react';

export default function CartridgeRegistryBootstrap( ){
  useEffect(() => {
    registerCartridges();
  }, []);

  return null;
}