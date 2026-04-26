<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Proxy extends Model
{
    use HasFactory, HasUlids, SoftDeletes;

    protected $fillable = [
        'license_id',
        'user_id',
        'type',
        'ip',
        'port',
        'username',
        'password',
    ];

    /**
     * Get the license that owns the proxy.
     */
    public function license()
    {
        return $this->belongsTo(License::class);
    }

    /**
     * Get the user that owns the proxy.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
