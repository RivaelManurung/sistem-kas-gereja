import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { BrandMark } from '@/components/brand-mark';
import { type SharedData } from '@/types';
import { ArrowRight, CircleAlert, ClipboardCheck, Eye, EyeOff, FileText, LoaderCircle, Lock, Mail, ShieldCheck } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

interface LoginForm {
    email: string;
    password: string;
    remember: boolean;
    [key: string]: any;
}

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
    demoAccounts?: Array<{ email: string; role: string; name: string }>;
}

const FEATURES = [
    { icon: ClipboardCheck, title: 'Kolekte & berita acara', desc: 'Dihitung bersama saksi, lalu dikunci ke buku besar' },
    { icon: FileText, title: 'Pengeluaran & laporan', desc: 'Persetujuan berjenjang dan laporan bertanda tangan' },
    { icon: ShieldCheck, title: 'Transparansi jemaat', desc: 'Ringkasan publik tanpa data pribadi jemaat' },
];

/** Interior gereja: sinar jendela, salib kayu, bangku, dan Alkitab. Ganti dengan foto bila ada. */
function ChurchScene() {
    return (
        <svg className="absolute inset-0 size-full" viewBox="0 0 768 1024" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <defs>
                <linearGradient id="ls-wall" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#a39a8d" />
                    <stop offset="0.55" stopColor="#6e665b" />
                    <stop offset="1" stopColor="#24201c" />
                </linearGradient>
                <linearGradient id="ls-wood" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0" stopColor="#7a5c3d" />
                    <stop offset="1" stopColor="#4d3926" />
                </linearGradient>
                <linearGradient id="ls-pew" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#6a4a30" />
                    <stop offset="1" stopColor="#1c130d" />
                </linearGradient>
                <linearGradient id="ls-beam" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#fff4dc" stopOpacity="0.5" />
                    <stop offset="1" stopColor="#fff4dc" stopOpacity="0" />
                </linearGradient>
                <filter id="ls-soft" x="-10%" y="-10%" width="120%" height="120%">
                    <feGaussianBlur stdDeviation="2.5" />
                </filter>
                <filter id="ls-blur" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="14" />
                </filter>
            </defs>

            <rect width="768" height="1024" fill="url(#ls-wall)" />

            {/* kusen jendela di kanan */}
            <rect x="700" y="0" width="68" height="780" fill="#2a3446" opacity="0.85" />
            <rect x="716" y="0" width="14" height="780" fill="#1b2231" />

            {/* sinar jendela */}
            <g className="login-light" filter="url(#ls-blur)">
                <polygon points="520,0 700,0 330,760 90,760" fill="url(#ls-beam)" opacity="0.55" />
                <polygon points="400,0 470,0 180,760 90,760" fill="url(#ls-beam)" opacity="0.4" />
            </g>

            {/* salib kayu */}
            <g filter="url(#ls-soft)">
                <rect x="526" y="96" width="30" height="430" fill="url(#ls-wood)" />
                <rect x="440" y="212" width="204" height="28" fill="url(#ls-wood)" />
            </g>

            {/* tanaman */}
            <g filter="url(#ls-blur)" opacity="0.9">
                <ellipse cx="640" cy="640" rx="120" ry="170" fill="#2f3b2c" />
                <ellipse cx="700" cy="720" rx="90" ry="120" fill="#232d21" />
            </g>

            {/* bangku */}
            <polygon points="0,806 768,720 768,1024 0,1024" fill="url(#ls-pew)" />
            <polygon points="0,806 768,720 768,736 0,822" fill="#8a6542" opacity="0.7" />

            {/* Alkitab */}
            <g transform="translate(110 800) rotate(-6)">
                <polygon points="0,40 300,0 390,34 90,100" fill="#15110e" />
                <polygon points="90,100 390,34 390,66 90,132" fill="#e8dcc0" />
                <polygon points="90,100 390,34 390,42 90,108" fill="#b9a67a" />
                <polygon points="0,40 90,100 90,132 0,72" fill="#0d0a08" />
                <path d="M150 40 L210 28 M180 22 L180 56" stroke="#8c7a4c" strokeWidth="2" opacity="0.6" />
            </g>
        </svg>
    );
}

export default function Login({ status, canResetPassword, demoAccounts = [] }: LoginProps) {
    const { brand, flash } = usePage<SharedData>().props;
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors, reset, setError, clearErrors } = useForm<LoginForm>({
        email: '',
        password: '',
        remember: false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        clearErrors();
        const problems: Partial<Record<'email' | 'password', string>> = {};
        if (!data.email.trim()) problems.email = 'Email wajib diisi.';
        else if (!/^\S+@\S+\.\S+$/.test(data.email.trim())) problems.email = 'Format email belum benar, contoh: nama@gereja.org.';
        if (!data.password) problems.password = 'Kata sandi wajib diisi.';
        if (Object.keys(problems).length > 0) {
            setError(problems);
            document.getElementById(problems.email ? 'email' : 'password')?.focus();

            return;
        }

        post(route('login'), {
            onError: () => document.getElementById('email')?.focus(),
            onFinish: () => reset('password'),
        });
    };

    return (
        <div className="grid min-h-dvh w-full lg:grid-cols-2">
            <Head title="Masuk" />

            {/* Panel kiri */}
            <aside className="relative hidden flex-col overflow-hidden bg-neutral-900 p-12 text-white lg:flex">
                <ChurchScene />
                <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/25 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/30" />

                <Link href={route('home')} className="relative z-10 flex items-center gap-2.5 text-lg font-semibold">
                    <BrandMark className="size-8" />
                    {brand.name}
                </Link>

                <div className="relative z-10 my-auto max-w-md">
                    <h1 className="text-4xl leading-[1.15] font-semibold tracking-tight text-balance">Bersama mengelola pelayanan gereja</h1>
                    <p className="mt-5 max-w-sm text-base leading-relaxed text-white/80">
                        Sistem kas dan persembahan yang membuat keuangan gereja lebih tertib, transparan, dan mudah dipertanggungjawabkan.
                    </p>

                    <ul className="mt-10 space-y-5">
                        {FEATURES.map(({ icon: Icon, title, desc }) => (
                            <li key={title} className="flex items-start gap-3.5">
                                <Icon className="mt-0.5 size-5 shrink-0 text-white/90" aria-hidden="true" />
                                <div>
                                    <p className="text-sm font-medium">{title}</p>
                                    <p className="text-sm text-white/65">{desc}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </aside>

            {/* Panel kanan */}
            <main className="bg-background flex flex-col items-center justify-center px-6 py-10 sm:px-10">
                <div className="w-full max-w-md">
                    <div className="flex flex-col items-center text-center">
                        <div className="bg-muted flex size-16 text-primary items-center justify-center rounded-2xl shadow-xs">
                            <BrandMark className="size-9" />
                        </div>
                        <h2 className="mt-7 text-3xl font-semibold tracking-tight">Masuk ke akun</h2>
                        <p className="text-muted-foreground mt-2 max-w-xs text-sm text-balance">Silakan masuk untuk melanjutkan ke sistem {brand.name}.</p>
                    </div>

                    {flash?.error && (
                        <div role="alert" className="border-expense/30 bg-expense/10 text-expense mt-6 flex items-start gap-2 rounded-lg border p-3 text-sm font-medium">
                            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                            {flash.error}
                        </div>
                    )}

                    {status && (
                        <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-center text-sm font-medium text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
                            {status}
                        </div>
                    )}

                    <form onSubmit={submit} noValidate className="mt-8 space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <div className="relative">
                                <Mail className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" aria-hidden="true" />
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    autoFocus
                                    autoComplete="email"
                                    tabIndex={1}
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="contoh@gereja.org"
                                    className="h-12 pl-10"
                                    aria-invalid={!!errors.email}
                                />
                            </div>
                            <InputError message={errors.email} />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Kata sandi</Label>
                                {canResetPassword && (
                                    <Link href={route('password.request')} tabIndex={5} className="text-primary text-sm font-medium hover:underline">
                                        Lupa kata sandi?
                                    </Link>
                                )}
                            </div>
                            <div className="relative">
                                <Lock className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" aria-hidden="true" />
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    autoComplete="current-password"
                                    tabIndex={2}
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="Masukkan kata sandi"
                                    className="h-12 pr-11 pl-10"
                                    aria-invalid={!!errors.password}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                                    aria-pressed={showPassword}
                                    className="text-muted-foreground hover:text-foreground focus-visible:ring-ring absolute top-1/2 right-2 flex size-9 -translate-y-1/2 items-center justify-center rounded-md focus-visible:ring-2 focus-visible:outline-hidden"
                                >
                                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                </button>
                            </div>
                            <InputError message={errors.password} />
                        </div>

                        <div className="flex items-center gap-2.5">
                            <Checkbox
                                id="remember"
                                name="remember"
                                tabIndex={3}
                                checked={data.remember}
                                onCheckedChange={(checked) => setData('remember', checked === true)}
                            />
                            <Label htmlFor="remember" className="text-muted-foreground font-normal">
                                Ingat saya di perangkat ini
                            </Label>
                        </div>

                        <Button type="submit" size="lg" className="h-12 w-full gap-2 text-base" tabIndex={4} disabled={processing}>
                            {processing ? <LoaderCircle className="size-4 animate-spin" /> : null}
                            Masuk
                            {!processing && <ArrowRight className="size-4" />}
                        </Button>
                    </form>


                    {demoAccounts.length > 0 && (
                        <section className="mt-8 border-t pt-6" aria-labelledby="demo-title">
                            <h3 id="demo-title" className="text-sm font-medium">
                                Coba sebagai
                            </h3>
                            <p className="text-muted-foreground mt-1 text-sm">Masuk satu klik ke akun contoh untuk melihat tampilan tiap peran.</p>
                            <div className="mt-4 grid gap-2 sm:grid-cols-2">
                                {demoAccounts.map((account) => (
                                    <button
                                        key={account.email}
                                        type="button"
                                        disabled={processing}
                                        onClick={() => router.post(route('demo.login'), { email: account.email })}
                                        className="hover:bg-accent focus-visible:ring-ring rounded-lg border px-3 py-2.5 text-left transition-colors focus-visible:ring-2 focus-visible:outline-hidden disabled:opacity-50"
                                    >
                                        <span className="block text-sm font-medium">{account.role}</span>
                                        <span className="text-muted-foreground block truncate text-xs">{account.name}</span>
                                    </button>
                                ))}
                            </div>
                        </section>
                    )}

                    <p className="text-muted-foreground mt-8 text-center text-sm">
                        Ingin melihat laporan kas?{' '}
                        <Link href="/transparansi" className="text-primary font-medium hover:underline">
                            Buka halaman transparansi
                        </Link>
                    </p>
                </div>

                <p className="text-muted-foreground mt-12 text-xs">&copy; {new Date().getFullYear()} {brand.church_name}. Semua hak dilindungi.</p>
            </main>
        </div>
    );
}
