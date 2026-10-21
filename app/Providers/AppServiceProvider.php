<?php

namespace App\Providers;

use App\Models\Account;
use App\Models\AttributeDefinition;
use App\Models\AttributeValue;
use App\Models\Category;
use App\Models\ChurchSetting;
use App\Models\AccountingPeriod;
use App\Models\AllocationRule;
use App\Models\BankDeposit;
use App\Models\CountConfirmation;
use App\Models\CountLine;
use App\Models\CountSheet;
use App\Models\Donation;
use App\Models\Event;
use App\Models\EventMember;
use App\Models\Expense;
use App\Models\Fund;
use App\Models\FundTransfer;
use App\Models\LedgerEntry;
use App\Models\Member;
use App\Models\ServiceSchedule;
use App\Models\ServiceSession;
use App\Models\User;
use App\Policies\RolePolicy;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\Facades\Gate;
use Spatie\Permission\Models\Role;
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
        Gate::policy(Role::class, RolePolicy::class);

        Relation::enforceMorphMap([
            'user' => User::class,
            'role' => Role::class,
            'lookup_option' => \App\Models\LookupOption::class,
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
            'event' => Event::class,
            'event_member' => EventMember::class,
            'bank_deposit' => BankDeposit::class,
            'donation' => Donation::class,
            'expense' => Expense::class,
            'fund_transfer' => FundTransfer::class,
            'accounting_period' => AccountingPeriod::class,
            'report_signatory' => \App\Models\ReportSignatory::class,
            'frozen_report' => \App\Models\FrozenReport::class,
            'report_approval' => \App\Models\ReportApproval::class,
        ]);
    }
}
