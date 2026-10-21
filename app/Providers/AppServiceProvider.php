<?php

namespace App\Providers;

use App\Models\Account;
use App\Models\AttributeDefinition;
use App\Models\AttributeValue;
use App\Models\Category;
use App\Models\ChurchSetting;
use App\Models\AllocationRule;
use App\Models\BankDeposit;
use App\Models\CountConfirmation;
use App\Models\CountLine;
use App\Models\CountSheet;
use App\Models\Donation;
use App\Models\Fund;
use App\Models\LedgerEntry;
use App\Models\Member;
use App\Models\ServiceSchedule;
use App\Models\ServiceSession;
use App\Models\User;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Aliases double as AttributeEntity values and audit_logs.auditable_type.
        Relation::enforceMorphMap([
            'user' => User::class,
            'church_setting' => ChurchSetting::class,
            'account' => Account::class,
            'fund' => Fund::class,
            'category' => Category::class,
            'attribute_definition' => AttributeDefinition::class,
            'attribute_value' => AttributeValue::class,
            'member' => Member::class,
            'ledger_entry' => LedgerEntry::class,
            'service_schedule' => ServiceSchedule::class,
            'service_session' => ServiceSession::class,
            'count_sheet' => CountSheet::class,
            'count_line' => CountLine::class,
            'count_confirmation' => CountConfirmation::class,
            'allocation_rule' => AllocationRule::class,
            'bank_deposit' => BankDeposit::class,
            'donation' => Donation::class,
        ]);
    }
}
