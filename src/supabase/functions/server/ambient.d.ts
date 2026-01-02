// Ambient declarations for Deno/npm: imports used in the server files
declare const Deno: any;

// Generic declaration to satisfy imports using the "npm:" specifier in Deno
declare module 'npm:*' {
  const mod: any;
  export = mod;
}

// Precise-ish declarations to satisfy named imports used in the server code.
declare module 'npm:hono' {
  // Minimal Hono shape used by the project
  export class Hono {
    constructor();
    use(path: string, middleware: any): any;
    get(path: string, handler: any): any;
    post(path: string, handler: any): any;
    fetch: any;
    handle?: any;
  }
}

declare module 'npm:hono/cors' {
  export function cors(options?: any): any;
}

declare module 'npm:hono/logger' {
  export function logger(logger?: any): any;
}

declare module 'npm:@supabase/supabase-js*' {
  export function createClient(url: string, key: string): any;
}

