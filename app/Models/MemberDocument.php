<?php

namespace App\Models;

use App\Models\Concerns\Audited;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MemberDocument extends Model
{
    use Audited;

    /** Jalur berkas tidak perlu tampil di jejak aktivitas. */
    protected array $auditExclude = ['file_path'];

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['issued_date' => 'date:Y-m-d', 'size' => 'integer'];
    }

    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
