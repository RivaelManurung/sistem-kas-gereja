<?php

namespace App\Http\Controllers;

use App\Enums\Direction;
use App\Http\Requests\DonationRequest;
use App\Models\Category;
use App\Models\CountSheet;
use App\Models\Donation;
use App\Models\Member;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DonationController extends Controller
{
    public function index(Request $request): Response
    {
        $donations = Donation::query()
            ->with(['member', 'category', 'countSheet'])
            ->when($request->query('search'), function ($q, $search) {
                $escaped = str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $search);
                $q->where('receipt_number', 'ilike', "%{$escaped}%")
                    ->orWhere('donor_name', 'ilike', "%{$escaped}%")
                    ->orWhereHas('member', fn ($mq) => $mq->where('name', 'ilike', "%{$escaped}%"));
            })
            ->when($request->query('category_id'), fn ($q, $catId) => $q->where('category_id', $catId))
            ->orderByDesc('id')
            ->paginate(20)
            ->withQueryString();

        $categories = Category::active()
            ->where('direction', Direction::In)
            ->where('allows_named', true)
            ->orderBy('name')
            ->get();

        return Inertia::render('donations/index', [
            'donations' => $donations,
            'categories' => $categories,
            'filters' => $request->only(['search', 'category_id']),
        ]);
    }

    public function create(Request $request): Response
    {
        $sheetId = $request->query('count_sheet_id');
        $sheet = $sheetId ? CountSheet::with('lines.category')->find($sheetId) : null;

        $categories = Category::active()
            ->where('direction', Direction::In)
            ->where('allows_named', true)
            ->orderBy('name')
            ->get();

        $members = Member::active()->orderBy('name')->get();

        return Inertia::render('donations/form', [
            'sheet' => $sheet,
            'categories' => $categories,
            'members' => $members,
        ]);
    }

    public function store(DonationRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $data['receipt_number'] = Donation::generateReceiptNumber();
        $data['payment_method'] = $data['payment_method'] ?? 'cash';

        $donation = Donation::create($data);

        if ($donation->count_sheet_id) {
            return redirect()->route('counting.show', $donation->count_sheet_id)
                ->with('success', "Tanda terima {$donation->receipt_number} berhasil dicatat.");
        }

        return redirect()->route('donations.index')
            ->with('success', "Persembahan atas nama {$donation->receipt_number} berhasil disimpan.");
    }

    public function show(Donation $donation): Response
    {
        $donation->load(['member', 'category', 'countSheet']);

        return Inertia::render('donations/show', [
            'donation' => $donation,
        ]);
    }
}
