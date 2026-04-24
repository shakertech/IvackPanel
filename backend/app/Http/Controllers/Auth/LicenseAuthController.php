<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\License;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class LicenseAuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'license_key' => 'required|string',
            'machine' => 'required|string',
        ]);

        $license = License::where('license_key', $request->license_key)
            ->where('machine', $request->machine)
            ->first();

        if (!$license) {
            throw ValidationException::withMessages([
                'license_key' => ['Invalid license key or machine ID.'],
            ]);
        }

        if ($license->status !== 'active') {
            return response()->json(['message' => 'License is not active.'], 403);
        }

        if ($license->expiry_date->isPast()) {
            $license->update(['status' => 'expired']);
            return response()->json(['message' => 'License has expired.'], 403);
        }

        $token = $license->createToken('license-token')->plainTextToken;

        return response()->json([
            'license' => $license,
            'token' => $token,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'License session closed.']);
    }
}
