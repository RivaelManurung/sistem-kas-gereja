<?php

namespace App\Services;

use App\Enums\Direction;
use App\Enums\ExpenseStatus;
use App\Enums\Role;
use App\Models\AccountingPeriod;
use App\Models\ChurchSetting;
use App\Models\Expense;
use App\Models\LedgerEntry;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use LogicException;

class ExpenseService
{
    public function submit(array $data, User $submitter, UploadedFile|string $proof): Expense
    {
        $proofPath = $proof instanceof UploadedFile
            ? $proof->store('expenses', 'public')
            : (string) $proof;

        if (empty($proofPath)) {
            throw ValidationException::withMessages([
                'proof' => 'Bukti nota/kuitansi fisik wajib disertakan.',
            ]);
        }

        if (AccountingPeriod::isDateClosed($data['date'])) {
            throw ValidationException::withMessages([
                'date' => 'Tidak dapat mengajukan pengeluaran pada periode akuntansi yang sudah ditutup.',
            ]);
        }

        return Expense::create([
            'expense_number' => Expense::generateExpenseNumber(),
            'payee' => $data['payee'],
            'amount' => (int) $data['amount'],
            'date' => $data['date'],
            'account_id' => $data['account_id'],
            'fund_id' => $data['fund_id'],
            'category_id' => $data['category_id'],
            'event_id' => $data['event_id'] ?? null,
            'description' => $data['description'] ?? null,
            'proof_path' => $proofPath,
            'status' => ExpenseStatus::Pending,
            'submitted_by' => $submitter->id,
            'notes' => $data['notes'] ?? null,
        ]);
    }

    public function approve(Expense $expense, User $approver, ?string $notes = null): Expense
    {
        if ($expense->status !== ExpenseStatus::Pending) {
            throw new LogicException('Pengeluaran ini tidak dalam status menunggu persetujuan.');
        }

        // Anti self-approval
        if ($expense->submitted_by === $approver->id) {
            abort(403, 'Pengaju tidak boleh menyetujui pengeluarannya sendiri.');
        }

        // Check authorized roles
        if (! $approver->hasAnyRole([Role::Bendahara->value, Role::Majelis->value, Role::Admin->value])) {
            abort(403, 'Anda tidak memiliki wewenang untuk menyetujui pengeluaran.');
        }

        // Check multi-tier threshold
        $setting = ChurchSetting::current();
        $threshold = (int) $setting->expense_approval_threshold;
        if ($threshold > 0 && $expense->amount > $threshold) {
            if (! $approver->hasAnyRole([Role::Majelis->value, Role::Admin->value])) {
                abort(403, 'Pengeluaran di atas ambang batas memerlukan persetujuan Majelis.');
            }
        }

        // Negative balance protection
        $balance = LedgerEntry::getBalance($expense->fund_id);
        if ($balance < $expense->amount && ! $setting->allow_negative_balance) {
            throw ValidationException::withMessages([
                'fund_id' => 'Saldo dana tidak mencukupi untuk menyetujui pengeluaran ini.',
            ]);
        }

        // Closed period check
        if (AccountingPeriod::isDateClosed($expense->date)) {
            throw ValidationException::withMessages([
                'date' => 'Periode akuntansi pada tanggal pengeluaran ini sudah ditutup.',
            ]);
        }

        $expense->update([
            'status' => ExpenseStatus::Approved,
            'approved_by' => $approver->id,
            'approved_at' => now(),
            'notes' => $notes ?? $expense->notes,
        ]);

        return $expense;
    }

    public function reject(Expense $expense, User $user, ?string $notes = null): Expense
    {
        if ($expense->status !== ExpenseStatus::Pending) {
            throw new LogicException('Pengeluaran ini tidak dalam status menunggu persetujuan.');
        }

        if ($expense->submitted_by === $user->id) {
            abort(403, 'Pengaju tidak dapat memproses pengeluarannya sendiri.');
        }

        if (! $user->hasAnyRole([Role::Bendahara->value, Role::Majelis->value, Role::Admin->value])) {
            abort(403, 'Anda tidak memiliki wewenang untuk menolak pengeluaran.');
        }

        $expense->update([
            'status' => ExpenseStatus::Rejected,
            'notes' => $notes ?? $expense->notes,
        ]);

        return $expense;
    }

    public function pay(Expense $expense, User $payer): Expense
    {
        if ($expense->status !== ExpenseStatus::Approved) {
            throw new LogicException('Hanya pengeluaran yang sudah disetujui yang dapat dibayar.');
        }

        if (! $payer->hasAnyRole([Role::Bendahara->value, Role::Admin->value])) {
            abort(403, 'Hanya Bendahara atau Admin yang berhak melakukan pembayaran pengeluaran.');
        }

        $setting = ChurchSetting::current();
        $balance = LedgerEntry::getBalance($expense->fund_id);
        if ($balance < $expense->amount && ! $setting->allow_negative_balance) {
            throw ValidationException::withMessages([
                'fund_id' => 'Saldo dana tidak mencukupi untuk membayar pengeluaran ini.',
            ]);
        }

        if (AccountingPeriod::isDateClosed($expense->date)) {
            throw ValidationException::withMessages([
                'date' => 'Periode akuntansi pada tanggal pengeluaran ini sudah ditutup.',
            ]);
        }

        return DB::transaction(function () use ($expense) {
            LedgerService::record([
                'entry_date' => $expense->date->toDateString(),
                'account_id' => $expense->account_id,
                'fund_id' => $expense->fund_id,
                'category_id' => $expense->category_id,
                'amount' => $expense->amount,
                'direction' => Direction::Out,
                'description' => "Pengeluaran #{$expense->expense_number}: {$expense->payee}" . ($expense->description ? " - {$expense->description}" : ''),
                'source_type' => 'expense',
                'source_id' => $expense->id,
                'idempotency_key' => "exp-{$expense->id}-out",
            ]);

            $expense->update([
                'status' => ExpenseStatus::Paid,
                'paid_at' => now(),
            ]);

            return $expense;
        });
    }
}
