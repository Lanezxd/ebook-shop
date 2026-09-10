import { NextRequest, NextResponse } from 'next/server';
import { supabase, createServerAdminClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const token = searchParams.get('token');

    if (!orderId || !token) {
      return NextResponse.json(
        { error: 'Invalid download parameters' },
        { status: 400 }
      );
    }

    // 1. ตรวจสอบความถูกต้องและวันหมดอายุของ Token
    try {
      const decoded = Buffer.from(token, 'base64url').toString('utf-8');
      const [tokenOrderId, expiryStr] = decoded.split(':');
      const expiryTimestamp = Number(expiryStr);

      if (tokenOrderId !== orderId) {
        return NextResponse.json({ error: 'Token mismatch' }, { status: 403 });
      }

      if (Date.now() > expiryTimestamp) {
        return NextResponse.json(
          {
            error: 'ลิงก์ดาวน์โหลดนี้หมดอายุแล้ว (เกิน 24 ชม.) กรุณาเข้าสู่หน้า /track เพื่อรับลิงก์ใหม่',
          },
          { status: 410 }
        );
      }
    } catch {
      return NextResponse.json({ error: 'Invalid download token' }, { status: 403 });
    }

    // 2. ตรวจสอบสถานะคำสั่งซื้อจาก Supabase
    let db = supabase;
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        db = createServerAdminClient();
      } catch (err) {
        console.warn('Fallback to standard client:', err);
      }
    }

    const { data: order, error } = await db
      .from('orders')
      .select('*, books(*)')
      .eq('id', orderId)
      .maybeSingle();

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.status !== 'PAID') {
      return NextResponse.json(
        { error: 'Order is not marked as PAID' },
        { status: 403 }
      );
    }

    // 3. ส่งต่อ (Redirect) ไปยังที่อยู่ไฟล์จริงใน Storage
    const filePath = order.books?.file_path || 'ebooks/fullstack-mastery.pdf';
    const storageFileUrl = `https://zosrhztpoxvyumbyebjc.supabase.co/storage/v1/object/public/${filePath}`;

    return NextResponse.redirect(storageFileUrl);
  } catch (err: any) {
    console.error('Download route error:', err);
    return NextResponse.json(
      { error: err?.message || 'Download error' },
      { status: 500 }
    );
  }
}
