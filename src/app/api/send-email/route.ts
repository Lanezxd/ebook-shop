import { NextRequest, NextResponse } from 'next/server';
import { supabase, createServerAdminClient } from '@/lib/supabase';
import { Resend } from 'resend';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId } = body;

    console.log('\n========================================');
    console.log('[API /api/send-email] Received request for orderId:', orderId);
    console.log('========================================');

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'กรุณาระบุ orderId' },
        { status: 400 }
      );
    }

    // 1. ตรวจสอบสถานะโดยใช้ service_role_key (ถ้ามี) หรือ supabase ปกติ
    let db = supabase;
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        db = createServerAdminClient();
        console.log('[API /api/send-email] Using Supabase Admin Client (Service Role)');
      } catch (err) {
        console.warn('[API /api/send-email] Fallback to standard Supabase client:', err);
      }
    } else {
      console.log('[API /api/send-email] Using Public Anon Supabase Client (SUPABASE_SERVICE_ROLE_KEY is not set)');
    }

    // ดึงข้อมูลคำสั่งซื้อ
    const { data: order, error: orderError } = await db
      .from('orders')
      .select('*, books(*)')
      .eq('id', orderId)
      .maybeSingle();

    if (orderError || !order) {
      console.error('[API /api/send-email] Order query error:', orderError);
      return NextResponse.json(
        { success: false, error: 'ไม่พบข้อมูลคำสั่งซื้อในระบบ' },
        { status: 404 }
      );
    }

    console.log('[API /api/send-email] Found order in database. Current status:', order.status);

    // ตรวจสอบว่าสถานะเป็น 'PAID' หรือไม่
    if (order.status !== 'PAID') {
      // พยายามอัปเดตสถานะให้เป็น 'PAID' ผ่าน Server
      console.log('[API /api/send-email] Order status is not PAID. Attempting to update to PAID via server...');
      const { data: updateRes, error: updateErr } = await db
        .from('orders')
        .update({ status: 'PAID' })
        .eq('id', orderId)
        .select();

      console.log('[API /api/send-email] Server update attempt result:', { updateRes, updateErr });

      if (updateErr || !updateRes || updateRes.length === 0) {
        console.error('[API /api/send-email] ❌ Failed to update status to PAID.');
        console.error('สาเหตุ: ตาราง orders ใน Supabase ติด RLS (Row Level Security) ไม่อนุญาตให้ UPDATE ผ่าน Anon Key');
        console.error('วิธีแก้: รันคำสั่ง CREATE POLICY สำหรับ UPDATE ใน Supabase SQL Editor หรือใส่ SUPABASE_SERVICE_ROLE_KEY ใน .env.local');

        return NextResponse.json(
          {
            success: false,
            error: `สถานะคำสั่งซื้อยังเป็น 'PENDING' และไม่สามารถเปลี่ยนเป็น 'PAID' ได้ เนื่องจากตาราง orders ใน Supabase ติดสิทธิ์ RLS (กรุณาเพิ่มนโยบาย UPDATE ใน Supabase SQL Editor หรือใส่ SUPABASE_SERVICE_ROLE_KEY ใน .env.local)`,
            status: order.status,
          },
          { status: 400 }
        );
      } else {
        order.status = 'PAID';
        console.log('[API /api/send-email] ✓ Successfully updated order status to PAID');
      }
    }

    // 2. สร้าง Temporary Download Link (24 ชั่วโมง)
    const expiryTimestamp = Date.now() + 24 * 60 * 60 * 1000;
    const downloadToken = Buffer.from(`${order.id}:${expiryTimestamp}`).toString('base64url');
    
    const origin =
      request.headers.get('origin') ||
      request.nextUrl.origin ||
      'http://localhost:3000';
    const temporaryDownloadLink = `${origin}/api/download?orderId=${order.id}&token=${downloadToken}`;

    const bookTitle = order.books?.title || 'หนังสือ E-book สำหรับนักพัฒนา';
    const customerName = order.customer_name || 'ลูกค้าผู้มีอุปการคุณ';
    const customerEmail = order.customer_email;
    const amount = Number(order.amount).toLocaleString();

    // 3. ใช้ Resend ส่งอีเมลยืนยันคำสั่งซื้อ
    console.log('[API /api/send-email] Preparing Resend email to:', customerEmail);

    if (!process.env.RESEND_API_KEY) {
      console.warn('[API /api/send-email] ⚠️ RESEND_API_KEY is not configured in .env.local');
      return NextResponse.json(
        {
          success: false,
          error: 'ไม่พบคีย์ RESEND_API_KEY ในไฟล์ .env.local',
        },
        { status: 500 }
      );
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    console.log('[API /api/send-email] Sending email via resend.emails.send()...');

    const emailResponse = await resend.emails.send({
      from: 'E-Book Store <onboarding@resend.dev>',
      to: customerEmail,
      subject: `🎉 [E-Book Store] ลิงก์ดาวน์โหลดหนังสือ: ${bookTitle}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
          <div style="background-color: #ffffff; border-radius: 16px; padding: 32px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
            
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #2563eb; font-size: 24px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">E-Book Store</h1>
              <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">คลังหนังสือดิจิทัลสำหรับนักพัฒนา</p>
            </div>

            <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 14px; text-align: center; margin-bottom: 24px;">
              <span style="color: #065f46; font-size: 15px; font-weight: bold;">
                ✓ ยืนยันการชำระเงินสำเร็จ (PAID)
              </span>
              <div style="color: #047857; font-size: 12px; margin-top: 4px;">
                ตรวจสอบสถานะโดยระบบความปลอดภัยเรียบร้อยแล้ว
              </div>
            </div>

            <p style="font-size: 15px; color: #1e293b; line-height: 1.6;">
              สวัสดีคุณ <strong>${customerName}</strong>,
            </p>
            <p style="font-size: 14px; color: #475569; line-height: 1.6;">
              ขอขอบคุณสำหรับการสั่งซื้อหนังสือ <strong>${bookTitle}</strong> ทางเราได้จัดเตรียมไฟล์ฉบับเต็มไว้ให้คุณเรียบร้อยแล้ว คุณสามารถคลิกปุ่มด้านล่างเพื่อดาวน์โหลดได้ทันที:
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${temporaryDownloadLink}" 
                 target="_blank" 
                 style="background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #ffffff; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);">
                📥 ดาวน์โหลด E-book (PDF)
              </a>
              <p style="color: #94a3b8; font-size: 11px; margin-top: 10px;">
                * ลิงก์ดาวน์โหลดนี้มีอายุ 24 ชั่วโมง เพื่อความปลอดภัยของข้อมูล
              </p>
            </div>

            <div style="background-color: #f1f5f9; border-radius: 12px; padding: 18px; margin-bottom: 20px; font-size: 13px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #64748b;">รหัสคำสั่งซื้อ (Order ID):</span>
                <strong style="color: #0f172a; font-family: monospace;">${order.id}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #64748b;">รายการสินค้า:</span>
                <strong style="color: #0f172a;">${bookTitle}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #64748b;">ยอดเงินที่ชำระ:</span>
                <strong style="color: #16a34a; font-size: 14px;">฿${amount}</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #64748b;">สถานะคำสั่งซื้อ:</span>
                <span style="color: #059669; font-weight: bold;">PAID (ชำระเงินเรียบร้อย)</span>
              </div>
            </div>

            <p style="font-size: 12px; color: #64748b; text-align: center; margin-top: 24px; line-height: 1.5;">
              หากลิงก์หมดอายุหรือไม่สามารถดาวน์โหลดได้ สามารถนำ Order ID และ Email ไปตรวจสอบที่หน้า <a href="${origin}/track" style="color: #2563eb; text-decoration: underline;">ติดตามคำสั่งซื้อ</a> ได้ตลอด 24 ชม.
            </p>
          </div>
        </div>
      `,
    });

    // -----------------------------------------------------------------
    // พิมพ์ค่า response และ error จาก resend.emails.send() ออกมาที่ Terminal ตามข้อกำหนด
    // -----------------------------------------------------------------
    console.log('----------------------------------------');
    console.log('[Resend Terminal Log] Response Object:');
    console.log(JSON.stringify(emailResponse, null, 2));
    console.log('----------------------------------------');

    if (emailResponse.error) {
      console.error('❌ [Resend Error]:', emailResponse.error);
      const isDomainRestriction =
        emailResponse.error.message?.includes('testing emails') ||
        emailResponse.error.message?.includes('domain') ||
        emailResponse.error.name === 'validation_error';

      const userFriendlyMessage = isDomainRestriction
        ? `[Resend Domain Restriction]: ไม่สามารถส่งอีเมลไปยัง "${customerEmail}" ได้ เนื่องจากใช้บัญชี Resend แบบทดสอบ (Free/Sandbox) ซึ่งอนุญาตให้ส่งหาเฉพาะอีเมลเจ้าของบัญชี Resend เท่านั้น หรือต้องยืนยัน Domain ใน Resend Dashboard ก่อน (Error: ${emailResponse.error.message})`
        : `[Resend Error]: ${emailResponse.error.message}`;

      console.error('[Resend Error Friendly Notice]:', userFriendlyMessage);

      // ส่ง Error Message กลับไปแจ้งหน้าบ้านอย่างชัดเจน
      return NextResponse.json(
        {
          success: false,
          error: userFriendlyMessage,
          resendError: emailResponse.error,
          isDomainRestriction,
          orderId: order.id,
          status: order.status,
        },
        { status: 422 }
      );
    }

    console.log('✓ [Resend Success]: Email sent successfully! Message ID:', emailResponse.data?.id);

    return NextResponse.json({
      success: true,
      message: 'ส่งอีเมลยืนยันคำสั่งซื้อสำเร็จ',
      orderId: order.id,
      customer_email: customerEmail,
      temporaryDownloadLink,
      emailResponse: emailResponse.data,
    });
  } catch (error: any) {
    console.error('❌ [API /api/send-email] Unhandled Exception:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
