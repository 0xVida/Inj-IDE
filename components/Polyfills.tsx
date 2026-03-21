"use client";

import { useEffect } from 'react';
import { Buffer } from 'buffer';
import process from 'process';

export function Polyfills() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.Buffer = window.Buffer || Buffer;
      window.process = window.process || process;
    }
  }, []);

  return null;
}
