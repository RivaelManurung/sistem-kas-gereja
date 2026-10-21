<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AuditLogController extends Controller
{
    public function index(Request $request): Response
    {
        $types = array_keys(Relation::morphMap());

        $filters = $request->validate([
            'type' => ['nullable', 'string', Rule::in($types)],
            'from' => ['nullable', 'date_format:Y-m-d'],
            'to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:from'],
        ]);

        $logs = AuditLog::query()
            ->with('user:id,name')
            ->when($filters['type'] ?? null, fn ($q, $type) => $q->where('auditable_type', $type))
            ->when($filters['from'] ?? null, fn ($q, $from) => $q->where('created_at', '>=', $from.' 00:00:00'))
            ->when($filters['to'] ?? null, fn ($q, $to) => $q->where('created_at', '<=', $to.' 23:59:59'))
            ->orderByDesc('id')
            ->paginate(25)
            ->withQueryString()
            ->through(fn (AuditLog $log) => [
                'id' => $log->id,
                'user' => $log->user?->name,
                'auditable_type' => $log->auditable_type,
                'auditable_id' => $log->auditable_id,
                'event' => $log->event,
                'old_values' => $log->old_values,
                'new_values' => $log->new_values,
                'ip_address' => $log->ip_address,
                'created_at' => $log->created_at?->toIso8601String(),
            ]);

        return Inertia::render('admin/audit/index', [
            'logs' => $logs,
            'filters' => [
                'type' => $filters['type'] ?? '',
                'from' => $filters['from'] ?? '',
                'to' => $filters['to'] ?? '',
            ],
            'types' => $types,
        ]);
    }
}
