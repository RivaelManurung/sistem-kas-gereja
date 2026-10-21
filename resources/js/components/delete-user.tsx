import { useForm } from '@inertiajs/react';
import { FormEventHandler, useRef, useState } from 'react';

import { ConfirmDialog } from '@/components/app/confirm-dialog';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SettingsSection } from '@/layouts/settings/layout';

export default function DeleteUser() {
    const passwordInput = useRef<HTMLInputElement>(null);
    const [open, setOpen] = useState(false);
    const { data, setData, delete: destroy, processing, reset, errors } = useForm({ password: '' });

    const destroyAccount = () => {
        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onError: () => passwordInput.current?.focus(),
            onFinish: () => reset(),
        });
    };

    const requestDelete: FormEventHandler = (e) => {
        e.preventDefault();
        setOpen(true);
    };

    return (
        <SettingsSection title="Hapus akun" description="Menghapus akun akan menghilangkan seluruh data terkait secara permanen.">
            <Card className="border-destructive/30">
                <form onSubmit={requestDelete}>
                    <CardContent className="space-y-5 p-5 md:p-6">
                        <p className="text-sm text-muted-foreground">
                            Tindakan ini tidak dapat dibatalkan. Masukkan kata sandi Anda untuk melanjutkan.
                        </p>
                        <div className="grid gap-2">
                            <Label htmlFor="delete_password">Kata sandi</Label>
                            <Input
                                id="delete_password"
                                type="password"
                                name="password"
                                ref={passwordInput}
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                autoComplete="current-password"
                            />
                            <InputError message={errors.password} />
                        </div>
                    </CardContent>
                    <CardFooter className="justify-end rounded-b-xl border-t border-destructive/30 bg-destructive/5 px-5 py-4 md:px-6">
                        <Button type="submit" variant="destructive" disabled={processing || data.password === ''}>
                            Hapus akun
                        </Button>
                    </CardFooter>
                </form>
            </Card>

            <ConfirmDialog
                open={open}
                onOpenChange={setOpen}
                title="Hapus akun Anda?"
                description="Akun dan seluruh data profil Anda akan dihapus secara permanen dan tidak dapat dipulihkan."
                confirmLabel="Hapus akun"
                destructive
                onConfirm={destroyAccount}
            />
        </SettingsSection>
    );
}
