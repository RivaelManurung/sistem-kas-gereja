<?php

use App\Enums\Role;
use App\Models\ReportSignatory;

it('rejects a signatory order that is already taken but lets a signatory keep its own', function () {
    actingAsRole(Role::Admin);
    $first = ReportSignatory::create(['title' => 'Dibuat oleh', 'position' => 'Bendahara', 'role' => Role::Bendahara->value, 'order' => 1]);
    $payload = ['title' => 'Diperiksa oleh', 'position' => 'Pemeriksa', 'role' => Role::Admin->value, 'order' => 1];

    $this->post(route('admin.signatures.store'), $payload)->assertSessionHasErrors('order');
    expect(ReportSignatory::count())->toBe(1);

    $this->post(route('admin.signatures.store'), [...$payload, 'order' => 2])->assertSessionHasNoErrors();

    $this->put(route('admin.signatures.update', $first), ['title' => 'Disiapkan oleh', 'position' => 'Bendahara', 'role' => Role::Bendahara->value, 'order' => 1])
        ->assertSessionHasNoErrors();
    $this->put(route('admin.signatures.update', $first), ['title' => 'Disiapkan oleh', 'position' => 'Bendahara', 'role' => Role::Bendahara->value, 'order' => 2])
        ->assertSessionHasErrors('order');
});
