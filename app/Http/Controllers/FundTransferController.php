<?php

namespace App\Http\Controllers;

use App\Enums\Permission;
use App\Enums\FundTransferStatus;
use App\Enums\Role;
use App\Http\Requests\FundTransferRequest;
use App\Models\Account;
use App\Models\ChurchSetting;
use App\Models\Fund;
use App\Models\FundTransfer;
use App\Models\LedgerEntry;
use App\Services\FundTransferService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FundTransferController extends Controller
{
    public function index(Request $request): Response
    {
        $transfers = FundTransfer::query()
            ->with(['fromFund', 'toFund', 'account', 'requester', 'approver'])
            ->orderByDesc('transfer_date')
            ->orderByDesc('id')
            ->paginate(20)
            ->withQueryString();

        $user = auth()->user();
        $canApproveRole = $user && $user->can(Permission::TransfersApprove->value);

        return Inertia::render('transfers/index', [
            'transfers' => $transfers,
            'canApproveRole' => $canApproveRole,
            'currentUserId' => $user?->id,
        ]);
    }

    public function create(): Response
    {
        $funds = Fund::active()->orderBy('name')->get();
        $accounts = Account::active()->orderBy('name')->get();

        return Inertia::render('transfers/create', [
            'funds' => $funds,
            'accounts' => $accounts,
            'today' => now()->toDateString(),
        ]);
    }

    public function store(FundTransferRequest $request, FundTransferService $transferService): RedirectResponse
    {
        $transfer = $transferService->request($request->validated(), $request->user());

        return redirect()->route('transfers.index')
            ->with('success', 'Permohonan pindah dana berhasil diajukan.');
    }

    public function show(FundTransfer $transfer): Response
    {
        $transfer->load(['fromFund', 'toFund', 'account', 'requester', 'approver']);
        $fromBalance = LedgerEntry::getBalance($transfer->from_fund_id);
        $setting = ChurchSetting::current();

        $user = auth()->user();
        $isRequester = $user && $transfer->requested_by === $user->id;
        $canApproveRole = $user && $user->can(Permission::TransfersApprove->value);
        $canApprove = ! $isRequester && $transfer->status === FundTransferStatus::Pending && $canApproveRole;

        return Inertia::render('transfers/index', [
            'selectedTransfer' => $transfer,
            'fromBalance' => $fromBalance,
            'setting' => $setting,
            'canApprove' => $canApprove,
        ]);
    }

    public function approve(Request $request, FundTransfer $transfer, FundTransferService $transferService): RedirectResponse
    {
        $transferService->approve($transfer, $request->user(), $request->input('notes'));

        return redirect()->route('transfers.index')
            ->with('success', 'Permohonan pindah dana berhasil disetujui dan dibukukan ke buku besar.');
    }

    public function reject(Request $request, FundTransfer $transfer, FundTransferService $transferService): RedirectResponse
    {
        $request->validate([
            'notes' => ['required', 'string', 'max:1000'],
        ], [
            'notes.required' => 'Alasan penolakan pindah dana wajib diisi.',
        ]);

        $transferService->reject($transfer, $request->user(), $request->input('notes'));

        return redirect()->route('transfers.index')
            ->with('success', 'Permohonan pindah dana telah ditolak.');
    }
}
