import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

/**
 * Cliente único de Supabase para el frontend.
 * Se inicializa una sola vez con la anon key.
 */
@Injectable({
  providedIn: 'root',
})
export class SupabaseService {

  private readonly _client: SupabaseClient;

  constructor() {
    this._client = createClient(
      environment.supabaseUrl,
      environment.supabaseAnonKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storageKey: 'cda.auth',
        },
      },
    );
  }

  get client(): SupabaseClient {
    return this._client;
  }
}