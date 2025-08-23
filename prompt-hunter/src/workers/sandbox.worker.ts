// 'use strict' in worker scope
export {}; // ensure module

type Msg = { code: string; input: string };

self.onmessage = async (ev: MessageEvent<Msg>) => {
  const { code, input } = ev.data;
  try {
    // Disable network/DOM-related globals
    // @ts-ignore
    (self as any).fetch = undefined;
    // @ts-ignore
    ;(self as any).XMLHttpRequest = undefined;
    // @ts-ignore
    ;(self as any).WebSocket = undefined;
    // @ts-ignore
    ;(self as any).importScripts = undefined;
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
      // @ts-ignore
      (self as unknown as Worker).postMessage({ ok: result });
    } else {
      // @ts-ignore
      (self as unknown as Worker).postMessage({ ok: false, error: 'Non-boolean result' });
    }
  } catch (e: any) {
    // @ts-ignore
    (self as unknown as Worker).postMessage({ ok: false, error: String(e?.message || e) });
  }
};


