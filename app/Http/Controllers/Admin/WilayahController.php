<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Household;
use App\Models\LookupOption;
use App\Models\Member;
use App\Models\Wilayah;
use App\Support\Lookups;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class WilayahController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->validate(['search' => ['nullable', 'string', 'max:100'], 'aktif' => ['nullable', 'in:1,0']]);

        $wilayahs = Wilayah::query()
            ->withCount(['households', 'members'])
            ->with(['officers' => fn ($q) => $q->where(fn ($w) => $w->whereNull('end_date')->orWhere('end_date', '>=', now()->toDateString()))->with('member:id,name')])
            ->when($filters['search'] ?? null, fn ($q, $s) => $q->where(fn ($w) => $w->where('name', 'ilike', "%{$s}%")->orWhere('code', 'ilike', "%{$s}%")))
            ->when(isset($filters['aktif']), fn ($q) => $q->where('is_active', $filters['aktif'] === '1'))
            ->orderBy('code')->orderBy('name')
            ->get()
            ->map(fn (Wilayah $w) => [
                'id' => $w->id,
                'name' => $w->name,
                'code' => $w->code,
                'meeting_info' => $w->meeting_info,
                'households_count' => $w->households_count,
                'members_count' => $w->members_count,
                'is_active' => $w->is_active,
                'officers' => $w->officers->map(fn ($o) => ['role' => Lookups::label('wilayah_role', $o->role), 'role_key' => $o->role, 'name' => $o->member?->name])->values(),
            ]);

        return Inertia::render('admin/wilayah/index', [
            'wilayahs' => $wilayahs,
            'filters' => ['search' => $filters['search'] ?? '', 'aktif' => $filters['aktif'] ?? ''],
            'totals' => ['wilayah' => Wilayah::count(), 'households' => Household::whereNotNull('wilayah_id')->count(), 'unassigned' => Household::whereNull('wilayah_id')->count()],
        ]);
    }

    public function show(Wilayah $wilayah): Response
    {
        $wilayah->load(['officers.member:id,name,member_number,phone,membership_status']);

        $households = $wilayah->households()->withCount('members')->with('head:id,household_id,name')->orderBy('name')->get();

        return Inertia::render('admin/wilayah/show', [
            'wilayah' => $wilayah->only(['id', 'name', 'code', 'description', 'coverage', 'meeting_info', 'is_active']),
            'stats' => [
                'households' => $households->count(),
                'members' => (int) $households->sum('members_count'),
                'active_members' => Member::whereIn('household_id', $households->pluck('id'))->where('is_active', true)->count(),
            ],
            'officers' => $wilayah->officers->sortBy(fn ($o) => [$o->end_date ? 1 : 0, array_search($o->role, ['penatua', 'ketua', 'diaken', 'sekretaris', 'bendahara', 'koordinator']) ?: 99, $o->member?->name])->values()->map(fn ($o) => [
                'id' => $o->id,
                'member_id' => $o->member_id,
                'member_name' => $o->member?->name,
                'member_number' => $o->member?->member_number,
                'phone' => $o->member?->phone,
                'role' => $o->role,
                'role_label' => Lookups::label('wilayah_role', $o->role),
                'start_date' => $o->start_date?->toDateString(),
                'end_date' => $o->end_date?->toDateString(),
                'is_current' => $o->isCurrent(),
                'notes' => $o->notes,
            ]),
            'households' => $households->map(fn (Household $h) => [
                'id' => $h->id,
                'name' => $h->name,
                'family_number' => $h->family_number,
                'head' => $h->head?->name,
                'members_count' => $h->members_count,
                'address' => $h->fullAddress(),
                'is_active' => $h->is_active,
            ]),
            'memberOptions' => Member::where('is_active', true)->orderBy('name')->get(['id', 'name', 'member_number'])->map(fn ($m) => ['id' => $m->id, 'name' => $m->name, 'member_number' => $m->member_number]),
            'roleOptions' => LookupOption::options('wilayah_role'),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/wilayah/form', ['wilayah' => null]);
    }

    public function store(Request $request): RedirectResponse
    {
        $wilayah = Wilayah::create($this->validated($request));

        return redirect()->route('admin.wilayah.show', $wilayah)->with('success', "{$wilayah->name} ditambahkan.");
    }

    public function edit(Wilayah $wilayah): Response
    {
        return Inertia::render('admin/wilayah/form', ['wilayah' => $wilayah->only(['id', 'name', 'code', 'description', 'coverage', 'meeting_info', 'is_active'])]);
    }

    public function update(Request $request, Wilayah $wilayah): RedirectResponse
    {
        $wilayah->update($this->validated($request, $wilayah));

        return redirect()->route('admin.wilayah.show', $wilayah)->with('success', 'Data wilayah diperbarui.');
    }

    public function toggle(Wilayah $wilayah): RedirectResponse
    {
        $wilayah->update(['is_active' => ! $wilayah->is_active]);

        return back()->with('success', $wilayah->is_active ? 'Wilayah diaktifkan.' : 'Wilayah dinonaktifkan.');
    }

    /** @return array<string, mixed> */
    private function validated(Request $request, ?Wilayah $wilayah = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:60', Rule::unique('wilayahs', 'name')->ignore($wilayah?->id)],
            'code' => ['nullable', 'string', 'max:10', Rule::unique('wilayahs', 'code')->ignore($wilayah?->id)],
            'description' => ['nullable', 'string', 'max:1000'],
            'coverage' => ['nullable', 'string', 'max:1000'],
            'meeting_info' => ['nullable', 'string', 'max:255'],
            'is_active' => ['boolean'],
        ], [
            'name.required' => 'Nama wilayah wajib diisi.',
            'name.unique' => 'Sudah ada wilayah dengan nama ini.',
            'code.unique' => 'Kode wilayah ini sudah dipakai.',
        ], ['name' => 'nama wilayah', 'code' => 'kode wilayah', 'coverage' => 'cakupan wilayah', 'meeting_info' => 'jadwal persekutuan']);
    }
}
