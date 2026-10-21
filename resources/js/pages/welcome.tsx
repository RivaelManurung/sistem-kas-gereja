import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, Calculator, FileSpreadsheet, HeartHandshake, LogIn, ShieldCheck, Wallet } from 'lucide-react';

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;

    return (
        <>
            <Head title="Sistem Informasi Kas & Persembahan Gereja">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600,700" rel="stylesheet" />
            </Head>

            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between">
                {/* Header Navbar */}
                <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50 px-4 lg:px-8 py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-primary text-primary-foreground font-bold flex items-center justify-center">
                            <Wallet className="h-5 w-5" />
                        </div>
                        <div>
                            <span className="font-bold text-base tracking-tight block">Sistem Kas Gereja</span>
                            <span className="text-xs text-muted-foreground block -mt-0.5">Tata Kelola Kas &amp; Persembahan Akuntabel</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/transparansi" className="gap-1.5">
                                <ShieldCheck className="h-4 w-4" />
                                Transparansi Publik
                            </Link>
                        </Button>

                        {auth.user ? (
                            <Button size="sm" asChild>
                                <Link href="/dashboard" className="gap-1.5">
                                    Buka Dasbor
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </Button>
                        ) : (
                            <Button size="sm" asChild>
                                <Link href="/login" className="gap-1.5">
                                    <LogIn className="h-4 w-4" />
                                    Masuk
                                </Link>
                            </Button>
                        )}
                    </div>
                </header>

                {/* Hero Section */}
                <main className="flex-1 max-w-5xl mx-auto px-4 py-12 md:py-16 flex flex-col items-center text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300/40 mb-6">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Integritas Buku Besar Append-Only &amp; Multi-Saksi
                    </div>

                    <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight max-w-3xl leading-tight">
                        Pengelolaan Keuangan &amp; Kas Gereja yang Tertib, Transparan, dan Teruji
                    </h1>

                    <p className="mt-4 text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed">
                        Sistem administrasi persembahan jemaat, penghitungan fisik multi-saksi, pembukuan kas,
                        pengesahan bertingkat, dan laporan keuangan terstandar untuk kemuliaan nama Tuhan.
                    </p>

                    <div className="mt-8 flex flex-wrap gap-3 justify-center">
                        {auth.user ? (
                            <Button size="lg" asChild className="gap-2 font-semibold">
                                <Link href="/dashboard">
                                    Masuk ke Dasbor Internal
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </Button>
                        ) : (
                            <Button size="lg" asChild className="gap-2 font-semibold">
                                <Link href="/login">
                                    Masuk sebagai Pengurus / Jemaat
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </Button>
                        )}

                        <Button size="lg" variant="outline" asChild className="gap-2">
                            <Link href="/transparansi">
                                <ShieldCheck className="h-4 w-4" />
                                Lihat Transparansi Kas Terbuka
                            </Link>
                        </Button>
                    </div>

                    {/* Highlights Grid */}
                    <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
                        <Card className="shadow-xs hover:shadow-md transition-shadow">
                            <CardHeader className="pb-2">
                                <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center mb-2">
                                    <Calculator className="h-5 w-5" />
                                </div>
                                <CardTitle className="text-base">Penghitungan Multi-Saksi</CardTitle>
                                <CardDescription>
                                    Berita acara hitung per pecahan rupiah langsung di HP dengan konfirmasi saksi ganda dan verifikasi bendahara.
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <Card className="shadow-xs hover:shadow-md transition-shadow">
                            <CardHeader className="pb-2">
                                <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mb-2">
                                    <FileSpreadsheet className="h-5 w-5" />
                                </div>
                                <CardTitle className="text-base">Laporan Resmi &amp; Beku</CardTitle>
                                <CardDescription>
                                    Laporan berkala dengan tanda tangan digital, stempel gereja, kode verifikasi publik QR, dan warta mingguan siap cetak.
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <Card className="shadow-xs hover:shadow-md transition-shadow">
                            <CardHeader className="pb-2">
                                <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center mb-2">
                                    <HeartHandshake className="h-5 w-5" />
                                </div>
                                <CardTitle className="text-base">Portal Mandiri Jemaat</CardTitle>
                                <CardDescription>
                                    Jemaat dapat melihat riwayat persembahan atas nama sendiri dan mencetak bukti tahunan untuk keperluan SPT secara mandiri.
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </div>
                </main>

                {/* Footer */}
                <footer className="border-t py-6 text-center text-xs text-muted-foreground">
                    &copy; {new Date().getFullYear()} Sistem Informasi Kas &amp; Persembahan Gereja. Hak Cipta Dilindungi.
                </footer>
            </div>
        </>
    );
}
