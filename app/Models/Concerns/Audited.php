<?php

namespace App\Models\Concerns;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;

/**
 * Writes an audit_logs row for every create, update and delete.
 * Models may define `protected array $auditExclude` for extra hidden fields.
 */
trait Audited
{
    private const AUDIT_ALWAYS_EXCLUDED = ['created_at', 'updated_at', 'password', 'remember_token'];

    public static function bootAudited(): void
    {
        static::created(function (Model $model) {
            AuditLog::record($model, 'created', [], $model->auditableValues(array_keys($model->getAttributes())));
        });

        static::updated(function (Model $model) {
            $keys = array_keys($model->getChanges());
            $new = $model->auditableValues($keys);

            if ($new === []) {
                return;
            }

            $old = [];
            foreach (array_keys($new) as $key) {
                $old[$key] = $model->getOriginal($key);
            }

            AuditLog::record($model, 'updated', $old, $new);
        });

        static::deleted(function (Model $model) {
            AuditLog::record($model, 'deleted', $model->auditableValues(array_keys($model->getAttributes())), []);
        });
    }

    /**
     * @param  list<string>  $keys
     * @return array<string, mixed>
     */
    public function auditableValues(array $keys): array
    {
        $excluded = [...self::AUDIT_ALWAYS_EXCLUDED, ...($this->auditExclude ?? [])];
        $values = [];

        foreach ($keys as $key) {
            if (! in_array($key, $excluded, true)) {
                $values[$key] = $this->getAttribute($key);
            }
        }

        return $values;
    }
}
