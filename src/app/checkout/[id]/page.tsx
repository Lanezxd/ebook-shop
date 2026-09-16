'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  BookOpen,
  ArrowLeft,
  ShieldCheck,
  Mail,
  User,
  Sparkles,
  Lock,
  Download,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

interface Book {
  id: number;
  title: string;
  description: string;
  price: number;
  cover_url: string;
  file_path?: string;
}

// ข้อมูลสำรองสำหรับแสดงผลกรณีที่ฐานข้อมูลยังไม่ได้รัน SQL Schema
const FALLBACK_BOOKS: Record<string, Book> = {
  '1': {
    id: 1,
    title: 'Media Player PRO',
    description:
      'เล่นได้มากกว่า...มากกว่าการฟังและดู คู่มือการใช้งาน Media Player PRO อย่างละเอียด พร้อมเทคนิคการเล่นไฟล์เพลงและวิดีโอ การจัดการรายการเพลง และการควบคุมฟังก์ชันครบครัน',
    price: 390,
    cover_url: '/images/media-player-pro.jpg',
    file_path: 'ebooks/media-player-pro.pdf',
  },
  '2': {
    id: 2,
    title: 'Tarot Reading PRO',
    description:
      'เรียนรู้การอ่านไพ่ทาโรต์ เข้าใจความหมาย ตีความได้จริง ใช้ได้ในชีวิตประจำวัน ปูพื้นฐานครบทุกใบ พร้อมวิธีการตีความและตัวอย่างการใช้งานจริง',
    price: 199,
    cover_url: '/images/tarot-reading-pro.jpg',
    file_path: 'ebooks/tarot-reading-pro.pdf',
  },
  '3': {
    id: 3,
    title: 'SQLite Task Manager PRO',
    description:
      'คู่มือการจัดการงานด้วย SQLite: สร้างระบบ Task Manager ของคุณเอง ตั้งแต่พื้นฐานการใช้งาน SQLite จนถึงการจัดการงานอย่างเป็นระบบ',
    price: 259,
    cover_url: '/images/sqlite-task-manager-pro.jpg',
    file_path: 'ebooks/sqlite-task-manager-pro.pdf',
  },
};

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = params?.id as string;

  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ฟอร์มข้อมูลลูกค้า
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(true);

  // ดึงข้อมูลหนังสือจาก Supabase ตาม bookId
  useEffect(() => {
    async function loadBook() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('books')
          .select('*')
          .eq('id', Number(bookId))
          .maybeSingle();

        if (data && !error) {
          const formatted = {
            ...data,
            title:
              data.id === 1
                ? data.title || 'Media Player PRO'
                : data.id === 2
                ? data.title || 'Tarot Reading PRO'
                : data.id === 3
                ? data.title || 'SQLite Task Manager PRO'
                : data.title,
            description:
              data.id === 1 && data.description?.includes('Next.js')
                ? 'เล่นได้มากกว่า...มากกว่าการฟังและดู คู่มือการใช้งาน Media Player PRO อย่างละเอียด พร้อมเทคนิคการเล่นไฟล์เพลงและวิดีโอ การจัดการรายการเพลง และการควบคุมฟังก์ชันครบครัน'
                : data.id === 2 && (!data.description || data.description.includes('AI-Driven') || data.description.includes('Vibe Coding'))
                ? 'เรียนรู้การอ่านไพ่ทาโรต์ เข้าใจความหมาย ตีความได้จริง ใช้ได้ในชีวิตประจำวัน ปูพื้นฐานครบทุกใบ พร้อมวิธีการตีความและตัวอย่างการใช้งานจริง'
                : data.id === 3 && (!data.description || data.description.includes('PostgreSQL') || data.description.includes('Supabase & PostgreSQL'))
                ? 'คู่มือการจัดการงานด้วย SQLite: สร้างระบบ Task Manager ของคุณเอง ตั้งแต่พื้นฐานการใช้งาน SQLite จนถึงการจัดการงานอย่างเป็นระบบ'
                : data.description,
            cover_url:
              data.id === 1 ||
              data.cover_url?.startsWith('C:') ||
              data.cover_url?.includes('Downloads') ||
              data.cover_url?.includes('media-player-pro')
                ? '/images/media-player-pro.jpg'
                : data.id === 2 ||
                  data.cover_url?.includes('photo-1618005182384') ||
                  data.cover_url?.includes('tarot-reading-pro')
                ? '/images/tarot-reading-pro.jpg'
                : data.id === 3 ||
                  data.cover_url?.includes('photo-1544383835') ||
                  data.cover_url?.includes('sqlite-task-manager-pro')
                ? '/images/sqlite-task-manager-pro.jpg'
                : data.cover_url,
          };
          setBook(formatted);
        } else if (FALLBACK_BOOKS[bookId]) {
          // หากยังไม่มีใน DB ให้ใช้ Fallback เพื่อให้ทดสอบหน้าเว็บได้ทันที
          setBook(FALLBACK_BOOKS[bookId]);
        } else {
          setErrorMessage('ไม่พบข้อมูลหนังสือเล่มที่ต้องการ');
        }
      } catch (err: any) {
        console.error('Error fetching book:', err);
        if (FALLBACK_BOOKS[bookId]) {
          setBook(FALLBACK_BOOKS[bookId]);
        } else {
          setErrorMessage('เกิดข้อผิดพลาดในการโหลดข้อมูลหนังสือ');
        }
      } finally {
        setLoading(false);
      }
    }

    if (bookId) {
      loadBook();
    }
  }, [bookId]);

  // จัดการการส่งฟอร์มสั่งซื้อ
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!customerName.trim()) {
      setErrorMessage('กรุณาระบุชื่อ-นามสกุล');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!customerEmail.trim() || !emailRegex.test(customerEmail.trim())) {
      setErrorMessage('กรุณาระบุอีเมลที่ถูกต้องเพื่อใช้ในการรับไฟล์ E-book');
      return;
    }

    if (!acceptTerms) {
      setErrorMessage('กรุณายอมรับเงื่อนไขการให้บริการก่อนดำเนินการต่อ');
      return;
    }

    if (!book) return;

    setIsSubmitting(true);

    try {
      // 1. บันทึกคำสั่งซื้อลงในตาราง orders บน Supabase โดยกำหนดสถานะเริ่มต้นเป็น 'PENDING'
      const { data: newOrder, error } = await supabase
        .from('orders')
        .insert({
          book_id: book.id,
          customer_name: customerName.trim(),
          customer_email: customerEmail.trim().toLowerCase(),
          amount: book.price,
          status: 'PENDING',
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase orders insert error:', error);

        // หากเกิดกรณีที่ตาราง orders ยังไม่ได้สร้างใน Supabase ให้แจ้งเตือน หรือ fallback เพื่อ demo flow
        if (error.code === 'PGRST205' || error.message.includes('orders')) {
          setErrorMessage(
            '⚠️ ยังไม่พบตาราง "orders" ในฐานข้อมูล Supabase (กรุณารันคำสั่งใน supabase/schema.sql ก่อน)'
          );
          setIsSubmitting(false);
          return;
        }

        throw error;
      }

      // 2. เมื่อสร้างสำเร็จ ให้ redirect ผู้ใช้ไปยังหน้า /payment/[orderId]
      if (newOrder?.id) {
        router.push(`/payment/${newOrder.id}`);
      } else {
        throw new Error('ไม่พบข้อมูล Order ID ที่สร้างใหม่');
      }
    } catch (err: any) {
      console.error('Order creation failed:', err);
      setErrorMessage(
        err?.message || 'เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ กรุณาลองใหม่อีกครั้ง'
      );
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 text-slate-600">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-sm font-medium">กำลังเตรียมข้อมูลการสั่งซื้อ...</p>
        </div>
      </main>
    );
  }

  if (!book && !loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">ไม่พบหนังสือที่ต้องการ</h2>
          <p className="text-sm text-slate-600 mb-6">
            หนังสือเล่มนี้อาจถูกนำออกจากระบบหรือไม่มีอยู่ในฐานข้อมูล
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition"
          >
            <ArrowLeft className="w-4 h-4" /> กลับสู่หน้าร้านค้า
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Top Header */}
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2">
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
            <span>E-Book Store</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs text-emerald-700 bg-emerald-50 px-2 sm:px-2.5 py-1 rounded-full border border-emerald-200 whitespace-nowrap shrink-0">
            <Lock className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
            <span className="hidden sm:inline">ชำระเงินปลอดภัย</span>
            <span className="sm:hidden">ปลอดภัย</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-5xl mx-auto px-3.5 sm:px-4 pt-4 sm:pt-10">
        {/* Progress steps (ปรับให้แสดงผลในบรรทัดเดียว ไม่ตัดคำหรือขึ้นบรรทัดใหม่อย่างไม่เหมาะสมบนมือถือ) */}
        <div className="flex items-center justify-center gap-1.5 sm:gap-4 mb-6 sm:mb-8 text-xs sm:text-sm font-medium text-slate-500 py-1">
          {/* ขั้นตอนที่ 1 */}
          <div className="flex items-center gap-1 sm:gap-1.5 text-blue-600 font-semibold whitespace-nowrap shrink-0">
            <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] sm:text-xs shrink-0">
              1
            </span>
            <span className="hidden sm:inline">กรอกข้อมูลสั่งซื้อ</span>
            <span className="sm:hidden text-[11px]">ข้อมูลสั่งซื้อ</span>
          </div>

          <span className="w-4 sm:w-8 h-[2px] bg-slate-200 shrink-0" />

          {/* ขั้นตอนที่ 2 */}
          <div className="flex items-center gap-1 sm:gap-1.5 whitespace-nowrap shrink-0">
            <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] sm:text-xs shrink-0">
              2
            </span>
            <span className="text-[11px] sm:text-sm">ชำระเงิน</span>
          </div>

          <span className="w-4 sm:w-8 h-[2px] bg-slate-200 shrink-0" />

          {/* ขั้นตอนที่ 3 */}
          <div className="flex items-center gap-1 sm:gap-1.5 whitespace-nowrap shrink-0">
            <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] sm:text-xs shrink-0">
              3
            </span>
            <span className="hidden sm:inline">รับ E-book ทางอีเมล</span>
            <span className="sm:hidden text-[11px]">รับ E-book</span>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-3 shadow-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex-1">{errorMessage}</div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Form Section (7 cols on lg) */}
          <div className="lg:col-span-7 bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-slate-200/80 shadow-sm">
            <div className="border-b border-slate-100 pb-4 sm:pb-5 mb-5 sm:mb-6">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                ข้อมูลผู้รับ E-book
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                กรุณาระบุข้อมูลสำหรับจัดส่งไฟล์และออกใบเสร็จรับเงิน
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              {/* Field: Customer Name */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">
                  ชื่อ-นามสกุล <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="เช่น สมชาย ใจดี"
                    className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Field: Customer Email */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">
                  อีเมลสำหรับรับไฟล์ E-book <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  />
                </div>
                <p className="mt-1.5 text-[11px] sm:text-xs text-slate-500 flex items-center gap-1.5 leading-normal">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>ส่งลิงก์ดาวน์โหลดหนังสือไปยังอีเมลนี้ทันทีหลังชำระเงิน</span>
                </p>
              </div>

              {/* Terms Checkbox */}
              <div className="pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 shrink-0"
                  />
                  <span className="text-[11px] sm:text-xs text-slate-600 leading-relaxed">
                    ฉันยอมรับว่าสินค้าเป็นไฟล์ดิจิทัล (E-book) และยอมรับข้อกำหนดในการใช้งาน ตลอดจนนโยบายความเป็นส่วนตัว
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <div className="pt-3 sm:pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] disabled:bg-blue-400 text-white font-semibold text-sm sm:text-base shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      กำลังสร้างคำสั่งซื้อ...
                    </>
                  ) : (
                    <>
                      <span>ยืนยันการสั่งซื้อ</span>
                      <span className="text-blue-200 font-normal">|</span>
                      <span>฿{Number(book?.price || 0).toLocaleString()}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Security Badges */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3 pt-3.5 sm:pt-4 border-t border-slate-100 text-slate-500 text-[11px] sm:text-xs">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="whitespace-nowrap">จ่ายผ่าน PromptPay</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Download className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="whitespace-nowrap">รับไฟล์ทันที (PDF)</span>
                </div>
              </div>
            </form>
          </div>

          {/* Book Summary Card (5 cols on lg) */}
          <div className="lg:col-span-5 bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm sticky top-24">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100 flex items-center justify-between">
              <span>สรุปคำสั่งซื้อ</span>
              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                1 รายการ
              </span>
            </h2>

            {/* Book Item Details */}
            {book && (
              <div>
                <div className="flex gap-4 items-start">
                  <div className="w-20 h-28 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200 shadow-sm">
                    <img
                      src={book.cover_url}
                      alt={book.title}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/media-player-pro.jpg';
                      }}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="inline-block text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full mb-1">
                      PDF E-book
                    </span>
                    <h3 className="font-bold text-sm text-slate-900 leading-snug line-clamp-2">
                      {book.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {book.description}
                    </p>
                    <div className="mt-2 text-sm font-bold text-blue-600">
                      ฿{Number(book.price).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="mt-6 pt-5 border-t border-slate-100 space-y-2.5 text-xs sm:text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>ราคาหนังสือ</span>
                    <span>฿{Number(book.price).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>ค่าจัดส่ง (ไฟล์ดิจิทัล)</span>
                    <span className="text-emerald-600 font-semibold">ฟรี (฿0)</span>
                  </div>
                  <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline font-bold text-base text-slate-900">
                    <span>ยอดรวมสุทธิ</span>
                    <span className="text-xl text-blue-600">
                      ฿{Number(book.price).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Benefits List */}
                <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>อ่านได้บน Mobile, Tablet, PC, Kindle</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>ลิขสิทธิ์ฉบับสมบูรณ์ พร้อมโค้ดตัวอย่าง</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>รับประกันอัปเดตเนื้อหาฟรีตลอดชีพ</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
