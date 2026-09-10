import type { SupabaseClient, User } from '@supabase/supabase-js';

declare global {
	namespace App {
		interface Locals {
			user: User | null;
			supabase: SupabaseClient;
		}
	}
}

export {};
