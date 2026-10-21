<?php

namespace App\Models;

use App\Models\Concerns\Audited;
use Illuminate\Database\Eloquent\Model;

class ChurchSetting extends Model
{
    use Audited;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'denominations' => 'array',
            'min_confirmations_service' => 'integer',
            'min_confirmations_event' => 'integer',
            'min_confirmations_general' => 'integer',
            'expense_approval_threshold' => 'integer',
            'allow_negative_balance' => 'boolean',
            'public_page_enabled' => 'boolean',
        ];
    }

    public function getStampBase64(): ?string
    {
        if (! $this->stamp_path || ! \Illuminate\Support\Facades\Storage::disk('local')->exists($this->stamp_path)) {
            return null;
        }
        $data = \Illuminate\Support\Facades\Storage::disk('local')->get($this->stamp_path);
        return 'data:image/png;base64,'.base64_encode($data);
    }

    public function getLogoBase64(): ?string
    {
        if (! $this->logo_path) {
            return null;
        }
        $disk = \Illuminate\Support\Facades\Storage::disk('public')->exists($this->logo_path) ? 'public' : 'local';
        if (! \Illuminate\Support\Facades\Storage::disk($disk)->exists($this->logo_path)) {
            return null;
        }
        $data = \Illuminate\Support\Facades\Storage::disk($disk)->get($this->logo_path);
        return 'data:image/png;base64,'.base64_encode($data);
    }

    /** Identitas yang tampil di seluruh aplikasi; logo sekaligus dipakai sebagai favicon. */
    public function brand(): array
    {
        $url = fn (?string $path) => $path
            ? \Illuminate\Support\Facades\Storage::disk('public')->url($path).'?v='.($this->updated_at?->timestamp ?? 1)
            : null;

        return [
            'name' => $this->system_name ?: 'Kas Gereja',
            'church_name' => $this->name,
            'logo_url' => $url($this->logo_path),
            'favicon_url' => $url($this->logo_path),
        ];
    }

    public static function current(): self
    {
        return static::query()->first() ?? static::query()->create([
            'name' => 'Gereja',
            'timezone' => 'Asia/Jakarta',
            'denominations' => [100000, 50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100],
            'min_confirmations_service' => 2,
            'min_confirmations_event' => 2,
            'min_confirmations_general' => 2,
            'expense_approval_threshold' => 0,
            'allow_negative_balance' => false,
            'public_page_enabled' => false,
        ]);
    }
}
