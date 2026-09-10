-- ==============================================================================
-- 1. สร้างตาราง books (รายการหนังสือ E-book)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.books (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  cover_url TEXT,
  file_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 2. สร้างตาราง orders (คำสั่งซื้อของลูกค้า)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id BIGINT NOT NULL REFERENCES public.books(id) ON DELETE RESTRICT,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'CANCELLED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- สร้าง Index เพื่อเพิ่มความเร็วในการค้นหา Order และ Book
CREATE INDEX IF NOT EXISTS idx_orders_book_id ON public.orders(book_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON public.orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

-- ==============================================================================
-- 3. ตั้งค่า Row Level Security (RLS) เพื่อความปลอดภัย
-- ==============================================================================

-- เปิดใช้งาน RLS สำหรับตาราง books
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

-- ลบนโยบายเดิมถ้ามี (ป้องกันการ duplicate เมื่อรันซ้ำ)
DROP POLICY IF EXISTS "Allow public read-only access to books" ON public.books;

-- ลูกค้าและทุกคนสามารถเรียกดูรายการหนังสือได้ (SELECT เท่านั้น)
CREATE POLICY "Allow public read-only access to books"
ON public.books
FOR SELECT
USING (true);

-- ไม่อนุญาตให้ INSERT/UPDATE/DELETE จากหน้าบ้าน (แก้ไขได้เฉพาะ Admin / Dashboard ของ Supabase)


-- เปิดใช้งาน RLS สำหรับตาราง orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public to create orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public to view order by ID" ON public.orders;

-- ลูกค้าสามารถสร้างคำสั่งซื้อได้ผ่านหน้าเว็บ (กำหนดให้เริ่มต้นที่สถานะ PENDING เท่านั้น)
CREATE POLICY "Allow public to create orders"
ON public.orders
FOR INSERT
WITH CHECK (status = 'PENDING');

-- ลูกค้าสามารถอ่านข้อมูลคำสั่งซื้อเพื่อติดตามผล (หน้า /track หรือ Thank You page)
CREATE POLICY "Allow public to view order by ID"
ON public.orders
FOR SELECT
USING (true);

-- นโยบายสำหรับการจำลองการชำระเงิน (Mock Payment) ให้เปลี่ยนสถานะเป็น 'PAID' ได้
DROP POLICY IF EXISTS "Allow updating order status to PAID" ON public.orders;
CREATE POLICY "Allow updating order status to PAID"
ON public.orders
FOR UPDATE
USING (true)
WITH CHECK (status IN ('PAID', 'CANCELLED'));



-- ==============================================================================
-- 4. ข้อมูลจำลอง (Mock Data) สำหรับตาราง books (3 เล่ม)
-- ==============================================================================
INSERT INTO public.books (title, description, price, cover_url, file_path)
VALUES
  (
    'Next.js 15 & React 19 Fullstack Mastery',
    'คู่มือพัฒนาเว็บแอปพลิเคชันสมัยใหม่ด้วย Next.js App Router, Server Actions และ TypeScript ครบวงจรตั้งแต่เริ่มต้นจน Deploy ขึ้น Vercel',
    490.00,
    'https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=800&auto=format&fit=crop',
    'ebooks/nextjs-fullstack-mastery.pdf'
  ),
  (
    'The Art of Vibe Coding: AI-Driven Development',
    'เทคนิคการเขียนโค้ดและส่งมอบซอฟต์แวร์ด้วย AI Agents และ LLMs อย่างมีประสิทธิภาพ ก้าวสู่ยุคใหม่ของนักพัฒนาที่มีพลังในการสร้างสรรค์ไร้ขีดจำกัด',
    390.00,
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop',
    'ebooks/vibe-coding-guide.pdf'
  ),
  (
    'Mastering Supabase & PostgreSQL Architecture',
    'เจาะลึกการออกแบบฐานข้อมูล, Row Level Security (RLS), Realtime และ Edge Functions เพื่อสร้างระบบหลังบ้านที่ปลอดภัยและรองรับการขยายตัวได้ดีเยี่ยม',
    550.00,
    'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?q=80&w=800&auto=format&fit=crop',
    'ebooks/mastering-supabase.pdf'
  )
ON CONFLICT DO NOTHING;
