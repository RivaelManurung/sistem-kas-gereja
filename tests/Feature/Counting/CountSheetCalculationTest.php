<?php

use App\Enums\CountSheetStatus;
use App\Enums\CountSheetType;
use App\Enums\Direction;
use App\Enums\Role;
use App\Models\Account;
use App\Models\Category;
use App\Models\CountSheet;
use App\Models\Fund;
use App\Models\ServiceSchedule;
use App\Models\ServiceSession;
use App\Services\CountCalculationService;

beforeEach(function () {
    $this->account = Account::create([
        'code' => 'KAS-IBADAH',
        'name' => 'Kas Tunai Ibadah',
        'type' => 'cash',
    ]);

    $this->fund = Fund::create([
        'code' => 'UMUM',
        'name' => 'Dana Umum',
    ]);

    $this->kolekteUmum = Category::create([
        'name' => 'Kolekte I',
        'direction' => Direction::In,
        'default_fund_id' => $this->fund->id,
    ]);

    $this->kolektePembangunan = Category::create([
        'name' => 'Kolekte Pembangunan',
        'direction' => Direction::In,
        'default_fund_id' => $this->fund->id,
    ]);

    $this->schedule = ServiceSchedule::create([
        'name' => 'Ibadah Raya 1',
        'day_of_week' => 0,
        'time' => '08:00',
        'default_category_ids' => [$this->kolekteUmum->id, $this->kolektePembangunan->id],
    ]);

    $this->session = ServiceSession::create([
        'service_schedule_id' => $this->schedule->id,
        'name' => 'Ibadah Raya 1',
        'date' => '2026-10-25',
    ]);
});

it('re-calculates line subtotal and total amount strictly on server from denomination counts', function () {
    $calc = new CountCalculationService();

    $lines = [
        [
            'category_id' => $this->kolekteUmum->id,
            'is_cash' => true,
            'denomination_counts' => [
                '100000' => 10, // 1,000,000
                '50000' => 4,   //   200,000
                '20000' => 5,   //   100,000
            ],
            // Client attempts to pass a wrong or tampered subtotal:
            'amount' => 999999,
        ],
        [
            'category_id' => $this->kolektePembangunan->id,
            'is_cash' => false,
            'denomination_counts' => null,
            'amount' => 500000,
            'reference_number' => 'TRX-12345',
        ],
    ];

    $calculated = $calc->calculate($lines);

    // First line recalculation: 100k*10 + 50k*4 + 20k*5 = 1,300,000
    expect($calculated['lines'][0]['amount'])->toBe(1300000)
        ->and($calculated['lines'][1]['amount'])->toBe(500000)
        ->and($calculated['total_amount'])->toBe(1800000);
});

it('creates count sheet via controller and persists calculated totals', function () {
    actingAsRole(Role::Penghitung);

    $response = $this->post(route('counting.store'), [
        'type' => CountSheetType::Service->value,
        'service_session_id' => $this->session->id,
        'account_id' => $this->account->id,
        'date' => '2026-10-25',
        'notes' => 'Kolekte ibadah pagi lancar',
        'lines' => [
            [
                'category_id' => $this->kolekteUmum->id,
                'is_cash' => true,
                'denomination_counts' => [
                    '100000' => 5, // 500,000
                    '50000' => 2,  // 100,000
                ],
            ],
        ],
    ]);

    $response->assertRedirect();

    $sheet = CountSheet::first();
    expect($sheet)->not->toBeNull()
        ->and($sheet->status)->toBe(CountSheetStatus::Draft)
        ->and($sheet->total_amount)->toBe(600000)
        ->and($sheet->lines)->toHaveCount(1)
        ->and($sheet->lines->first()->amount)->toBe(600000);
});

it('prevents duplicate submission using idempotency key', function () {
    actingAsRole(Role::Penghitung);

    $idempotencyKey = 'key-' . bin2hex(random_bytes(8));

    $payload = [
        'type' => CountSheetType::Service->value,
        'service_session_id' => $this->session->id,
        'account_id' => $this->account->id,
        'date' => '2026-10-25',
        'idempotency_key' => $idempotencyKey,
        'lines' => [
            [
                'category_id' => $this->kolekteUmum->id,
                'is_cash' => true,
                'denomination_counts' => [
                    '50000' => 2,
                ],
            ],
        ],
    ];

    $this->post(route('counting.store'), $payload)->assertRedirect();
    expect(CountSheet::count())->toBe(1);

    // Second submit with same idempotency key fails or redirects without re-creating
    $this->post(route('counting.store'), $payload)->assertSessionHasErrors(['idempotency_key']);
    expect(CountSheet::count())->toBe(1);
});
