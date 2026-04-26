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

        $license = License::where('license_key', $request->license_key)->first();


    

        if (!$license) {
            throw ValidationException::withMessages([
                'license_key' => ['Invalid license key'],
            ]);
        }

        if($license->machine == ''){
            $license->update(['machine' => $request->machine]);
        }
        else if($license->machine !== $request->machine){
            return response()->json(['message' => 'License is not valid for this machine.'], 403);
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



    public function validate(Request $request){
        $request->validate([
            'license_key' => 'required|string',
            'machine' => 'required|string',
        ]);

        $license = License::where('license_key', $request->license_key)->first();


    

        if (!$license) {
            throw ValidationException::withMessages([
                'license_key' => ['Invalid license key'],
            ]);
        }

        if($license->machine !== $request->machine){
            return response()->json(['message' => 'License is not valid for this machine.'], 403);
        }

        


        if ($license->status !== 'active') {
            return response()->json(['message' => 'License is not active.'], 403);
        }

        if ($license->expiry_date->isPast()) {
            $license->update(['status' => 'expired']);
            return response()->json(['message' => 'License has expired.'], 403);
        }

        return response()->json(['message' => 'License is valid.'], 200);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'License session closed.']);
    }
}
