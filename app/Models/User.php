<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use App\Models\Concerns\Audited;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use Audited, HasFactory, HasRoles, Notifiable;

    /**
     * @var array<string, mixed>
     */
    protected $attributes = [
        'is_active' => true,
    ];

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'is_active',
        'signature_path',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    public function member(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(Member::class);
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
        ];
    }

    public function getSignatureBase64(): ?string
    {
        if (! $this->signature_path || ! \Illuminate\Support\Facades\Storage::disk('local')->exists($this->signature_path)) {
            return null;
        }
        $data = \Illuminate\Support\Facades\Storage::disk('local')->get($this->signature_path);
        return 'data:image/png;base64,'.base64_encode($data);
    }
}
