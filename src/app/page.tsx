"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    } else if (status === "authenticated" && session?.user) {
      if (session.user.role === "OWNER" || session.user.role === "ADMIN") {
        router.push("/admin/dashboard");
      } else {
        router.push("/dashboard");
      }
    }
  }, [status, session, router]);

  if (status === "loading") {
    return (
      <div className="flex-center min-h-screen">
        <div className="spinner">Loading...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <section className="container-fluid py-20 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          YZU Platform
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Platform pembelajaran dengan video edukasi berkualitas tinggi dan sistem pembayaran yang aman
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/auth/login"
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Login
          </Link>
          <Link
            href="/auth/register"
            className="px-8 py-3 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition"
          >
            Daftar
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="container-fluid py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Fitur Utama</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">📚 Video Berkualitas</h3>
            <p className="text-gray-600">
              Koleksi video pembelajaran dari instruktur berpengalaman dengan kualitas HD
            </p>
          </div>
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">💳 Pembayaran Aman</h3>
            <p className="text-gray-600">
              Sistem pembayaran terintegrasi dengan wallet untuk kemudahan transaksi
            </p>
          </div>
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">🎯 Subscription Plans</h3>
            <p className="text-gray-600">
              Berbagai paket berlangganan dengan harga terjangkau sesuai kebutuhan Anda
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
