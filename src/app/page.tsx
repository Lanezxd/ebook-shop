'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  BookOpen,
  ShoppingCart,
  Smartphone,
  Zap,
  ShieldCheck,
  Search,
  CheckCircle2,
  FileText,
  Star,
  ArrowRight,
} from 'lucide-react';

interface Book {
  id: number;
  title: string;
  description: string;
  price: number;
  cover_url: string;
  file_path?: string;
}

// ข้อมูลสำรองอย่างน้อย 3 เล่ม (กรณีที่ยังไม่ได้รัน SQL บน Supabase ให้หน้าร้านยังแสดงผลได้อย่างสมบูรณ์แบบ)
const DEFAULT_BOOKS: Book[] = [
  {
    id: 1,
    title: 'Media Player PRO',
    description:
      'เล่นได้มากกว่า...มากกว่าการฟังและดู คู่มือการใช้งาน Media Player PRO อย่างละเอียด พร้อมเทคนิคการเล่นไฟล์เพลงและวิดีโอ การจัดการรายการเพลง และการควบคุมฟังก์ชันครบครัน',
    price: 390,
    cover_url: '/images/media-player-pro.jpg',
    file_path: 'ebooks/media-player-pro.pdf',
  },
  {
    id: 2,
    title: 'Tarot Reading PRO',
    description:
      'เรียนรู้การอ่านไพ่ทาโรต์ เข้าใจความหมาย ตีความได้จริง ใช้ได้ในชีวิตประจำวัน ปูพื้นฐานครบทุกใบ พร้อมวิธีการตีความและตัวอย่างการใช้งานจริง',
    price: 199,
    cover_url: '/images/tarot-reading-pro.jpg',
    file_path: 'ebooks/tarot-reading-pro.pdf',
  },
  {
    id: 3,
    title: 'SQLite Task Manager PRO',
    description:
      'คู่มือการจัดการงานด้วย SQLite: สร้างระบบ Task Manager ของคุณเอง ตั้งแต่พื้นฐานการใช้งาน SQLite จนถึงการจัดการงานอย่างเป็นระบบ',
    price: 259,
    cover_url: '/images/sqlite-task-manager-pro.jpg',
    file_path: 'ebooks/sqlite-task-manager-pro.pdf',
  },
];

export default function HomePage() {
  const [books, setBooks] = useState<Book[]>(DEFAULT_BOOKS);
  const [loading, setLoading] = useState(true);
  const [isLiveDatabase, setIsLiveDatabase] = useState(false);

  useEffect(() => {
    async function fetchBooks() {
      try {
        const { data, error } = await supabase
          .from('books')
          .select('*')
          .order('id', { ascending: true });

        if (!error && data && data.length > 0) {
          const formattedBooks = data.map((b) => {
            // หากเป็นหนังสือเล่มแรก (id 1) หรือ path ไม่ถูกต้อง ให้ใช้รูปหน้าปก Media Player PRO
            if (
              b.id === 1 ||
              b.cover_url?.startsWith('C:') ||
              b.cover_url?.includes('Downloads') ||
              b.cover_url?.includes('media-player-pro')
            ) {
              return {
                ...b,
                title: b.title || 'Media Player PRO',
                description:
                  b.description?.includes('Next.js')
                    ? 'เล่นได้มากกว่า...มากกว่าการฟังและดู คู่มือการใช้งาน Media Player PRO อย่างละเอียด พร้อมเทคนิคการเล่นไฟล์เพลงและวิดีโอ การจัดการรายการเพลง และการควบคุมฟังก์ชันครบครัน'
                    : b.description,
                cover_url: '/images/media-player-pro.jpg',
              };
            }
            // หากเป็นหนังสือเล่มที่ 2 ให้ใช้รูปหน้าปก Tarot Reading PRO
            if (
              b.id === 2 ||
              b.cover_url?.includes('photo-1618005182384') ||
              b.cover_url?.includes('tarot-reading-pro')
            ) {
              return {
                ...b,
                title: b.title || 'Tarot Reading PRO',
                description:
                  !b.description || b.description.includes('AI-Driven') || b.description.includes('Vibe Coding')
                    ? 'เรียนรู้การอ่านไพ่ทาโรต์ เข้าใจความหมาย ตีความได้จริง ใช้ได้ในชีวิตประจำวัน ปูพื้นฐานครบทุกใบ พร้อมวิธีการตีความและตัวอย่างการใช้งานจริง'
                    : b.description,
                cover_url: '/images/tarot-reading-pro.jpg',
              };
            }
            // หากเป็นหนังสือเล่มที่ 3 ให้ใช้รูปหน้าปก SQLite Task Manager PRO
            if (
              b.id === 3 ||
              b.cover_url?.includes('photo-1544383835') ||
              b.cover_url?.includes('sqlite-task-manager-pro')
            ) {
              return {
                ...b,
                title: b.title || 'SQLite Task Manager PRO',
                description:
                  !b.description || b.description.includes('PostgreSQL') || b.description.includes('Supabase & PostgreSQL')
                    ? 'คู่มือการจัดการงานด้วย SQLite: สร้างระบบ Task Manager ของคุณเอง ตั้งแต่พื้นฐานการใช้งาน SQLite จนถึงการจัดการงานอย่างเป็นระบบ'
                    : b.description,
                cover_url: '/images/sqlite-task-manager-pro.jpg',
              };
            }
            return b;
          });
          setBooks(formattedBooks);
          setIsLiveDatabase(true);
        } else {
          // หากตารางยังว่าง หรือยังไม่ได้รัน SQL Schema ให้ใช้ข้อมูล Default 3 เล่ม
          setBooks(DEFAULT_BOOKS);
        }
      } catch (err) {
        console.warn('Database fetch fallback to sample books:', err);
        setBooks(DEFAULT_BOOKS);
      } finally {
        setLoading(false);
      }
    }

    fetchBooks();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Header Bar */}
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-slate-200/80 transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900 flex items-center gap-1">
              E-Book <span className="text-blue-600">Store</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/track"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 hover:text-blue-600 hover:bg-slate-100 active:scale-95 transition border border-slate-200/80 bg-white"
            >
              <Search className="w-3.5 h-3.5 text-slate-500" />
              <span>ติดตามคำสั่งซื้อ</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content: Books Showcase */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-16 sm:pt-12 sm:pb-20 flex-1 w-full">
        {/* Section Title */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-10 gap-3 pb-5 border-b border-slate-200/80">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 block mb-1">
              Featured Books
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              หนังสือแนะนำทั้งหมด ({books.length} เล่ม)
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 bg-white px-3.5 py-1.5 rounded-full border border-slate-200/80 shadow-xs w-fit">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">พร้อมจัดส่งไฟล์ทันทีหลังชำระเงิน</span>
          </div>
        </div>

        {/* Loading Skeletons */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-3xl border border-slate-200 p-4 animate-pulse space-y-4"
              >
                <div className="h-56 bg-slate-200 rounded-2xl w-full" />
                <div className="h-5 bg-slate-200 rounded w-3/4" />
                <div className="h-4 bg-slate-100 rounded w-full" />
                <div className="h-4 bg-slate-100 rounded w-2/3" />
                <div className="h-10 bg-slate-200 rounded-xl mt-4" />
              </div>
            ))}
          </div>
        ) : (
          /* Book Cards Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
            {books.map((book) => (
              <article
                key={book.id}
                className="group bg-white rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:border-blue-200 transition-all duration-300 flex flex-col overflow-hidden"
              >
                {/* Book Cover Image Container */}
                <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-slate-950 flex items-center justify-center">
                  {/* Backdrop blur effect */}
                  <img
                    src={book.cover_url}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 w-full h-full object-cover blur-xl opacity-40 scale-125 pointer-events-none"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <img
                    src={book.cover_url}
                    alt={book.title}
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/media-player-pro.jpg';
                    }}
                    className="relative max-h-full max-w-full object-contain py-2 drop-shadow-md group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Floating Badges */}
                  <div className="absolute top-3.5 left-3.5 flex flex-wrap gap-1.5 z-10">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/90 backdrop-blur-md text-slate-800 shadow-xs border border-white/60">
                      PDF E-book
                    </span>
                  </div>
                  <div className="absolute bottom-3 right-3 z-10">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-900/80 backdrop-blur-md text-white">
                      ดิจิทัลดาวน์โหลด
                    </span>
                  </div>
                </div>

                {/* Book Details */}
                <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Stars preview */}
                    <div className="flex items-center gap-1 text-amber-400 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      ))}
                      <span className="text-[11px] text-slate-400 font-medium ml-1">5.0 (รีวิวยอดเยี่ยม)</span>
                    </div>

                    <h3 className="font-bold text-base sm:text-lg text-slate-900 leading-snug group-hover:text-blue-600 transition line-clamp-2">
                      {book.title}
                    </h3>
                    <p className="mt-2 text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed">
                      {book.description}
                    </p>
                  </div>

                  {/* Price and CTA */}
                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[11px] text-slate-400 block font-medium">ราคาพิเศษ</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl sm:text-2xl font-extrabold text-blue-600">
                          ฿{Number(book.price).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* ปุ่มสั่งซื้อลิงก์ไปยัง /checkout/[id] */}
                    <Link
                      href={`/checkout/${book.id}`}
                      className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs sm:text-sm font-semibold rounded-2xl transition shadow-md shadow-blue-500/20"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>สั่งซื้อ</span>
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Trust Guarantee Section */}
      <section className="bg-white border-t border-slate-200 py-12 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-2xl bg-slate-50/70 border border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900">จัดส่งไฟล์อัตโนมัติ</h4>
              <p className="text-xs text-slate-500 mt-1">รับลิงก์ดาวน์โหลดส่งตรงเข้าอีเมลภายในไม่เกิน 1 นาที</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-2xl bg-slate-50/70 border border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900">อ่านได้ทุกอุปกรณ์</h4>
              <p className="text-xs text-slate-500 mt-1">รองรับ Smartphone, Tablet, iPad, PC และ Kindle</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-2xl bg-slate-50/70 border border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900">รับประกันอัปเดตฟรี</h4>
              <p className="text-xs text-slate-500 mt-1">หากมีเนื้อหาอัปเดตเวอร์ชันใหม่ สามารถดาวน์โหลดไฟล์ใหม่ได้ฟรี</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 px-4 text-center text-xs">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-400" />
            <span className="font-bold text-slate-200">E-Book Store</span>
            <span>— ร้านขายหนังสือดิจิทัลสำหรับนักพัฒนา</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-white transition">หน้าแรก</Link>
            <Link href="/track" className="hover:text-white transition">ติดตามคำสั่งซื้อ</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}