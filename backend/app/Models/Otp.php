<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Otp extends Model
{
    use HasFactory;

    protected $fillable = [
        'sender',
        'mobile',
        'message',
        'code',
        'is_used',
    ];

    protected $casts = [
        'is_used' => 'boolean',
    ];
}
