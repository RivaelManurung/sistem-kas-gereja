<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Support\AuditPresenter;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AuditLogController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'type' => ['nullable', 'string', Rule::in(array_keys(Relation::morphMap()))],
            'from' => ['nullable', 'date_format:Y-m-d'],
            'to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:from'],
        ]);

        $paginator = AuditLog::query()
            ->with('user:id,name')
            ->when($filters['type'] ?? null, fn ($q, $type) => $q->where('auditable_type', $type))
            ->when($filters['from'] ?? null, fn ($q, $from) => $q->where('created_at', '>=', $from.' 00:00:00'))
            ->when($filters['to'] ?? null, fn ($q, $to) => $q->where('created_at', '<=', $to.' 23:59:59'))
            ->orderByDesc('id')
            ->paginate(25)
            ->withQueryString();

        $presenter = new AuditPresenter($paginator->getCollection());

        return Inertia::render('admin/audit/index', [
            'logs' => $paginator->through(fn (AuditLog $log) => $presenter->summary($log)),
            'filters' => [
                'type' => $filters['type'] ?? '',
                'from' => $filters['from'] ?? '',
                'to' => $filters['to'] ?? '',
            ],
            'types' => AuditPresenter::entityOptions(),
        ]);
    }

    public function show(AuditLog $log): Response
    {
        $log->load('user:id,name');
        $presenter = new AuditPresenter(collect([$log]));

        return Inertia::render('admin/audit/show', [
            'log' => [
                ...$presenter->summary($log),
                'changes' => $presenter->changes($log),
            ],
        ]);
    }
}
