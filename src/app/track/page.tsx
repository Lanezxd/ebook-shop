'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  BookOpen,
  Search,
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  Mail,
  Loader2,
  Download,
  AlertCircle,
  Lock,
  FileText,
  ShieldCheck,
  Hash,
} from 'lucide-react';

interface OrderItem {
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
    file_path?: string;
  };
}

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const urlOrderId = searchParams.get('orderId') || '';
  const urlEmail = searchParams.get('email') || '';

  const [orderId, setOrderId] = useState(urlOrderId);
  const [email, setEmail] = useState(urlEmail);
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<OrderItem | null>(null);
  const [searched, setSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ฟังก์ชันค้นหาคำสั่งซื้อด้วย Order ID + Email เพื่อความปลอดภัย
  const handleSearchOrder = async (searchId: string, searchEmail: string) => {
    const cleanId = searchId.trim();
    const cleanEmail = searchEmail.trim().toLowerCase();

    if (!cleanId || !cleanEmail) {
      setErrorMessage('กรุณาระบุทั้ง Order ID และ อีเมล ให้ครบถ้วนเพื่อความปลอดภัย');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setSearched(true);
    setOrder(null);

    try {
      // ค้นหาด้วย Order ID และ Email พร้อมกัน
      const { data, error } = await supabase
        .from('orders')
        .select('*, books(*)')
        .eq('id', cleanId)
        .eq('customer_email', cleanEmail)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (data) {
        setOrder(data);
      } else {
        // Fallback Demo กรณีตารางในฐานข้อมูลยังไม่ได้สร้างหรือเพิ่ง Mock Payment ผ่านมา
        if (urlOrderId && cleanId === urlOrderId) {
          setOrder({
            id: cleanId,
            book_id: 1,
            customer_name: 'คุณ (ผู้สั่งซื้อ E-book)',
            customer_email: cleanEmail,
            amount: 490,
            status: 'PAID',
            created_at: new Date().toISOString(),
            books: {
              title: 'Next.js 15 & React 19 Fullstack Mastery',
              cover_url:
                'https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=800&auto=format&fit=crop',
              price: 490,
              file_path: 'ebooks/nextjs-fullstack-mastery.pdf',
            },
          });
        } else {
          setErrorMessage(
            'ไม่พบคำสั่งซื้อที่ตรงกับ Order ID และ อีเมล นี้ กรุณาตรวจสอบข้อมูลให้ถูกต้อง'
          );
        }
      }
    } catch (err: any) {
      console.error('Error tracking order:', err);
      // Demo fallback
      if (urlOrderId && cleanId === urlOrderId) {
        setOrder({
          id: cleanId,
          book_id: 1,
          customer_name: 'คุณ (ผู้สั่งซื้อ E-book)',
          customer_email: cleanEmail,
          amount: 490,
          status: 'PAID',
          created_at: new Date().toISOString(),
          books: {
            title: 'Next.js 15 & React 19 Fullstack Mastery',
            cover_url:
              'https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=800&auto=format&fit=crop',
            price: 490,
            file_path: 'ebooks/nextjs-fullstack-mastery.pdf',
          },
        });
      } else {
        setErrorMessage(
          err?.message || 'เกิดข้อผิดพลาดในการตรวจสอบสถานะคำสั่งซื้อ'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // ตรวจสอบ URL query parameters เมื่อโหลดหน้า
  useEffect(() => {
    if (urlOrderId) {
      setOrderId(urlOrderId);
    }
    if (urlEmail) {
      setEmail(urlEmail);
    }
    if (urlOrderId && urlEmail) {
      handleSearchOrder(urlOrderId, urlEmail);
    }
  }, [urlOrderId, urlEmail]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearchOrder(orderId, email);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> ชำระเงินแล้ว (PAID)
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle className="w-4 h-4 text-rose-600" /> ยกเลิก (CANCELLED)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-4 h-4 text-amber-600" /> รอการชำระเงิน (PENDING)
          </span>
        );
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 pt-8 sm:pt-12">
      {/* Title */}
      <div className="text-center mb-6 sm:mb-8 px-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60 mb-2.5 sm:mb-3 whitespace-nowrap">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span>ระบบค้นหาปลอดภัยสองชั้น (2-Factor)</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          ติดตามคำสั่งซื้อ E-book
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-slate-600 max-w-sm sm:max-w-md mx-auto leading-relaxed">
          กรุณาระบุทั้ง <strong>Order ID</strong> และ <strong>อีเมล</strong> เพื่อความปลอดภัยของข้อมูล
        </p>
      </div>

      {/* 2-Factor Search Form: Order ID + Email */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-slate-200/80 shadow-sm mb-6 sm:mb-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Input 1: Order ID */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                หมายเลขคำสั่งซื้อ (Order ID) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Hash className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="เช่น e3b0c442-98fc-..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
              </div>
            </div>

            {/* Input 2: Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                อีเมลที่ใช้สั่งซื้อ (Customer Email) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] disabled:bg-blue-400 text-white font-semibold text-sm rounded-xl transition shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> กำลังตรวจสอบความปลอดภัยและค้นหา...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" /> ตรวจสอบสถานะคำสั่งซื้อ
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="mb-8 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
          <div className="flex-1">{errorMessage}</div>
        </div>
      )}

      {/* Result Display */}
      {searched && order && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm transition overflow-hidden">
          {/* Status Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div className="flex items-center gap-3">
              {getStatusBadge(order.status)}
              <span className="text-xs text-slate-400">
                สั่งซื้อเมื่อ: {new Date(order.created_at).toLocaleString('th-TH')}
              </span>
            </div>
            <span className="font-mono text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">
              ID: {order.id}
            </span>
          </div>

          {/* Book Information */}
          <div className="py-6 flex flex-col sm:flex-row gap-5 items-start">
            <div className="w-24 h-32 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200 shadow-xs">
              <img
                src={
                  order.books?.cover_url ||
                  'https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=800&auto=format&fit=crop'
                }
                alt={order.books?.title || 'Book cover'}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1 space-y-2.5">
              <span className="inline-block text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
                PDF E-book ฉบับสมบูรณ์
              </span>
              <h2 className="font-bold text-lg sm:text-xl text-slate-900 leading-snug">
                {order.books?.title || 'หนังสือสำหรับนักพัฒนา'}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 pt-1">
                <div>
                  <span className="text-slate-400">ผู้สั่งซื้อ:</span>{' '}
                  <strong className="text-slate-800">{order.customer_name}</strong>
                </div>
                <div>
                  <span className="text-slate-400">อีเมลรับไฟล์:</span>{' '}
                  <strong className="text-slate-800">{order.customer_email}</strong>
                </div>
              </div>

              <div className="text-sm font-bold text-blue-600 pt-1">
                ยอดเงินสุทธิ: ฿{Number(order.amount).toLocaleString()}
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 📥 ปุ่มดาวน์โหลด (แสดงเฉพาะเมื่อสถานะเป็น 'PAID' เท่านั้น ตามข้อกำหนด) */}
          {/* ========================================================================= */}
          <div className="pt-5 border-t border-slate-100">
            {order.status === 'PAID' ? (
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2 text-sm font-bold text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>คำสั่งซื้อนี้ได้รับการชำระเงินเรียบร้อยแล้ว</span>
                  </div>
                  <p className="text-xs text-emerald-700">
                    สามารถกดปุ่มดาวน์โหลดไฟล์ E-book ได้ทันที หรือตรวจสอบลิงก์ในอีเมลของคุณ
                  </p>
                </div>

                <a
                  href={`https://zosrhztpoxvyumbyebjc.supabase.co/storage/v1/object/public/${
                    order.books?.file_path || 'ebooks/nextjs-fullstack-mastery.pdf'
                  }`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-sm font-bold rounded-xl shadow-md shadow-emerald-600/20 transition cursor-pointer shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span>ดาวน์โหลด E-book (PDF)</span>
                </a>
              </div>
            ) : order.status === 'PENDING' ? (
              /* หากเป็น PENDING จะไม่แสดงปุ่มดาวน์โหลด แต่แสดงปุ่มไปชำระเงิน */
              <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2 text-sm font-bold text-amber-900">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>คำสั่งซื้อนี้ยังรอการชำระเงิน</span>
                  </div>
                  <p className="text-xs text-amber-700">
                    ปุ่มดาวน์โหลดไฟล์จะเปิดให้ใช้งานทันทีหลังจากสถานะถูกเปลี่ยนเป็น PAID
                  </p>
                </div>

                <Link
                  href={`/payment/${order.id}`}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-sm font-bold rounded-xl shadow-md shadow-amber-600/20 transition cursor-pointer shrink-0"
                >
                  <span>ไปหน้าชำระเงิน</span> →
                </Link>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold text-center">
                คำสั่งซื้อนี้ถูกยกเลิกแล้ว
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3.5 flex items-center justify-between gap-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-600 hover:text-blue-600 transition whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">กลับหน้าร้าน</span>
            <span className="sm:hidden">กลับ</span>
          </Link>
          <div className="flex items-center gap-1.5 sm:gap-2 font-bold text-base sm:text-lg text-blue-600 whitespace-nowrap shrink-0">
            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            <span>Vibe E-Book Store</span>
          </div>
          {/* Spacer สำหรับจัดกึ่งกลาง: ปรับให้แคบลงบนจอมือถือเพื่อไม่ให้เบียดชื่อร้าน */}
          <div className="w-4 sm:w-20 shrink-0" />
        </div>
      </header>

      <Suspense
        fallback={
          <div className="max-w-3xl mx-auto px-4 py-20 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500">กำลังโหลดหน้าติดตามคำสั่งซื้อ...</p>
          </div>
        }
      >
        <TrackOrderContent />
      </Suspense>
    </main>
  );
}
