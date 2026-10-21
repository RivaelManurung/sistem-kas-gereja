<?php

namespace App\Http\Controllers\Admin;

use App\Enums\AttributeEntity;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\MemberRequest;
use App\Models\AttributeDefinition;
use App\Models\Household;
use App\Models\LookupOption;
use App\Models\Member;
use App\Models\User;
use App\Support\Lookups;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class MemberController extends Controller
{
    /** Status yang menandai jemaat tidak lagi aktif di gereja ini. */
    public const INACTIVE_STATUSES = ['pindah', 'meninggal'];

    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'string', 'max:40'],
            'wilayah' => ['nullable', 'string', 'max:60'],
            'gender' => ['nullable', 'in:L,P'],
            'aktif' => ['nullable', 'in:1,0'],
        ]);

        $members = Member::query()
            ->with('household:id,name')
            ->search($filters['search'] ?? null)
            ->when($filters['status'] ?? null, fn ($q, $v) => $q->where('membership_status', $v))
            ->when($filters['wilayah'] ?? null, fn ($q, $v) => $q->where('wilayah', $v))
            ->when($filters['gender'] ?? null, fn ($q, $v) => $q->where('gender', $v))
            ->when(isset($filters['aktif']), fn ($q) => $q->where('is_active', $filters['aktif'] === '1'))
            ->orderBy('name')
            ->paginate(25)
            ->withQueryString()
            ->through(fn (Member $m) => [
                'id' => $m->id,
                'member_number' => $m->member_number,
                'name' => $m->name,
                'gender' => $m->gender,
                'age' => $m->age,
                'phone' => $m->phone,
                'household' => $m->household ? ['id' => $m->household->id, 'name' => $m->household->name] : null,
                'wilayah' => Lookups::label('wilayah', $m->wilayah),
                'status' => Lookups::pair('membership_status', $m->membership_status),
                'is_active' => $m->is_active,
            ]);

        return Inertia::render('admin/members/index', [
            'members' => $members,
            'filters' => [
                'search' => $filters['search'] ?? '',
                'status' => $filters['status'] ?? '',
                'wilayah' => $filters['wilayah'] ?? '',
                'gender' => $filters['gender'] ?? '',
                'aktif' => $filters['aktif'] ?? '',
            ],
            'statusOptions' => LookupOption::options('membership_status'),
            'wilayahOptions' => LookupOption::options('wilayah'),
            'totals' => [
                'all' => Member::count(),
                'active' => Member::where('is_active', true)->count(),
            ],
        ]);
    }

    public function show(Member $member): Response
    {
        $member->load(['household', 'user:id,name,email', 'milestones', 'ministries', 'documents.uploader:id,name']);

        $household = $member->household ? [
            'id' => $member->household->id,
            'name' => $member->household->name,
            'family_number' => $member->household->family_number,
            'address' => $member->household->fullAddress(),
            'members' => $member->household->members()->orderByRaw("case family_role when 'kepala_keluarga' then 0 when 'pasangan' then 1 else 2 end")->orderBy('birth_date')->get()->map(fn (Member $m) => [
                'id' => $m->id,
                'name' => $m->name,
                'age' => $m->age,
                'family_role' => Lookups::label('family_role', $m->family_role),
                'status' => Lookups::label('membership_status', $m->membership_status),
                'is_self' => $m->is($member),
            ]),
        ] : null;

        $year = (int) now()->format('Y');
        $donations = $member->donations();

        return Inertia::render('admin/members/show', [
            'member' => [
                ...$member->only(['id', 'member_number', 'nik', 'name', 'gender', 'place_of_birth', 'occupation', 'father_name', 'mother_name', 'phone', 'email', 'address', 'ktp_address', 'previous_church', 'emergency_name', 'emergency_phone', 'emergency_relation', 'notes', 'is_active']),
                'nik_masked' => $member->nik ? str_repeat('•', 12).substr($member->nik, -4) : null,
                'birth_date' => $member->birth_date?->toDateString(),
                'age' => $member->age,
                'membership_date' => $member->membership_date?->toDateString(),
                'marital_status' => Lookups::pair('marital_status', $member->marital_status),
                'education' => Lookups::pair('education', $member->education),
                'family_role' => Lookups::pair('family_role', $member->family_role),
                'membership_status' => Lookups::pair('membership_status', $member->membership_status),
                'wilayah' => Lookups::pair('wilayah', $member->wilayah),
                'has_photo' => (bool) $member->photo_path,
                'photo_version' => $member->updated_at?->timestamp,
                'user' => $member->user,
                'created_at' => $member->created_at?->toIso8601String(),
            ],
            'household' => $household,
            'milestones' => $member->milestones->map(fn ($m) => [
                'id' => $m->id,
                'type' => $m->type,
                'type_label' => Lookups::label('milestone_type', $m->type),
                'date' => $m->date?->toDateString(),
                'church' => $m->church,
                'minister' => $m->minister,
                'certificate_number' => $m->certificate_number,
                'civil_number' => $m->civil_number,
                'notes' => $m->notes,
            ]),
            'ministries' => $member->ministries->map(fn ($m) => [
                'id' => $m->id,
                'ministry' => $m->ministry,
                'ministry_label' => Lookups::label('ministry', $m->ministry),
                'role_title' => $m->role_title,
                'start_date' => $m->start_date?->toDateString(),
                'end_date' => $m->end_date?->toDateString(),
                'is_current' => $m->isCurrent(),
                'notes' => $m->notes,
            ]),
            'documents' => $member->documents->map(fn ($d) => [
                'id' => $d->id,
                'type' => $d->type,
                'type_label' => Lookups::label('member_document_type', $d->type),
                'title' => $d->title,
                'document_number' => $d->document_number,
                'issued_date' => $d->issued_date?->toDateString(),
                'original_name' => $d->original_name,
                'mime' => $d->mime,
                'size' => $d->size,
                'uploaded_by' => $d->uploader?->name,
                'created_at' => $d->created_at?->toIso8601String(),
            ]),
            'giving' => [
                'year' => $year,
                'total_year' => (int) (clone $donations)->whereYear('created_at', $year)->sum('amount'),
                'total_all' => (int) (clone $donations)->sum('amount'),
                'count' => (clone $donations)->count(),
                'recent' => (clone $donations)->with('category:id,name')->latest('id')->take(10)->get()->map(fn ($d) => [
                    'id' => $d->id,
                    'date' => $d->created_at?->toDateString(),
                    'category' => $d->category?->name,
                    'amount' => $d->amount,
                    'receipt_number' => $d->receipt_number,
                ]),
            ],
            'customFields' => [
                'definitions' => AttributeDefinition::active()->forEntity(AttributeEntity::Member)->orderBy('sort_order')->get(),
                'values' => $member->customAttributes(),
            ],
            'lookups' => [
                'milestoneTypes' => LookupOption::options('milestone_type'),
                'ministries' => LookupOption::options('ministry'),
                'documentTypes' => LookupOption::options('member_document_type'),
            ],
        ]);
    }

    public function create(Request $request): Response
    {
        return Inertia::render('admin/members/form', [
            'member' => null,
            ...$this->formProps(null),
            'defaults' => [
                'household_id' => $request->integer('household_id') ?: null,
            ],
        ]);
    }

    public function store(MemberRequest $request): RedirectResponse
    {
        $data = $this->payload($request);
        $attributes = $request->input('attributes', []);

        $member = DB::transaction(function () use ($data, $attributes, $request) {
            $member = Member::create($data);
            $this->storePhoto($request, $member);
            if (! empty($attributes)) {
                $member->syncCustomAttributes($attributes);
            }

            return $member;
        });

        return redirect()->route('admin.members.show', $member)->with('success', "Data {$member->name} berhasil ditambahkan.");
    }

    public function edit(Member $member): Response
    {
        return Inertia::render('admin/members/form', [
            'member' => [
                ...$member->only(['id', 'member_number', 'nik', 'name', 'gender', 'place_of_birth', 'marital_status', 'education', 'occupation', 'father_name', 'mother_name', 'phone', 'email', 'address', 'ktp_address', 'household_id', 'family_role', 'membership_status', 'previous_church', 'wilayah', 'emergency_name', 'emergency_phone', 'emergency_relation', 'notes', 'user_id', 'is_active']),
                'birth_date' => $member->birth_date?->toDateString(),
                'membership_date' => $member->membership_date?->toDateString(),
                'has_photo' => (bool) $member->photo_path,
                'photo_version' => $member->updated_at?->timestamp,
            ],
            ...$this->formProps($member),
            'defaults' => ['household_id' => null],
        ]);
    }

    public function update(MemberRequest $request, Member $member): RedirectResponse
    {
        $data = $this->payload($request);
        $attributes = $request->input('attributes', []);

        DB::transaction(function () use ($member, $data, $attributes, $request) {
            $member->update($data);
            $this->storePhoto($request, $member);
            if ($attributes !== null) {
                $member->syncCustomAttributes($attributes);
            }
        });

        return redirect()->route('admin.members.show', $member)->with('success', "Data {$member->name} berhasil diperbarui.");
    }

    public function toggle(Member $member): RedirectResponse
    {
        $member->update(['is_active' => ! $member->is_active]);

        return redirect()->back()->with('success', $member->is_active ? 'Jemaat diaktifkan.' : 'Jemaat dinonaktifkan.');
    }

    public function photo(Member $member): StreamedResponse
    {
        abort_unless($member->photo_path && Storage::disk('local')->exists($member->photo_path), 404);

        return Storage::disk('local')->response($member->photo_path, null, ['Cache-Control' => 'private, max-age=3600']);
    }

    /** @return array<string, mixed> */
    private function payload(MemberRequest $request): array
    {
        $data = $request->safe()->except(['photo', 'remove_photo', 'attributes']);
        $data['is_active'] = $request->boolean('is_active', true);

        // Anggota yang sudah pindah atau meninggal otomatis tidak aktif.
        if (in_array($data['membership_status'] ?? null, self::INACTIVE_STATUSES, true)) {
            $data['is_active'] = false;
        }

        return $data;
    }

    private function storePhoto(MemberRequest $request, Member $member): void
    {
        if ($request->hasFile('photo')) {
            if ($member->photo_path) {
                Storage::disk('local')->delete($member->photo_path);
            }
            $member->update(['photo_path' => $request->file('photo')->store("members/{$member->id}/photo", 'local')]);
        } elseif ($request->boolean('remove_photo') && $member->photo_path) {
            Storage::disk('local')->delete($member->photo_path);
            $member->update(['photo_path' => null]);
        }
    }

    /** @return array<string, mixed> */
    private function formProps(?Member $member): array
    {
        return [
            'users' => User::query()->whereDoesntHave('member')->when($member?->user_id, fn ($q, $id) => $q->orWhere('id', $id))->orderBy('name')->get(['id', 'name', 'email']),
            'households' => Household::orderBy('name')->get(['id', 'name', 'family_number'])->map(fn ($h) => ['id' => $h->id, 'name' => $h->name, 'family_number' => $h->family_number]),
            'lookups' => [
                'maritalStatus' => LookupOption::options('marital_status'),
                'education' => LookupOption::options('education'),
                'familyRole' => LookupOption::options('family_role'),
                'membershipStatus' => LookupOption::options('membership_status'),
                'wilayah' => LookupOption::options('wilayah'),
            ],
            'customFields' => [
                'definitions' => AttributeDefinition::active()->forEntity(AttributeEntity::Member)->orderBy('sort_order')->get(),
                'values' => $member ? $member->customAttributes() : (object) [],
            ],
        ];
    }
}
