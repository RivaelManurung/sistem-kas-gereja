<?php

namespace App\Providers;

use App\Models\Account;
use App\Models\Category;
use App\Models\ChurchSetting;
use App\Models\Fund;
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
        ]);
    }
}
