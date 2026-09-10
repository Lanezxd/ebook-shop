'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  AlertTriangle,
  Clock,
  QrCode,
  CheckCircle2,
  Copy,
  BookOpen,
  ArrowRight,
  Mail,
  Loader2,
  ShieldAlert,
  Info,
} from 'lucide-react';

interface OrderDetail {
  id: string;
  book_id: number;
  customer_name: string;
  customer_email: string;
  amount: number;
  status: 'PENDING' | 'PAID' | 'CANCELLED';
  created_at: string;
  books?: {
    title: string;
    cover_url: string;
    price: number;
  };
}

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.orderId as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ดึงข้อมูลคำสั่งซื้อจาก Supabase
  useEffect(() => {
    async function loadOrder() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*, books(*)')
          .eq('id', orderId)
          .maybeSingle();

        if (data && !error) {
          setOrder(data);
          // หากสถานะเป็น PAID อยู่แล้ว ให้ redirect ไปหน้าติดตามผลได้เลย
          if (data.status === 'PAID') {
            router.push(`/track?orderId=${orderId}`);
          }
        } else {
          // ข้อมูลจำลองสำหรับทดสอบ Preview
          setOrder({
            id: orderId,
            book_id: 1,
            customer_name: 'ผู้สั่งซื้อ E-book (จำลอง)',
            customer_email: 'customer@example.com',
            amount: 490,
            status: 'PENDING',
            created_at: new Date().toISOString(),
            books: {
              title: 'Next.js 15 & React 19 Fullstack Mastery',
              cover_url:
                'https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=800&auto=format&fit=crop',
              price: 490,
            },
          });
        }
      } catch (err) {
        console.error('Error fetching order:', err);
      } finally {
        setLoading(false);
      }
    }

    if (orderId) {
      loadOrder();
    }
  }, [orderId, router]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /**
   * ฟังก์ชันจำลองการชำระเงินสำเร็จ (handleMockPay)
   * 1. อัปเดตสถานะคำสั่งซื้อจาก 'PENDING' เป็น 'PAID' ในฐานข้อมูล Supabase พร้อม catch error
   * 2. เรียก API หลังบ้าน (/api/send-email) เพื่อตรวจสอบสถานะและส่งอีเมลผ่าน Resend
   * 3. นำทางผู้ใช้ไปยังหน้าติดตามผล (/track?orderId=...&email=...)
   */
  const handleMockPay = async () => {
    setIsProcessing(true);
    setErrorMessage(null);

    console.log('\n========================================');
    console.log('[handleMockPay] เริ่มต้นจำลองชำระเงินสำหรับ Order ID:', orderId);
    console.log('========================================');

    try {
      // 1. อัปเดตสถานะใน Supabase จาก 'PENDING' เป็น 'PAID'
      console.log('[handleMockPay] 1. กำลังอัปเดตสถานะใน Supabase เป็น PAID...');
      const { data: updateData, error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'PAID',
        })
        .eq('id', orderId)
        .select();

      console.log('[handleMockPay] ผลลัพธ์ Supabase update:', {
        data: updateData,
        error: updateError,
      });

      if (updateError) {
        console.error('[handleMockPay] ❌ Supabase update error:', updateError);
        setErrorMessage(`เกิดข้อผิดพลาดจาก Supabase: ${updateError.message}`);
        setIsProcessing(false);
        return;
      }

      if (!updateData || updateData.length === 0) {
        console.warn(
          '[handleMockPay] ⚠️ อัปเดตสำเร็จ 0 รายการ (Row Level Security ใน Supabase อาจบล็อกคำสั่ง UPDATE ของ Anon Key)'
        );
      } else {
        console.log('[handleMockPay] ✓ อัปเดตสถานะใน Supabase เป็น PAID สำเร็จ');
      }

      // 2. เรียก API หลังบ้าน (/api/send-email) เพื่อตรวจสอบสถานะ PAID และส่งอีเมลแจ้งลูกค้าผ่าน Resend
      console.log('[handleMockPay] 2. กำลังเรียก API /api/send-email...');
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: orderId,
        }),
      });

      const result = await response.json();
      console.log('[handleMockPay] ผลการตอบกลับจาก /api/send-email:', result);

      if (!response.ok || !result.success) {
        const errorText = result.error || 'เกิดข้อผิดพลาดในการส่งอีเมล';
        console.error('[handleMockPay] ❌ Server API returned error:', errorText);
        setErrorMessage(errorText);
        setIsProcessing(false);
        return;
      }

      // 3. เมื่อสำเร็จ นำทางผู้ใช้ไปยังหน้าติดตามผล (/track?orderId=...&email=...) เพื่อความปลอดภัยแบบ 2-Factor
      console.log('[handleMockPay] 3. สำเร็จ! กำลังนำทางไปหน้า /track...');
      const customerEmailParam = encodeURIComponent(order?.customer_email || '');
      router.push(`/track?orderId=${orderId}&email=${customerEmailParam}`);
    } catch (err: any) {
      console.error('[handleMockPay] ❌ Catch Exception:', err);
      setErrorMessage(`เกิดข้อผิดพลาด: ${err?.message || err}`);
      setIsProcessing(false);
    }
  };

  const handleSimulatePaymentSuccess = handleMockPay;

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 text-slate-600">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-sm font-medium">กำลังเตรียมหน้าชำระเงินจำลอง...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-blue-600">
            <BookOpen className="w-5 h-5" />
            <span>Vibe E-Book Store</span>
          </Link>
          <Link
            href="/track"
            className="text-xs sm:text-sm font-medium text-slate-600 hover:text-blue-600 transition"
          >
            ติดตามคำสั่งซื้อ
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 pt-6 sm:pt-8">
        {/* ========================================================================= */}
        {/* 🚨 ป้ายแจ้งเตือน DEMO ONLY ตัวใหญ่และมองเห็นได้ชัดเจนมากตามข้อกำหนด */}
        {/* ========================================================================= */}
        <div className="mb-8 rounded-3xl bg-rose-600 text-white p-5 sm:p-7 shadow-xl shadow-rose-600/20 border-4 border-rose-500 animate-pulse">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
            </div>
            <div>
              <span className="inline-block px-3 py-0.5 rounded-full text-xs font-black bg-white text-rose-700 uppercase tracking-wider mb-1">
                DEMO PAYMENT ONLY
              </span>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white leading-tight">
                DEMO ONLY (ระบบจำลอง ห้ามโอนเงินจริง)
              </h1>
              <p className="text-xs sm:text-sm text-rose-100 mt-1 font-medium leading-relaxed">
                ระบบนี้เป็นเพียงแบบจำลองสำหรับทดสอบ Flow หน้าบ้านเท่านั้น <strong>ห้ามทำการโอนเงินหรือตัดเงินจริงเด็ดขาด</strong> กรุณากดปุ่ม <em>"จำลองชำระเงินสำเร็จ"</em> ด้านล่างเพื่อทดสอบระบบ
              </p>
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-6 p-5 rounded-3xl bg-rose-50 border-2 border-rose-200 text-rose-900 text-sm shadow-sm space-y-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
              <div className="flex-1 font-medium leading-relaxed">{errorMessage}</div>
            </div>
            <div className="pt-2 border-t border-rose-200/60 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-rose-600 font-normal">
                * ตรวจสอบข้อมูล Response / Error จาก Resend อย่างละเอียดได้ที่หน้าต่าง Terminal
              </span>
              <Link
                href={`/track?orderId=${orderId}&email=${encodeURIComponent(order?.customer_email || '')}`}
                className="font-bold text-blue-600 hover:text-blue-700 underline flex items-center gap-1"
              >
                <span>ไปหน้าติดตามผลทันที</span> →
              </Link>
            </div>
          </div>
        )}

        {/* Card แสดง QR Code จำลองและสรุปยอดเงิน */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-sm">
          {/* Header ยอดเงิน & สถานะ */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 mb-2">
                <Clock className="w-3.5 h-3.5" /> สถานะ: รอการชำระเงิน (PENDING)
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                จำลองการชำระเงินค่า E-book
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                {order?.books?.title || 'รายการหนังสือ E-book'}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">ยอดที่ต้องชำระ</span>
              <span className="text-3xl sm:text-4xl font-black text-blue-600">
                ฿{Number(order?.amount || 0).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Reference Order ID */}
          <div className="my-5 p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">หมายเลขคำสั่งซื้อ:</span>
              <code className="font-mono font-semibold text-slate-800">{orderId}</code>
            </div>
            <button
              onClick={() => copyToClipboard(orderId)}
              className="inline-flex items-center gap-1 text-slate-600 hover:text-blue-600 font-medium transition cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copied ? 'คัดลอกแล้ว!' : 'คัดลอกรหัส'}</span>
            </button>
          </div>

          {/* QR Code จำลอง & Mock Payment Panel */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center pt-2">
            {/* กล่องแสดง QR Code จำลอง */}
            <div className="md:col-span-6 flex flex-col items-center text-center p-6 bg-slate-50/80 rounded-3xl border border-slate-200 relative overflow-hidden">
              {/* ลายน้ำจำลองทับบน QR Code เพื่อความปลอดภัย 100% */}
              <div className="relative w-52 h-52 bg-white p-3 rounded-2xl border-2 border-dashed border-rose-300 shadow-sm flex items-center justify-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=DEMO-ONLY-DO-NOT-PAY-${orderId}`}
                  alt="QR Code จำลอง (ห้ามโอนจริง)"
                  className="w-full h-full object-contain opacity-75 filter grayscale"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-rose-900/20 backdrop-blur-[1px] rounded-xl p-2 text-center pointer-events-none">
                  <span className="text-rose-700 font-black text-xs bg-white/95 px-2.5 py-1 rounded-md shadow-md border border-rose-200">
                    🚫 MOCK QR CODE
                  </span>
                  <span className="text-rose-800 font-bold text-[10px] mt-1 bg-white/90 px-2 py-0.5 rounded">
                    ห้ามโอนเงินจริง
                  </span>
                </div>
              </div>

              <span className="text-xs font-semibold text-slate-600 mt-4 flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-rose-500" /> รูปแบบจำลอง Thai QR Payment
              </span>
              <p className="text-[11px] text-slate-400 mt-1">
                สำหรับใช้ทดสอบการกดปุ่มด้านขวามือเท่านั้น
              </p>
            </div>

            {/* กล่องควบคุมการจำลองการชำระเงิน */}
            <div className="md:col-span-6 space-y-4 text-xs sm:text-sm">
              <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-100">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 block mb-1">
                  อีเมลที่จะได้รับไฟล์ E-book
                </span>
                <p className="font-semibold text-slate-900 flex items-center gap-1.5 text-sm">
                  <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>{order?.customer_email}</span>
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-slate-600">
                <h4 className="font-bold text-slate-900 text-xs">
                  สิ่งที่ระบบจะทำงานอัตโนมัติเมื่อกดปุ่ม:
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-600 list-disc list-inside">
                  <li>เปลี่ยนสถานะใน Supabase เป็น <span className="font-bold text-emerald-600">PAID</span></li>
                  <li>ส่งสัญญาณหา Resend API เพื่อส่งอีเมลให้ลูกค้า</li>
                  <li>นำทางอัตโนมัติไปยังหน้า <code className="text-blue-600 font-mono">/track?orderId=...</code></li>
                </ul>
              </div>

              {/* ========================================================================= */}
              {/* 🔘 ปุ่ม "จำลองชำระเงินสำเร็จ" */}
              {/* ========================================================================= */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSimulatePaymentSuccess}
                  disabled={isProcessing}
                  className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] disabled:bg-emerald-400 text-white font-bold text-base shadow-lg shadow-emerald-600/25 transition flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>กำลังอัปเดตสถานะและส่งอีเมล...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      <span>จำลองชำระเงินสำเร็จ</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </button>
                <p className="text-[11px] text-center text-slate-400 mt-2">
                  * กดปุ่มนี้เพื่อเปลี่ยนสถานะเป็น PAID และไปยังหน้าติดตามผลทันที
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
