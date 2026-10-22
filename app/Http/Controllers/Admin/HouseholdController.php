<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Household;
use App\Models\LookupOption;
use App\Models\Member;
use App\Support\Lookups;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class HouseholdController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->validate(['search' => ['nullable', 'string', 'max:100'], 'aktif' => ['nullable', 'in:1,0']]);

        $households = Household::query()
            ->withCount('members')
            ->with('head:id,household_id,name', 'wilayah:id,name')
            ->search($filters['search'] ?? null)
            ->when(isset($filters['aktif']), fn ($q) => $q->where('is_active', $filters['aktif'] === '1'))
            ->orderBy('name')
            ->paginate(25)
            ->withQueryString()
            ->through(fn (Household $h) => [
                'id' => $h->id,
                'name' => $h->name,
                'family_number' => $h->family_number,
                'head' => $h->head?->name,
                'members_count' => $h->members_count,
                'address' => $h->fullAddress(),
                'phone' => $h->phone,
                'wilayah' => $h->wilayah?->name,
                'is_active' => $h->is_active,
            ]);

        return Inertia::render('admin/households/index', [
            'households' => $households,
            'filters' => ['search' => $filters['search'] ?? '', 'aktif' => $filters['aktif'] ?? ''],
        ]);
    }

    public function show(Household $household): Response
    {
        $household->load('wilayah:id,name');
        $members = $household->members()
            ->orderByRaw("case family_role when 'kepala_keluarga' then 0 when 'pasangan' then 1 else 2 end")
            ->orderBy('birth_date')
            ->get();

        return Inertia::render('admin/households/show', [
            'household' => [
                ...$household->only(['id', 'name', 'family_number', 'address', 'rt_rw', 'kelurahan', 'kecamatan', 'city', 'postal_code', 'phone', 'notes', 'is_active']),
                'housing_status' => Lookups::pair('housing_status', $household->housing_status),
                'wilayah' => $household->wilayah ? ['id' => $household->wilayah->id, 'name' => $household->wilayah->name] : null,
                'full_address' => $household->fullAddress(),
            ],
            'members' => $members->map(fn (Member $m) => [
                'id' => $m->id,
                'member_number' => $m->member_number,
                'name' => $m->name,
                'gender' => $m->gender,
                'age' => $m->age,
                'family_role' => Lookups::pair('family_role', $m->family_role),
                'status' => Lookups::pair('membership_status', $m->membership_status),
                'is_active' => $m->is_active,
            ]),
            'availableMembers' => Member::whereNull('household_id')->orderBy('name')->get(['id', 'name', 'member_number'])->map(fn ($m) => ['id' => $m->id, 'name' => $m->name, 'member_number' => $m->member_number]),
            'familyRoles' => LookupOption::options('family_role'),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/households/form', ['household' => null, 'housingStatus' => LookupOption::options('housing_status'), 'wilayahs' => $this->wilayahOptions(), 'nextNumber' => $this->nextNumber()]);
    }

    public function store(Request $request): RedirectResponse
    {
        $household = Household::create($this->validated($request));

        return redirect()->route('admin.households.show', $household)->with('success', "Keluarga {$household->name} ditambahkan.");
    }

    public function edit(Household $household): Response
    {
        return Inertia::render('admin/households/form', [
            'household' => $household->only(['id', 'name', 'family_number', 'address', 'rt_rw', 'kelurahan', 'kecamatan', 'city', 'postal_code', 'housing_status', 'wilayah_id', 'phone', 'notes', 'is_active']),
            'housingStatus' => LookupOption::options('housing_status'),
            'wilayahs' => $this->wilayahOptions(),
            'nextNumber' => null,
        ]);
    }

    public function update(Request $request, Household $household): RedirectResponse
    {
        $household->update($this->validated($request, $household));

        return redirect()->route('admin.households.show', $household)->with('success', 'Data keluarga diperbarui.');
    }

    public function toggle(Household $household): RedirectResponse
    {
        $household->update(['is_active' => ! $household->is_active]);

        return back()->with('success', $household->is_active ? 'Keluarga diaktifkan.' : 'Keluarga dinonaktifkan.');
    }

    public function attachMember(Request $request, Household $household): RedirectResponse
    {
        $data = $request->validate([
            'member_id' => ['required', 'integer', Rule::exists('members', 'id')->whereNull('household_id')],
            'family_role' => ['nullable', Lookups::rule('family_role')],
        ], ['member_id.exists' => 'Jemaat ini sudah tergabung di keluarga lain.']);

        if (($data['family_role'] ?? null) === 'kepala_keluarga' && $household->head()->exists()) {
            return back()->withErrors(['family_role' => 'Keluarga ini sudah punya kepala keluarga.']);
        }

        Member::findOrFail($data['member_id'])->update(['household_id' => $household->id, 'family_role' => $data['family_role'] ?? null]);

        return back()->with('success', 'Anggota ditambahkan ke keluarga.');
    }

    public function detachMember(Household $household, Member $member): RedirectResponse
    {
        abort_unless($member->household_id === $household->id, 404);
        $member->update(['household_id' => null, 'family_role' => null]);

        return back()->with('success', 'Anggota dikeluarkan dari keluarga.');
    }

    /** @return array<string, mixed> */
    private function validated(Request $request, ?Household $household = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'family_number' => ['nullable', 'string', 'max:30', Rule::unique('households', 'family_number')->ignore($household?->id)],
            'address' => ['nullable', 'string', 'max:500'],
            'rt_rw' => ['nullable', 'string', 'max:15', 'regex:/^[0-9]{1,3}\s*\/\s*[0-9]{1,3}$/'],
            'kelurahan' => ['nullable', 'string', 'max:100'],
            'kecamatan' => ['nullable', 'string', 'max:100'],
            'city' => ['nullable', 'string', 'max:100'],
            'postal_code' => ['nullable', 'digits:5'],
            'housing_status' => ['nullable', Lookups::rule('housing_status')],
            'wilayah_id' => ['nullable', 'integer', Rule::exists('wilayahs', 'id')],
            'phone' => ['nullable', 'string', 'max:50', 'regex:/^[0-9+\-\s()]+$/'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['boolean'],
        ], [
            'name.required' => 'Nama keluarga wajib diisi.',
            'family_number.unique' => 'Nomor keluarga ini sudah dipakai.',
            'rt_rw.regex' => 'Tulis RT/RW dengan format 003/005.',
            'postal_code.digits' => 'Kode pos harus 5 digit angka.',
            'phone.regex' => 'Nomor telepon hanya boleh berisi angka, spasi, tanda + dan -.',
        ], ['name' => 'nama keluarga', 'family_number' => 'nomor keluarga']);
    }

    /** @return list<array{id: int, name: string}> */
    private function wilayahOptions(): array
    {
        return \App\Models\Wilayah::where('is_active', true)->orderBy('code')->orderBy('name')->get(['id', 'name'])->map(fn ($w) => ['id' => $w->id, 'name' => $w->name])->all();
    }

    private function nextNumber(): string
    {
        $max = Household::query()->pluck('family_number')->map(fn ($n) => (int) preg_replace('/\D/', '', (string) $n))->max() ?? 0;

        return sprintf('KEL-%04d', $max + 1);
    }
}
