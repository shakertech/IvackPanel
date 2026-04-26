<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Task extends Model
{
    use HasFactory, HasUlids;

    protected $fillable = [
        'license_id',
        'user_id',
        'phone',
        'email',
        'password',
        'peoples',
        'priority',
        'status',
        'result',
        'paylink',
        'proxy_ip',
        'proxy_port',
        'proxy_username',
        'proxy_password',
    ];

    protected $casts = [
    ];

    public function license(): BelongsTo
    {
        return $this->belongsTo(License::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
