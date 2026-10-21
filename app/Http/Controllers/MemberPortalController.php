<?php

namespace App\Http\Controllers;

use App\Models\ChurchSetting;
use App\Models\Donation;
use App\Models\Member;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MemberPortalController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $member = Member::forUser($user);

        if (! $member) {
            return Inertia::render('portal/index', [
                'isLinked' => false,
                'member' => null,
                'donations' => null,
                'summary' => null,
                'availableYears' => [],
            ]);
        }

        $selectedYear = $request->filled('year') ? (int) $request->input('year') : null;
        $currentYear = (int) now()->format('Y');

        $query = Donation::with('category:id,name')
            ->where('member_id', $member->id);

        if ($selectedYear !== null) {
            $query->whereYear('created_at', $selectedYear);
        }

        $donations = $query->orderByDesc('created_at')
            ->paginate(15)
            ->withQueryString();

        $thisYearTotal = (int) Donation::where('member_id', $member->id)
            ->whereYear('created_at', $currentYear)
            ->sum('amount');

        $allTimeTotal = (int) Donation::where('member_id', $member->id)
            ->sum('amount');

        $donationCount = (int) Donation::where('member_id', $member->id)
            ->count();

        // Distinct years from donations
        $availableYears = Donation::where('member_id', $member->id)
            ->selectRaw('DISTINCT EXTRACT(YEAR FROM created_at)::int as yr')
            ->orderByDesc('yr')
            ->pluck('yr')
            ->all();

        if (empty($availableYears)) {
            $availableYears = [$currentYear];
        }

        // Summary by Category
        $byCategory = Donation::where('member_id', $member->id)
            ->join('categories', 'donations.category_id', '=', 'categories.id')
            ->selectRaw('categories.name as category_name, sum(donations.amount)::bigint as amount')
            ->groupBy('categories.name')
            ->get()
            ->map(fn ($row) => [
                'category_name' => $row->category_name,
                'amount' => (int) $row->amount,
            ])
            ->values()
            ->all();

        return Inertia::render('portal/index', [
            'isLinked' => true,
            'member' => [
                'id' => $member->id,
                'member_number' => $member->member_number,
                'name' => $member->name,
                'phone' => $member->phone,
                'email' => $member->email,
                'address' => $member->address,
            ],
            'donations' => $donations,
            'summary' => [
                'thisYearTotal' => $thisYearTotal,
                'allTimeTotal' => $allTimeTotal,
                'count' => $donationCount,
                'byCategory' => $byCategory,
            ],
            'availableYears' => $availableYears,
            'selectedYear' => $selectedYear,
        ]);
    }

    public function receipt(Request $request, Donation $donation): Response
    {
        $member = Member::forUser($request->user());

        if (! $member) {
            abort(403, 'Akses ditolak: Akun Anda belum terhubung dengan data jemaat.');
        }

        // Strict IDOR protection: cannot access another member's receipt
        if ($donation->member_id !== $member->id) {
            abort(403, 'Anda tidak memiliki hak akses untuk bukti persembahan ini.');
        }

        $donation->load('category:id,name');
        $setting = ChurchSetting::current();

        return Inertia::render('portal/receipt', [
            'churchName' => $setting->name ?? 'Gereja',
            'member' => [
                'id' => $member->id,
                'member_number' => $member->member_number,
                'name' => $member->name,
                'phone' => $member->phone,
                'email' => $member->email,
                'address' => $member->address,
            ],
            'donation' => [
                'id' => $donation->id,
                'receipt_number' => $donation->receipt_number,
                'amount' => $donation->amount,
                'payment_method' => $donation->payment_method,
                'date' => $donation->created_at?->format('d M Y, H:i'),
                'notes' => $donation->notes,
                'category_name' => $donation->category?->name,
            ],
        ]);
    }

    public function statement(Request $request): Response
    {
        $member = Member::forUser($request->user());

        if (! $member) {
            abort(403, 'Akses ditolak: Akun Anda belum terhubung dengan data jemaat.');
        }

        $year = (int) $request->input('year', now()->year);

        $donations = Donation::with('category:id,name')
            ->where('member_id', $member->id)
            ->whereYear('created_at', $year)
            ->orderBy('created_at')
            ->get()
            ->map(fn (Donation $d) => [
                'id' => $d->id,
                'receipt_number' => $d->receipt_number,
                'date' => $d->created_at?->format('d M Y'),
                'amount' => $d->amount,
                'payment_method' => $d->payment_method,
                'category_name' => $d->category?->name,
                'notes' => $d->notes,
            ]);

        $totalAmount = (int) $donations->sum('amount');

        // Group by category
        $byCategory = [];
        foreach ($donations as $don) {
            $cat = $don['category_name'] ?? 'Lain-lain';
            $byCategory[$cat] = ($byCategory[$cat] ?? 0) + $don['amount'];
        }

        $categorySummary = [];
        foreach ($byCategory as $name => $amt) {
            $categorySummary[] = [
                'name' => $name,
                'amount' => $amt,
            ];
        }

        $setting = ChurchSetting::current();

        return Inertia::render('portal/statement', [
            'churchName' => $setting->name ?? 'Gereja',
            'member' => [
                'id' => $member->id,
                'member_number' => $member->member_number,
                'name' => $member->name,
                'phone' => $member->phone,
                'email' => $member->email,
                'address' => $member->address,
            ],
            'year' => $year,
            'donations' => $donations->values()->all(),
            'totalAmount' => $totalAmount,
            'byCategory' => $categorySummary,
        ]);
    }
}
