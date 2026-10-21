import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowRight,
    Building2,
    Check,
    KeyRound,
    LoaderCircle,
    Lock,
    LogIn,
    Mail,
    Shield,
    Sparkles,
    User,
    Users,
    Wallet,
} from 'lucide-react';
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
}

const DEMO_ACCOUNTS = [
    {
        role: 'Admin',
        email: 'admin@gereja.test',
        icon: Shield,
        desc: 'Pengaturan & Master Data',
        badgeColor: 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300',
    },
    {
        role: 'Bendahara',
        email: 'bendahara@gereja.test',
        icon: Wallet,
        desc: 'Verifikasi, Buku Besar & Pengeluaran',
        badgeColor: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300',
    },
    {
        role: 'Majelis',
        email: 'majelis@gereja.test',
        icon: Building2,
        desc: 'Persetujuan Pengeluaran & Laporan',
        badgeColor: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300',
    },
    {
        role: 'Penghitung',
        email: 'penghitung@gereja.test',
        icon: Users,
        desc: 'Hitung Kolekte & Berita Acara',
        badgeColor: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-300',
    },
    {
        role: 'Jemaat',
        email: 'jemaat@gereja.test',
        icon: User,
        desc: 'Portal Riwayat Persembahan Pribadi',
        badgeColor: 'border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-900/60 dark:bg-purple-950/40 dark:text-purple-300',
    },
];

export default function Login({ status, canResetPassword }: LoginProps) {
    const [selectedRole, setSelectedRole] = useState<string | null>(null);

    const { data, setData, post, processing, errors, reset } = useForm<LoginForm>({
        email: '',
        password: '',
        remember: false,
    });

    const handleSelectDemoAccount = (acc: (typeof DEMO_ACCOUNTS)[0]) => {
        setSelectedRole(acc.role);
        setData({
            ...data,
            email: acc.email,
            password: 'password',
        });
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-neutral-100/70 p-4 sm:p-6 lg:p-8 dark:bg-neutral-950">
            <Head title="Masuk ke Akun — Sistem Kas Gereja" />

            <div className="w-full max-w-md space-y-5">
                {/* Church Header & Identity */}
                <div className="flex flex-col items-center text-center">
                    <Link href="/" className="group mb-2 flex items-center gap-2.5 transition-transform hover:scale-105">
                        <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                            <Building2 className="size-6" />
                        </div>
                    </Link>
                    <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                        Sistem Kas & Persembahan Gereja
                    </h1>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        Pengelolaan keuangan transparan, akuntabel, dan terpercaya
                    </p>
                </div>

                {/* Main Shadcn Login Card */}
                <Card className="border border-neutral-200/80 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <CardHeader className="space-y-1 pb-4">
                        <CardTitle className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                            Masuk ke Akun
                        </CardTitle>
                        <CardDescription className="text-xs text-neutral-500 dark:text-neutral-400">
                            Silakan masukkan email dan kata sandi akun pelayanan Anda
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        {status && (
                            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-center text-xs font-medium text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
                                {status}
                            </div>
                        )}

                        {/* Quick Demo Accounts Helper Box */}
                        <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-3 dark:border-sky-900/50 dark:bg-sky-950/20">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-900 dark:text-sky-200">
                                    <KeyRound className="size-3.5 text-sky-600 dark:text-sky-400" />
                                    <span>Akun Demo Cepat</span>
                                </div>
                                <Badge className="bg-sky-600 font-mono text-[10px] text-white hover:bg-sky-700">
                                    Password: password
                                </Badge>
                            </div>
                            <p className="mt-1 text-[11px] text-sky-800/80 dark:text-sky-300/80">
                                Klik salah satu peran untuk mengisi email & kata sandi secara otomatis:
                            </p>

                            <div className="mt-2.5 flex flex-wrap gap-1.5">
                                {DEMO_ACCOUNTS.map((acc) => {
                                    const Icon = acc.icon;
                                    const isSelected = selectedRole === acc.role;

                                    return (
                                        <button
                                            key={acc.role}
                                            type="button"
                                            onClick={() => handleSelectDemoAccount(acc)}
                                            className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-all ${
                                                isSelected
                                                    ? 'border-primary bg-primary text-primary-foreground shadow-xs'
                                                    : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200'
                                            }`}
                                            title={`${acc.role}: ${acc.email} (${acc.desc})`}
                                        >
                                            <Icon className="size-3" />
                                            <span>{acc.role}</span>
                                            {isSelected && <Check className="size-3" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Form Inputs */}
                        <form onSubmit={submit} className="space-y-3.5">
                            <div className="space-y-1.5">
                                <Label htmlFor="email" className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                                    Alamat Email
                                </Label>
                                <div className="relative">
                                    <Mail className="absolute top-2.5 left-3 size-4 text-neutral-400" />
                                    <Input
                                        id="email"
                                        type="email"
                                        required
                                        autoFocus
                                        autoComplete="email"
                                        tabIndex={1}
                                        value={data.email}
                                        onChange={(e) => {
                                            setSelectedRole(null);
                                            setData('email', e.target.value);
                                        }}
                                        placeholder="admin@gereja.test"
                                        className="h-9 pl-9 text-xs"
                                    />
                                </div>
                                <InputError message={errors.email} />
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password" className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                                        Kata Sandi
                                    </Label>
                                    <span className="text-[11px] font-mono text-neutral-500">
                                        (default: <strong className="text-neutral-800 dark:text-neutral-200">password</strong>)
                                    </span>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute top-2.5 left-3 size-4 text-neutral-400" />
                                    <Input
                                        id="password"
                                        type="password"
                                        required
                                        tabIndex={2}
                                        autoComplete="current-password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        placeholder="Masukkan kata sandi"
                                        className="h-9 pl-9 text-xs"
                                    />
                                </div>
                                <InputError message={errors.password} />
                            </div>

                            <div className="flex items-center justify-between pt-1">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="remember"
                                        name="remember"
                                        tabIndex={3}
                                        checked={data.remember}
                                        onCheckedChange={(checked) => setData('remember', checked === true)}
                                    />
                                    <Label htmlFor="remember" className="text-xs text-neutral-600 dark:text-neutral-400">
                                        Ingat saya di perangkat ini
                                    </Label>
                                </div>
                            </div>

                            <Button type="submit" className="mt-2 h-9 w-full gap-1.5 text-xs font-semibold shadow-xs" tabIndex={4} disabled={processing}>
                                {processing ? (
                                    <LoaderCircle className="size-4 animate-spin" />
                                ) : (
                                    <LogIn className="size-4" />
                                )}
                                Masuk ke Sistem
                            </Button>
                        </form>
                    </CardContent>

                    <CardFooter className="flex flex-col gap-2 border-t border-neutral-100 pt-3 text-center dark:border-neutral-800">
                        <Link
                            href="/transparansi"
                            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                        >
                            <Sparkles className="size-3 text-emerald-500" />
                            <span>Lihat Halaman Transparansi Publik (Tanpa Login)</span>
                            <ArrowRight className="size-3" />
                        </Link>
                    </CardFooter>
                </Card>

                {/* Footer copyright */}
                <div className="text-center text-[11px] text-neutral-500">
                    &copy; {new Date().getFullYear()} Sistem Kas & Persembahan Gereja
                </div>
            </div>
        </div>
    );
}
