<?php

use App\Enums\Role;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Support\Facades\DB;

it('records an update with only the changed old and new values', function () {
    $actor = actingAsRole(Role::Admin);
    $subject = User::factory()->create(['name' => 'A']);

    $subject->update(['name' => 'B']);

    $log = AuditLog::where('auditable_type', 'user')
        ->where('auditable_id', $subject->id)
        ->where('event', 'updated')
        ->sole();

    expect($log->old_values)->toBe(['name' => 'A'])
        ->and($log->new_values)->toBe(['name' => 'B'])
        ->and($log->user_id)->toBe($actor->id);
});

it('never records secrets', function () {
    actingAsRole(Role::Admin);
    $subject = User::factory()->create();

    $subject->update(['password' => 'kata-sandi-baru']);

    expect(AuditLog::where('auditable_id', $subject->id)->where('event', 'updated')->exists())->toBeFalse();
    $created = AuditLog::where('auditable_id', $subject->id)->where('event', 'created')->sole();
    expect($created->new_values)->not->toHaveKeys(['password', 'remember_token']);
});

it('refuses to update or delete an audit log through the model', function () {
    $log = AuditLog::record(User::factory()->create(), 'manual', [], ['x' => 1]);

    expect(fn () => $log->update(['event' => 'tampered']))->toThrow(LogicException::class)
        ->and(fn () => $log->delete())->toThrow(LogicException::class);

    expect($log->fresh()->event)->toBe('manual');
});

it('refuses to update or delete an audit log at the database level', function () {
    $log = AuditLog::record(User::factory()->create(), 'manual');

    expect(fn () => DB::table('audit_logs')->where('id', $log->id)->update(['event' => 'x']))->toThrow(Exception::class);
});

it('refuses to delete an audit log at the database level', function () {
    $log = AuditLog::record(User::factory()->create(), 'manual');

    expect(fn () => DB::table('audit_logs')->where('id', $log->id)->delete())->toThrow(Exception::class);
});

it('records role changes made by the admin', function () {
    actingAsRole(Role::Admin);
    $user = User::factory()->create();
    $user->assignRole('penghitung');

    $this->put(route('admin.users.update', $user), [
        'name' => $user->name,
        'email' => $user->email,
        'roles' => ['bendahara'],
    ])->assertSessionHasNoErrors();

    $log = AuditLog::where('auditable_id', $user->id)->where('event', 'roles_synced')->sole();
    expect($log->old_values)->toBe(['roles' => ['penghitung']])
        ->and($log->new_values)->toBe(['roles' => ['bendahara']]);
});

it('lets pemeriksa view the audit page', function () {
    actingAsRole(Role::Pemeriksa);
    User::factory()->create();

    $this->get(route('admin.audit.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('admin/audit/index')->has('logs.data'));
});

it('forbids penghitung from the audit page', function () {
    actingAsRole(Role::Penghitung);

    $this->get(route('admin.audit.index'))->assertForbidden();
});

it('filters audit logs by type and date range', function () {
    actingAsRole(Role::Admin);
    $user = User::factory()->create();
    AuditLog::query()->insert([
        'auditable_type' => 'user', 'auditable_id' => $user->id, 'event' => 'old',
        'old_values' => '{}', 'new_values' => '{}', 'created_at' => now()->subMonth(),
    ]);

    $this->get(route('admin.audit.index', ['type' => 'user', 'from' => now()->toDateString(), 'to' => now()->toDateString()]))
        ->assertInertia(fn ($page) => $page
            ->where('logs.data', fn ($rows) => collect($rows)->every(fn ($row) => $row['auditable_type'] === 'user' && $row['event'] !== 'old'))
        );
});
