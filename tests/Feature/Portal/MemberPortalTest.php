<?php

use App\Enums\Direction;
use App\Enums\Role;
use App\Models\Category;
use App\Models\ChurchSetting;
use App\Models\Donation;
use App\Models\Fund;
use App\Models\Member;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    ChurchSetting::current()->update([
        'name' => 'GBI Jemaat Kasih',
    ]);

    $this->fund = Fund::create([
        'code' => 'UMUM-PORTAL',
        'name' => 'Dana Umum',
        'is_active' => true,
    ]);

    $this->category = Category::create([
        'name' => 'Perpuluhan',
        'direction' => Direction::In,
        'default_fund_id' => $this->fund->id,
        'allows_named' => true,
        'is_public' => true,
        'is_active' => true,
    ]);

    // User A & Member A
    $this->userA = User::factory()->create(['name' => 'User Jemaat A']);
    $this->userA->assignRole(Role::Jemaat->value);
    $this->memberA = Member::create([
        'user_id' => $this->userA->id,
        'member_number' => 'MEM-A001',
        'name' => 'Jemaat A Pratama',
        'phone' => '081211112222',
        'email' => 'jemaat.a@test.com',
        'address' => 'Jl. Kasih No. 1',
        'is_active' => true,
    ]);

    // User B & Member B
    $this->userB = User::factory()->create(['name' => 'User Jemaat B']);
    $this->userB->assignRole(Role::Jemaat->value);
    $this->memberB = Member::create([
        'user_id' => $this->userB->id,
        'member_number' => 'MEM-B002',
        'name' => 'Jemaat B Susanto',
        'phone' => '081233334444',
        'email' => 'jemaat.b@test.com',
        'address' => 'Jl. Damai No. 2',
        'is_active' => true,
    ]);

    // Donations
    $this->donationA = Donation::create([
        'member_id' => $this->memberA->id,
        'donor_name' => $this->memberA->name,
        'category_id' => $this->category->id,
        'amount' => 500000,
        'payment_method' => 'cash',
        'receipt_number' => 'RCP-202610-0001',
        'notes' => 'Perpuluhan Oktober A',
        'created_at' => '2026-10-15 10:00:00',
    ]);

    $this->donationB = Donation::create([
        'member_id' => $this->memberB->id,
        'donor_name' => $this->memberB->name,
        'category_id' => $this->category->id,
        'amount' => 1200000,
        'payment_method' => 'transfer',
        'receipt_number' => 'RCP-202610-0002',
        'notes' => 'Perpuluhan Oktober B',
        'created_at' => '2026-10-16 11:00:00',
    ]);
});

it('redirects unauthenticated guests to login when accessing portal', function () {
    $response = $this->get(route('portal.index'));
    $response->assertRedirect(route('login'));
});

it('allows authenticated member to view only their personal donation history', function () {
    $this->actingAs($this->userA);

    $response = $this->get(route('portal.index'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('portal/index')
        ->where('isLinked', true)
        ->where('member.id', $this->memberA->id)
        ->where('member.name', 'Jemaat A Pratama')
        ->has('donations.data', 1, fn (Assert $item) => $item
            ->where('id', $this->donationA->id)
            ->where('receipt_number', 'RCP-202610-0001')
            ->where('amount', 500000)
            ->etc()
        )
        ->where('summary.thisYearTotal', 500000)
        ->where('summary.allTimeTotal', 500000)
    );

    // Ensure donation B is not in response content
    $content = $response->getContent();
    expect($content)->not->toContain('RCP-202610-0002')
        ->and($content)->not->toContain('Jemaat B Susanto')
        ->and($content)->not->toContain('Perpuluhan Oktober B');
});

it('strictly blocks IDOR access when trying to view another member single receipt', function () {
    $this->actingAs($this->userA);

    // User A accessing own receipt
    $ownResponse = $this->get(route('portal.receipt', $this->donationA->id));
    $ownResponse->assertOk();
    $ownResponse->assertInertia(fn (Assert $page) => $page
        ->component('portal/receipt')
        ->where('donation.id', $this->donationA->id)
        ->where('donation.receipt_number', 'RCP-202610-0001')
    );

    // User A attempting IDOR access on User B's receipt
    $idorResponse = $this->get(route('portal.receipt', $this->donationB->id));
    $idorResponse->assertStatus(403);
});

it('strictly restricts annual contribution statement to the logged-in member', function () {
    $this->actingAs($this->userA);

    $response = $this->get(route('portal.statement', ['year' => 2026]));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('portal/statement')
        ->where('member.id', $this->memberA->id)
        ->where('year', 2026)
        ->has('donations', 1, fn (Assert $item) => $item
            ->where('id', $this->donationA->id)
            ->where('amount', 500000)
            ->etc()
        )
        ->where('totalAmount', 500000)
    );

    $content = $response->getContent();
    expect($content)->not->toContain('RCP-202610-0002')
        ->and($content)->not->toContain('1200000');
});

it('handles authenticated user without linked member gracefully', function () {
    $unlinkedUser = User::factory()->create(['name' => 'Unlinked User']);
    $unlinkedUser->assignRole(Role::Jemaat->value);

    $this->actingAs($unlinkedUser);

    $response = $this->get(route('portal.index'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('portal/index')
        ->where('isLinked', false)
        ->where('member', null)
    );

    // Attempting to access receipt or statement without linked member returns 403
    $receiptResponse = $this->get(route('portal.receipt', $this->donationA->id));
    $receiptResponse->assertStatus(403);

    $statementResponse = $this->get(route('portal.statement'));
    $statementResponse->assertStatus(403);
});
