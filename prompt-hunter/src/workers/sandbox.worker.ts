// 'use strict' in worker scope
export {}; // ensure module

type Msg = { code: string; input: string };

self.onmessage = async (ev: MessageEvent<Msg>) => {
  const { code, input } = ev.data;
  try {
    // Disable network/DOM-related globals
    // @ts-expect-error Disabling worker globals
    (self as DedicatedWorkerGlobalScope & typeof globalThis).fetch = undefined;
    // @ts-expect-error Disabling worker globals
    ;(self as DedicatedWorkerGlobalScope & typeof globalThis).XMLHttpRequest = undefined;
    // @ts-expect-error Disabling worker globals
    ;(self as DedicatedWorkerGlobalScope & typeof globalThis).WebSocket = undefined;
    // @ts-expect-error Disabling worker globals
    ;(self as DedicatedWorkerGlobalScope & typeof globalThis).importScripts = undefined;
    const runner = new Function(
      'input',
      `'use strict';
      // Execute provided code. It may either:
      // 1) Define function validate(input): boolean, or
      // 2) Immediately return a boolean (IIFE style)
      let __result;
      try {
        // Capture boolean-returning IIFE outputs
        __result = (function(){ ${code} })();
      } catch (_) {
        // Ignore runtime during pre-exec; a validate function may be defined instead
      }
      if (typeof validate === 'function') {
        try { return !!validate(input); } catch (_) { return false; }
      }
      if (typeof __result === 'boolean') {
        return __result;
      }
      return false;`
    );
    const result = await Promise.race([
      Promise.resolve().then(() => runner(input)),
      new Promise((_, rej) => setTimeout(() => rej(new Error('Timeout')), 500)),
    ]);
    // Only booleans pass
    if (typeof result === 'boolean') {
      // @ts-expect-error Worker messaging
      (self as DedicatedWorkerGlobalScope).postMessage({ ok: result });
    } else {
      // @ts-expect-error Worker messaging
      (self as DedicatedWorkerGlobalScope).postMessage({ ok: false, error: 'Non-boolean result' });
    }
  } catch (e: unknown) {
    // @ts-expect-error Worker messaging
    (self as DedicatedWorkerGlobalScope).postMessage({ ok: false, error: String((e as Error)?.message || e) });
  }
};


