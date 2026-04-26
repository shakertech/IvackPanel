<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Captcha extends Model
{
    use HasUlids;

    protected $fillable = [
        'license_id',
        'provider',
        'api_key',
    ];

    /**
     * Get the license that owns the captcha settings.
     */
    public function license(): BelongsTo
    {
        return $this->belongsTo(License::class);
    }
}
