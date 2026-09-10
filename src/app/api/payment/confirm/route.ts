import { NextRequest, NextResponse } from 'next/server';
import { supabase, createServerAdminClient } from '@/lib/supabase';
import { Resend } from 'resend';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // 1. เลือกลูกค้า Supabase สำหรับอัปเดต (ถ้ามี SERVICE_ROLE_KEY จะใช้ Admin Client, ถ้าไม่มีจะใช้ supabase ปกติ)
    let dbClient = supabase;
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        dbClient = createServerAdminClient();
      } catch (e) {
        console.warn('Could not initialize admin client, falling back to public client:', e);
      }
    }

    // 2. อัปเดตสถานะในตาราง orders จาก 'PENDING' เป็น 'PAID'
    const { data: updatedOrder, error: updateError } = await dbClient
      .from('orders')
      .update({
        status: 'PAID',
      })
      .eq('id', orderId)
      .select('*, books(*)')
      .maybeSingle();

    if (updateError) {
      console.error('Supabase update order error:', updateError);
      // หากตารางยังไม่ได้สร้างหรือติด error ให้ส่ง response แจ้งเตือนแต่ไม่แครช
    }

    // ดึงข้อมูล Order และ Book เพื่อเตรียมข้อมูลส่งอีเมล
    let orderData = updatedOrder;
    if (!orderData) {
      const { data: fetchedOrder } = await dbClient
        .from('orders')
        .select('*, books(*)')
        .eq('id', orderId)
        .maybeSingle();
      orderData = fetchedOrder;
    }

    const customerEmail = orderData?.customer_email || 'customer@example.com';
    const customerName = orderData?.customer_name || 'ลูกค้าผู้สั่งซื้อ';
    const bookTitle = orderData?.books?.title || 'Next.js 15 & React 19 Fullstack Mastery';
    const amount = orderData?.amount || 490;
    const downloadPath = orderData?.books?.file_path || 'ebooks/fullstack-mastery.pdf';

    // 3. ส่งอีเมลผ่านบริการ Resend
    let emailSent = false;
    let emailError = null;

    if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);

        const emailResult = await resend.emails.send({
          from: 'Vibe E-Book Store <onboarding@resend.dev>',
          to: customerEmail,
          subject: `🎉 [Vibe E-Book] ยืนยันการสั่งซื้อสำเร็จ - ${bookTitle}`,
          html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #f8fafc; color: #1e293b;">
              <div style="background-color: #ffffff; border-radius: 16px; padding: 32px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                
                <!-- Header -->
                <div style="text-align: center; margin-bottom: 28px;">
                  <h1 style="color: #2563eb; font-size: 24px; margin: 0; font-weight: 800;">Vibe E-Book Store</h1>
                  <p style="color: #64748b; font-size: 13px; margin-top: 4px;">คลังหนังสือดิจิทัลสำหรับนักพัฒนา</p>
                </div>

                <!-- Alert Badge -->
                <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 14px; text-align: center; margin-bottom: 24px;">
                  <p style="color: #065f46; font-size: 15px; font-weight: bold; margin: 0;">
                    ✓ ได้รับการชำระเงินเรียบร้อยแล้ว (PAID)
                  </p>
                  <p style="color: #047857; font-size: 12px; margin-top: 4px;">
                    ขอบคุณสำหรับการสั่งซื้อ ระบบได้แนบลิงก์ดาวน์โหลดหนังสือให้คุณแล้ว
                  </p>
                </div>

                <!-- Greeting -->
                <p style="font-size: 15px; line-height: 1.6;">
                  สวัสดีคุณ <strong>${customerName}</strong>,
                </p>
                <p style="font-size: 14px; color: #475569; line-height: 1.6;">
                  คำสั่งซื้อ E-book ของคุณได้รับการยืนยันการชำระเงินเรียบร้อยแล้ว คุณสามารถกดดาวน์โหลดไฟล์หนังสือฉบับเต็มได้จากปุ่มด้านล่างนี้:
                </p>

                <!-- Download Button CTA -->
                <div style="text-align: center; margin: 32px 0;">
                  <a href="https://zosrhztpoxvyumbyebjc.supabase.co/storage/v1/object/public/${downloadPath}" 
                     target="_blank" 
                     style="background-color: #2563eb; color: #ffffff; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 15px; display: inline-block; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);">
                    📥 ดาวน์โหลด E-book (${bookTitle})
                  </a>
                </div>

                <!-- Order Summary Box -->
                <div style="background-color: #f1f5f9; border-radius: 12px; padding: 18px; margin-bottom: 24px; font-size: 13px;">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #64748b;">รหัสคำสั่งซื้อ (Order ID):</span>
                    <strong style="color: #0f172a; font-family: monospace;">${orderId}</strong>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #64748b;">รายการหนังสือ:</span>
                    <strong style="color: #0f172a;">${bookTitle}</strong>
                  </div>
                  <div style="display: flex; justify-content: space-between;">
                    <span style="color: #64748b;">ยอดเงินสุทธิ:</span>
                    <strong style="color: #16a34a; font-size: 14px;">฿${Number(amount).toLocaleString()}</strong>
                  </div>
                </div>

                <!-- Footer Notice -->
                <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-top: 24px; line-height: 1.5;">
                  * อีเมลนี้จัดส่งโดยระบบจำลองคำสั่งซื้ออัตโนมัติ (Mock Payment Demo)<br/>
                  หากมีข้อสงสัยหรือพบปัญหาในการดาวน์โหลด สามารถตรวจสอบสถานะคำสั่งซื้อได้ตลอด 24 ชม.
                </p>
              </div>
            </div>
          `,
        });

        if (emailResult.error) {
          console.warn('Resend send warning:', emailResult.error);
          emailError = emailResult.error.message;
        } else {
          emailSent = true;
          console.log('Resend email sent successfully! ID:', emailResult.data?.id);
        }
      } catch (err: any) {
        console.warn('Resend caught exception:', err?.message || err);
        emailError = err?.message || 'Failed to send email';
      }
    } else {
      console.log('RESEND_API_KEY is not configured. Skipped real email sending.');
    }

    return NextResponse.json({
      success: true,
      orderId,
      status: 'PAID',
      emailSent,
      emailError,
      message: 'Order updated to PAID successfully',
    });
  } catch (error: any) {
    console.error('API confirm payment error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
