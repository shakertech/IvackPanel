<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Laravel\Sanctum\HasApiTokens;

class License extends Authenticatable
{
    use HasApiTokens, HasFactory, HasUlids;

    protected $fillable = [
        'license_key',
        'machine',
        'license_type',
        'status',
        'expiry_date',
    ];

    protected $casts = [
        'expiry_date' => 'datetime',
    ];

    /**
     * Disable password requirements for License if not used, 
     * but we'll use license_key/machine as credentials.
     */
    public function getAuthPassword()
    {
        return $this->license_key;
    }
}
