<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use LogicException;

class AuditLog extends Model
{
    public const UPDATED_AT = null;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'old_values' => 'array',
            'new_values' => 'array',
            'created_at' => 'datetime',
        ];
    }

    /**
     * @param  array<string, mixed>  $old
     * @param  array<string, mixed>  $new
     */
    public static function record(Model $subject, string $event, array $old = [], array $new = []): self
    {
        return static::create([
            'user_id' => auth()->id(),
            'auditable_type' => $subject->getMorphClass(),
            'auditable_id' => $subject->getKey(),
            'event' => $event,
            'old_values' => $old,
            'new_values' => $new,
            'ip_address' => app()->runningInConsole() ? null : request()->ip(),
        ]);
    }

    public function save(array $options = []): bool
    {
        if ($this->exists) {
            throw new LogicException('Audit logs are append-only.');
        }

        return parent::save($options);
    }

    public function delete(): ?bool
    {
        throw new LogicException('Audit logs are append-only.');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function auditable(): MorphTo
    {
        return $this->morphTo();
    }
}
