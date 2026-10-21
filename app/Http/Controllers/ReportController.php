<?php

namespace App\Http\Controllers;

use App\Enums\Direction;
use App\Enums\Role;
use App\Models\ChurchSetting;
use App\Models\CountSheet;
use App\Models\FrozenReport;
use App\Models\LedgerEntry;
use App\Models\ReportApproval;
use App\Models\ServiceSession;
use App\Services\FinancialReportService;
use App\Services\PdfReportService;
use App\Services\ReportFreezeService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    /**
     * Display a listing of reports and current live period report calculation.
     */
    public function index(Request $request, FinancialReportService $reportService): Response
    {
        $periodType = $request->input('period_type', 'bulanan');
        $resolved = $reportService->resolvePeriod(
            $periodType,
            $request->input('from'),
            $request->input('to'),
            $request->integer('year') ?: null,
            $request->integer('month') ?: null,
            $request->integer('quarter') ?: null,
            $request->integer('semester') ?: null,
            $request->input('date')
        );

        $liveData = $reportService->generate($resolved['start_date'], $resolved['end_date']);

        $frozenReports = FrozenReport::with(['creator', 'approvals'])
            ->latest('start_date')
            ->paginate(15)
            ->withQueryString();

        $user = $request->user();
        $canInitiate = $user && $user->hasAnyRole([Role::Bendahara->value, Role::Admin->value]);

        return Inertia::render('reports/index', [
            'period' => $resolved,
            'live_data' => $liveData,
            'reports' => $frozenReports,
            'can_initiate' => $canInitiate,
            'has_signature' => $user && ! empty($user->signature_path),
        ]);
    }

    /**
     * Initiate and store a report for approval.
     */
    public function store(Request $request, ReportFreezeService $freezeService): RedirectResponse
    {
        $user = $request->user();
        if (! $user->hasAnyRole([Role::Bendahara->value, Role::Admin->value])) {
            abort(403, 'Hanya Bendahara atau Admin yang dapat mengajukan laporan untuk pengesahan.');
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'period_type' => ['required', 'string'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
        ]);

        $report = $freezeService->initiate($validated, $user);

        return redirect()->route('reports.show', $report)
            ->with('success', 'Laporan berhasil dibuat dan diajukan untuk proses pengesahan tanda tangan.');
    }

    /**
     * Display the specified report details, approvals, and signatures.
     */
    public function show(Request $request, FrozenReport $report): Response
    {
        $report->load(['creator', 'approvals.user']);
        $user = $request->user();

        // Check if current user is eligible to sign any pending approval slot
        $userPendingApproval = null;
        if ($user && $report->status === FrozenReport::STATUS_PENDING) {
            $userPendingApproval = $report->approvals->first(function ($app) use ($user) {
                if ($app->status !== ReportApproval::STATUS_PENDING) {
                    return false;
                }
                if ($app->user_id && $app->user_id === $user->id) {
                    return true;
                }
                if (! $app->user_id && $app->role && ($user->hasRole($app->role) || $user->hasRole(Role::Admin->value))) {
                    return true;
                }
                return false;
            });
        }

        return Inertia::render('reports/show', [
            'report' => [
                'id' => $report->id,
                'title' => $report->title,
                'period_type' => $report->period_type,
                'start_date' => $report->start_date->toDateString(),
                'end_date' => $report->end_date->toDateString(),
                'status' => $report->status,
                'is_frozen' => $report->isFrozen(),
                'frozen_at' => $report->frozen_at?->translatedFormat('d F Y H:i:s'),
                'sha256_hash' => $report->sha256_hash,
                'verification_code' => $report->verification_code,
                'data_snapshot' => $report->data_snapshot,
                'creator' => [
                    'id' => $report->creator?->id,
                    'name' => $report->creator?->name,
                ],
                'approvals' => $report->approvals->map(fn ($app) => [
                    'id' => $app->id,
                    'order' => $app->order,
                    'title' => $app->signatory_title,
                    'position' => $app->signatory_position,
                    'role' => $app->role,
                    'user_id' => $app->user_id,
                    'signer_name' => $app->signer_name ?? $app->user?->name,
                    'status' => $app->status,
                    'approved_at' => $app->approved_at?->translatedFormat('d F Y H:i'),
                    'notes' => $app->notes,
                    'has_signature' => ! empty($app->signature_path),
                ]),
            ],
            'user_pending_approval_id' => $userPendingApproval?->id,
            'has_user_signature' => $user && ! empty($user->signature_path),
            'verification_url' => url('/verify-report/'.$report->verification_code),
        ]);
    }

    /**
     * Approve an approval slot by the authenticated signatory.
     */
    public function approve(
        Request $request,
        FrozenReport $report,
        ReportApproval $approval,
        ReportFreezeService $freezeService
    ): RedirectResponse {
        $notes = $request->input('notes');

        $freezeService->approve($report, $approval, $request->user(), $notes);

        $report->refresh();
        $message = $report->isFrozen()
            ? 'Persetujuan berhasil diberikan. Semua penanda tangan telah menyetujui dan laporan resmi telah DIBEKUKAN.'
            : 'Persetujuan dan tanda tangan berhasil dibubuhkan.';

        return redirect()->route('reports.show', $report)
            ->with('success', $message);
    }

    /**
     * Download or stream the PDF of the financial report.
     */
    public function pdf(FrozenReport $report, PdfReportService $pdfService): StreamedResponse
    {
        if ($report->isFrozen() && $report->pdf_path && Storage::disk('local')->exists($report->pdf_path)) {
            $content = Storage::disk('local')->get($report->pdf_path);
        } else {
            $content = $pdfService->renderOfficialReport($report);
        }

        $filename = 'Laporan-'.preg_replace('/[^A-Za-z0-9_\-]/', '_', $report->title).'.pdf';

        return response()->streamDownload(function () use ($content) {
            echo $content;
        }, $filename, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="'.$filename.'"',
        ]);
    }

    /**
     * Display the weekly bulletin preview (Warta Jemaat Mingguan).
     */
    public function bulletin(Request $request, FinancialReportService $reportService): Response
    {
        $bulletinData = $this->buildBulletinData($request, $reportService);

        return Inertia::render('reports/bulletin', $bulletinData);
    }

    /**
     * Download weekly bulletin PDF.
     */
    public function bulletinPdf(
        Request $request,
        FinancialReportService $reportService,
        PdfReportService $pdfService
    ): StreamedResponse {
        $bulletinData = $this->buildBulletinData($request, $reportService);
        $content = $pdfService->renderBulletin($bulletinData);

        $filename = 'Warta-Keuangan-Mingguan-'.$bulletinData['start_date'].'.pdf';

        return response()->streamDownload(function () use ($content) {
            echo $content;
        }, $filename, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="'.$filename.'"',
        ]);
    }

    /**
     * Helper to assemble weekly bulletin data.
     */
    protected function buildBulletinData(Request $request, FinancialReportService $reportService): array
    {
        $targetDate = $request->input('date') ? Carbon::parse($request->input('date')) : now();
        $start = $targetDate->copy()->startOfWeek(Carbon::MONDAY);
        $end = $start->copy()->addDays(6);

        $startDate = $start->toDateString();
        $endDate = $end->toDateString();

        $financial = $reportService->generate($startDate, $endDate);

        // Fetch worship service sessions in this week
        $sessions = ServiceSession::with(['schedule', 'countSheets.lines.category'])
            ->whereBetween('date', [$startDate, $endDate])
            ->orderBy('date')
            ->get();

        $sessionsBreakdown = [];
        foreach ($sessions as $session) {
            $sessionDate = $session->date instanceof \DateTimeInterface
                ? $session->date->format('d M')
                : Carbon::parse($session->date)->translatedFormat('d M');
            $sessionTitle = ($session->schedule?->name ?? $session->name ?? 'Ibadah').' ('.$sessionDate.')';
            foreach ($session->countSheets as $sheet) {
                foreach ($sheet->lines as $line) {
                    if ($line->amount > 0) {
                        $sessionsBreakdown[] = [
                            'session_name' => $sessionTitle,
                            'category_name' => $line->category?->name ?? 'Kolekte',
                            'amount' => $line->amount,
                        ];
                    }
                }
            }
        }

        $church = ChurchSetting::current();

        return [
            'start_date' => $startDate,
            'end_date' => $endDate,
            'date_range' => $start->translatedFormat('d F Y').' - '.$end->translatedFormat('d F Y'),
            'period_label' => 'Minggu, '.$end->translatedFormat('d F Y'),
            'sessions_breakdown' => $sessionsBreakdown,
            'incomes' => $financial['incomes']['by_category'],
            'expenses' => $financial['expenses']['by_category'],
            'total_income' => $financial['incomes']['total'],
            'total_expense' => $financial['expenses']['total'],
            'opening_balance' => $financial['opening_balances']['total'],
            'closing_balance' => $financial['closing_balances']['total'],
            'church' => [
                'name' => $church->name ?? 'Gereja',
                'address' => $church->address,
                'city' => $church->city,
                'phone' => $church->phone,
                'email' => $church->email,
            ],
        ];
    }
}
