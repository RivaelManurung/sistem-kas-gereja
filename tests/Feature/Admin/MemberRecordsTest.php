<?php

use App\Enums\Role;
use App\Models\Household;
use App\Models\Member;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

function memberPayload(array $overrides = []): array
{
    return array_merge([
        'name' => 'Daniel Simanjuntak',
        'gender' => 'L',
        'membership_status' => 'tetap',
        'is_active' => true,
    ], $overrides);
}

function realPng(string $name = 'foto.png'): UploadedFile
{
    return UploadedFile::fake()->createWithContent($name, base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='));
}

it('stores the complete member profile with lookups and a household', function () {
    actingAsRole(Role::Admin);
    $household = Household::create(['name' => 'Keluarga Simanjuntak', 'family_number' => 'KEL-0001']);

    $this->post(route('admin.members.store'), memberPayload([
        'nik' => '3174012345678901',
        'place_of_birth' => 'Medan',
        'birth_date' => '1985-03-12',
        'marital_status' => 'menikah',
        'education' => 's1',
        'occupation' => 'Guru',
        'phone' => '0812-3456-7890',
        'household_id' => $household->id,
        'family_role' => 'kepala_keluarga',
        'membership_date' => '2010-05-01',
        'previous_church' => 'HKBP Kebayoran',
        'wilayah' => 'wilayah_2',
        'emergency_name' => 'Rotua Simanjuntak',
        'emergency_phone' => '081234567891',
    ]))->assertSessionHasNoErrors();

    $member = Member::where('nik', '3174012345678901')->firstOrFail();
    expect($member->household_id)->toBe($household->id)
        ->and($member->marital_status)->toBe('menikah')
        ->and($member->age)->toBeGreaterThan(30)
        ->and($household->head->is($member))->toBeTrue();
});

it('validates NIK, phone, dates and lookup values strictly', function () {
    actingAsRole(Role::Admin);
    Member::factory()->create(['nik' => '3174012345678901']);

    $this->post(route('admin.members.store'), memberPayload(['nik' => '12345']))->assertSessionHasErrors('nik');
    $this->post(route('admin.members.store'), memberPayload(['nik' => '3174012345678901']))->assertSessionHasErrors('nik');
    $this->post(route('admin.members.store'), memberPayload(['phone' => 'abc123']))->assertSessionHasErrors('phone');
    $this->post(route('admin.members.store'), memberPayload(['birth_date' => now()->addDay()->toDateString()]))->assertSessionHasErrors('birth_date');
    $this->post(route('admin.members.store'), memberPayload(['marital_status' => 'ngawur']))->assertSessionHasErrors('marital_status');
    $this->post(route('admin.members.store'), memberPayload(['membership_status' => null]))->assertSessionHasErrors('membership_status');
    $this->post(route('admin.members.store'), memberPayload(['birth_date' => '2000-01-01', 'membership_date' => '1999-01-01']))->assertSessionHasErrors('membership_date');
});

it('allows only one head of household and requires a household for a head', function () {
    actingAsRole(Role::Admin);
    $household = Household::create(['name' => 'Keluarga Sitompul']);
    Member::factory()->create(['household_id' => $household->id, 'family_role' => 'kepala_keluarga']);

    $this->post(route('admin.members.store'), memberPayload(['household_id' => $household->id, 'family_role' => 'kepala_keluarga']))->assertSessionHasErrors('family_role');
    $this->post(route('admin.members.store'), memberPayload(['family_role' => 'kepala_keluarga']))->assertSessionHasErrors('family_role');
    $this->post(route('admin.members.store'), memberPayload(['household_id' => $household->id, 'family_role' => 'anak']))->assertSessionHasNoErrors();
});

it('deactivates a member automatically when the status is pindah or meninggal', function () {
    actingAsRole(Role::Admin);

    $this->post(route('admin.members.store'), memberPayload(['name' => 'Almarhum Budi', 'membership_status' => 'meninggal', 'is_active' => true]))->assertSessionHasNoErrors();

    expect(Member::where('name', 'Almarhum Budi')->firstOrFail()->is_active)->toBeFalse();
});

it('keeps the photo on the private disk and serves it only to member managers', function () {
    Storage::fake('local');
    actingAsRole(Role::Admin);

    $this->post(route('admin.members.store'), memberPayload(['photo' => realPng()]))->assertSessionHasNoErrors();
    $member = Member::firstOrFail();

    expect($member->photo_path)->not->toBeNull();
    Storage::disk('local')->assertExists($member->photo_path);
    $this->get(route('admin.members.photo', $member))->assertOk();

    auth()->logout();
    $this->get(route('admin.members.photo', $member))->assertRedirect(route('login'));
});

it('records baptism, sidi and atestasi and applies their effect on membership status', function () {
    actingAsRole(Role::Admin);
    $member = Member::factory()->create(['membership_status' => 'anak', 'birth_date' => '2005-01-01']);

    $this->post(route('admin.members.milestones.store', $member), ['type' => 'baptis_anak', 'date' => '2005-06-01', 'church' => 'GKI Betlehem', 'minister' => 'Pdt. Samuel'])->assertSessionHasNoErrors();
    expect($member->fresh()->membership_status)->toBe('anak');

    $this->post(route('admin.members.milestones.store', $member), ['type' => 'sidi', 'date' => '2020-06-01'])->assertSessionHasNoErrors();
    expect($member->fresh()->membership_status)->toBe('tetap');

    $this->post(route('admin.members.milestones.store', $member), ['type' => 'atestasi_keluar', 'date' => '2024-01-10', 'church' => 'GKI Pondok Indah'])->assertSessionHasNoErrors();
    expect($member->fresh())->membership_status->toBe('pindah')->is_active->toBeFalse();

    expect($member->milestones()->count())->toBe(3);
});

it('rejects a milestone dated before birth, in the future, or with an unknown type', function () {
    actingAsRole(Role::Admin);
    $member = Member::factory()->create(['birth_date' => '2000-01-01']);

    $this->post(route('admin.members.milestones.store', $member), ['type' => 'sidi', 'date' => '1999-01-01'])->assertSessionHasErrors('date');
    $this->post(route('admin.members.milestones.store', $member), ['type' => 'sidi', 'date' => now()->addDay()->toDateString()])->assertSessionHasErrors('date');
    $this->post(route('admin.members.milestones.store', $member), ['type' => 'ngawur', 'date' => '2020-01-01'])->assertSessionHasErrors('type');
});

it('tracks ministries with an end date that cannot precede the start date', function () {
    actingAsRole(Role::Admin);
    $member = Member::factory()->create();

    $this->post(route('admin.members.ministries.store', $member), ['ministry' => 'diaken', 'role_title' => 'Ketua', 'start_date' => '2022-01-01'])->assertSessionHasNoErrors();
    $this->post(route('admin.members.ministries.store', $member), ['ministry' => 'diaken', 'start_date' => '2022-01-01', 'end_date' => '2021-01-01'])->assertSessionHasErrors('end_date');

    expect($member->ministries()->count())->toBe(1)->and($member->ministries->first()->isCurrent())->toBeTrue();
});

it('uploads, downloads and deletes a member document on the private disk', function () {
    Storage::fake('local');
    actingAsRole(Role::Admin);
    $member = Member::factory()->create();

    $this->post(route('admin.members.documents.store', $member), [
        'type' => 'surat_baptis', 'document_number' => 'BP-123', 'file' => UploadedFile::fake()->create('surat.pdf', 120, 'application/pdf'),
    ])->assertSessionHasNoErrors();

    $document = $member->documents()->firstOrFail();
    Storage::disk('local')->assertExists($document->file_path);
    expect($document->original_name)->toBe('surat.pdf')->and($document->uploaded_by)->toBe(auth()->id());

    $this->get(route('admin.members.documents.download', [$member, $document]))->assertOk()->assertDownload('surat.pdf');

    $this->delete(route('admin.members.documents.destroy', [$member, $document]))->assertSessionHasNoErrors();
    Storage::disk('local')->assertMissing($document->file_path);
    expect($member->documents()->count())->toBe(0);
});

it('rejects documents that are too large, of the wrong type, or missing', function () {
    Storage::fake('local');
    actingAsRole(Role::Admin);
    $member = Member::factory()->create();

    $this->post(route('admin.members.documents.store', $member), ['type' => 'ktp', 'file' => UploadedFile::fake()->create('besar.pdf', 6000, 'application/pdf')])->assertSessionHasErrors('file');
    $this->post(route('admin.members.documents.store', $member), ['type' => 'ktp', 'file' => UploadedFile::fake()->create('virus.exe', 10)])->assertSessionHasErrors('file');
    $this->post(route('admin.members.documents.store', $member), ['type' => 'ktp'])->assertSessionHasErrors('file');
});

it('never lets a document be reached through another member', function () {
    Storage::fake('local');
    actingAsRole(Role::Admin);
    [$a, $b] = [Member::factory()->create(), Member::factory()->create()];

    $this->post(route('admin.members.documents.store', $a), ['type' => 'ktp', 'file' => UploadedFile::fake()->create('a.pdf', 10, 'application/pdf')]);
    $document = $a->documents()->firstOrFail();

    $this->get(route('admin.members.documents.download', [$b, $document]))->assertNotFound();
    $this->delete(route('admin.members.documents.destroy', [$b, $document]))->assertNotFound();
});

it('shows the member profile with household, history, documents and giving', function () {
    actingAsRole(Role::Admin);
    $household = Household::create(['name' => 'Keluarga Nainggolan']);
    $member = Member::factory()->create(['household_id' => $household->id, 'family_role' => 'kepala_keluarga', 'nik' => '3174012345678901', 'membership_status' => 'tetap']);

    $this->get(route('admin.members.show', $member))->assertOk()->assertInertia(fn ($page) => $page
        ->component('admin/members/show')
        ->where('member.nik_masked', fn ($v) => str_ends_with($v, '8901') && ! str_contains($v, '3174'))
        ->where('member.membership_status.label', 'Anggota tetap (sudah sidi)')
        ->where('household.name', 'Keluarga Nainggolan')
        ->has('milestones', 0)->has('ministries', 0)->has('documents', 0)
        ->where('giving.total_all', 0));
});

it('filters the member list by status, wilayah and search', function () {
    actingAsRole(Role::Admin);
    Member::factory()->create(['name' => 'Aaron Tambunan', 'membership_status' => 'tetap', 'wilayah' => 'wilayah_1']);
    Member::factory()->create(['name' => 'Bella Purba', 'membership_status' => 'simpatisan', 'wilayah' => 'wilayah_2']);

    $names = fn (array $q) => collect($this->get(route('admin.members.index', $q))->assertOk()->viewData('page')['props']['members']['data'])->pluck('name')->all();

    expect($names(['status' => 'simpatisan']))->toBe(['Bella Purba'])
        ->and($names(['wilayah' => 'wilayah_1']))->toBe(['Aaron Tambunan'])
        ->and($names(['search' => 'purba']))->toBe(['Bella Purba'])
        ->and($names([]))->toHaveCount(2);
});

it('denies the member pages to roles without members.manage', function () {
    actingAsRole(Role::Penghitung);
    $member = Member::factory()->create();

    $this->get(route('admin.members.index'))->assertForbidden();
    $this->get(route('admin.members.show', $member))->assertForbidden();
    $this->post(route('admin.members.documents.store', $member), [])->assertForbidden();
    $this->get(route('admin.households.index'))->assertForbidden();
});

it('manages households: create, attach members, one head, detach', function () {
    actingAsRole(Role::Admin);

    $this->post(route('admin.households.store'), ['name' => 'Keluarga Harahap', 'family_number' => 'KEL-0100', 'rt_rw' => '003/005', 'postal_code' => '11530', 'housing_status' => 'milik_sendiri'])->assertSessionHasNoErrors();
    $household = Household::where('name', 'Keluarga Harahap')->firstOrFail();

    [$a, $b] = [Member::factory()->create(), Member::factory()->create()];
    $this->post(route('admin.households.members.attach', $household), ['member_id' => $a->id, 'family_role' => 'kepala_keluarga'])->assertSessionHasNoErrors();
    $this->post(route('admin.households.members.attach', $household), ['member_id' => $b->id, 'family_role' => 'kepala_keluarga'])->assertSessionHasErrors('family_role');
    $this->post(route('admin.households.members.attach', $household), ['member_id' => $b->id, 'family_role' => 'anak'])->assertSessionHasNoErrors();
    $this->post(route('admin.households.members.attach', $household), ['member_id' => $b->id, 'family_role' => 'anak'])->assertSessionHasErrors('member_id');

    expect($household->members()->count())->toBe(2)->and($household->fresh()->head->is($a))->toBeTrue();

    $this->delete(route('admin.households.members.detach', [$household, $b]))->assertSessionHasNoErrors();
    expect($b->fresh()->household_id)->toBeNull();
});

it('validates household address fields', function () {
    actingAsRole(Role::Admin);

    $this->post(route('admin.households.store'), ['name' => 'X', 'rt_rw' => 'abc'])->assertSessionHasErrors('rt_rw');
    $this->post(route('admin.households.store'), ['name' => 'X', 'postal_code' => '123'])->assertSessionHasErrors('postal_code');
    $this->post(route('admin.households.store'), ['name' => ''])->assertSessionHasErrors('name');
});
