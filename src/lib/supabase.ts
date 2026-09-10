import { createClient, SupabaseClient } from '@supabase/supabase-js';

// URL และ Public Anon Key สำหรับฝั่ง Browser / Client
const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      '⚠️ [Supabase] ไม่พบค่า NEXT_PUBLIC_SUPABASE_URL หรือ NEXT_PUBLIC_SUPABASE_ANON_KEY ใน .env.local'
    );
  }
}

/**
 * 1. Client-side / Public Supabase Client
 * ใช้สำหรับฝั่ง Browser (Client Components เช่น 'use client')
 * ทำงานภายใต้สิทธิ์ Anon Key และถูกควบคุมด้วย Row Level Security (RLS)
 */
export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

/**
 * ฟังก์ชันสร้าง Client ใหม่สำหรับ Browser
 */
export function createBrowserClient(): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('กรุณากำหนดค่า NEXT_PUBLIC_SUPABASE_URL และ NEXT_PUBLIC_SUPABASE_ANON_KEY ใน .env.local');
  }
  return createClient(supabaseUrl, supabaseAnonKey);
}

/**
 * 2. Server-side Admin Client (Service Role)
 * ⚠️ ข้อกำหนดความปลอดภัย:
 * - ใช้งานเฉพาะใน Server Components, Server Actions, Route Handlers เท่านั้น
 * - มีระบบป้องกันการเรียกใช้งานบน Browser โดยเด็ดขาด (จะ throw Error ทันที)
 * - ใช้สิทธิ์ SUPABASE_SERVICE_ROLE_KEY ซึ่งสามารถ bypass RLS เพื่อจัดการข้อมูล Orders, อัปเดตสถานะการจ่ายเงิน
 */
export function createServerAdminClient(): SupabaseClient {
  // ตรวจสอบความปลอดภัย: ป้องกันไม่ให้รันใน Browser
  if (typeof window !== 'undefined') {
    throw new Error(
      '🚨 SECURITY ALERT: ห้ามเรียกใช้งาน createServerAdminClient บน Browser เด็ดขาด! Secret Key ต้องอยู่ฝั่ง Server เท่านั้น'
    );
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'กรุณากำหนดค่า SUPABASE_SERVICE_ROLE_KEY ใน .env.local สำหรับการใช้งาน Server Admin Client'
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Alias สำหรับ backward compatibility
export const createAdminClient = createServerAdminClient;
export const createSupabaseClient = createBrowserClient;
