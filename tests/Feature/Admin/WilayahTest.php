<?php

use App\Enums\Role;
use App\Models\Household;
use App\Models\Member;
use App\Models\Wilayah;

it('creates a wilayah and rejects duplicate names and codes', function () {
    actingAsRole(Role::Admin);

    $this->post(route('admin.wilayah.store'), ['name' => 'Wilayah A', 'code' => 'A', 'meeting_info' => 'Jumat 19.00'])->assertSessionHasNoErrors();
    $this->post(route('admin.wilayah.store'), ['name' => 'Wilayah A', 'code' => 'Z'])->assertSessionHasErrors('name');
    $this->post(route('admin.wilayah.store'), ['name' => 'Wilayah Z', 'code' => 'A'])->assertSessionHasErrors('code');
    $this->post(route('admin.wilayah.store'), ['name' => ''])->assertSessionHasErrors('name');

    expect(Wilayah::count())->toBe(1);
});

it('assigns officers with a role, rejects inactive members and bad dates, and blocks duplicate roles', function () {
    actingAsRole(Role::Admin);
    $wilayah = Wilayah::create(['name' => 'Wilayah B', 'code' => 'B']);
    $member = Member::factory()->create();
    $inactive = Member::factory()->create(['is_active' => false]);

    $this->post(route('admin.wilayah.officers.store', $wilayah), ['member_id' => $member->id, 'role' => 'penatua', 'start_date' => '2024-01-01'])->assertSessionHasNoErrors();
    $this->post(route('admin.wilayah.officers.store', $wilayah), ['member_id' => $member->id, 'role' => 'penatua'])->assertSessionHasErrors('role');
    $this->post(route('admin.wilayah.officers.store', $wilayah), ['member_id' => $inactive->id, 'role' => 'diaken'])->assertSessionHasErrors('member_id');
    $this->post(route('admin.wilayah.officers.store', $wilayah), ['member_id' => $member->id, 'role' => 'ngawur'])->assertSessionHasErrors('role');
    $this->post(route('admin.wilayah.officers.store', $wilayah), ['member_id' => $member->id, 'role' => 'diaken', 'start_date' => '2024-01-01', 'end_date' => '2023-01-01'])->assertSessionHasErrors('end_date');

    expect($wilayah->officers()->count())->toBe(1);
});

it('shows a wilayah with its officers, households and member counts', function () {
    actingAsRole(Role::Admin);
    $wilayah = Wilayah::create(['name' => 'Wilayah C', 'code' => 'C']);
    $household = Household::create(['name' => 'Keluarga Gultom', 'wilayah_id' => $wilayah->id]);
    $head = Member::factory()->create(['household_id' => $household->id, 'family_role' => 'kepala_keluarga']);
    Member::factory()->create(['household_id' => $household->id, 'family_role' => 'anak']);
    $wilayah->officers()->create(['member_id' => $head->id, 'role' => 'penatua']);

    $this->get(route('admin.wilayah.show', $wilayah))->assertOk()->assertInertia(fn ($page) => $page
        ->component('admin/wilayah/show')
        ->where('stats.households', 1)->where('stats.members', 2)
        ->has('officers', 1)->where('officers.0.role_label', 'Penatua (Sintua)')
        ->has('households', 1));

    $this->get(route('admin.wilayah.index'))->assertInertia(fn ($page) => $page->where('wilayahs.0.members_count', 2)->where('wilayahs.0.officers.0.role_key', 'penatua'));
});

it('lets a household choose its wilayah and members inherit it', function () {
    actingAsRole(Role::Admin);
    $wilayah = Wilayah::create(['name' => 'Wilayah D', 'code' => 'D']);

    $this->post(route('admin.households.store'), ['name' => 'Keluarga Sinaga', 'wilayah_id' => $wilayah->id])->assertSessionHasNoErrors();
    $this->post(route('admin.households.store'), ['name' => 'Keluarga X', 'wilayah_id' => 9999])->assertSessionHasErrors('wilayah_id');

    $household = Household::where('name', 'Keluarga Sinaga')->firstOrFail();
    $member = Member::factory()->create(['household_id' => $household->id]);

    $this->get(route('admin.members.show', $member))->assertInertia(fn ($page) => $page->where('member.wilayah.label', 'Wilayah D'));
});

it('denies wilayah pages to roles without members.manage', function () {
    actingAsRole(Role::Penghitung);
    $wilayah = Wilayah::create(['name' => 'Wilayah E']);

    $this->get(route('admin.wilayah.index'))->assertForbidden();
    $this->post(route('admin.wilayah.officers.store', $wilayah), [])->assertForbidden();
});
