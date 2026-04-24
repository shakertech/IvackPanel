<?php

namespace App\Http\Controllers;

use App\Models\Otp;
use Illuminate\Http\Request;

class OtpController extends Controller
{
    public function index()
    {
        return Otp::latest()->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'sender' => 'required|string',
            'mobile' => 'required|string',
            'message' => 'required|string',
            'code' => 'nullable|string',
        ]);

        if (empty($validated['code'])) {
            $validated['code'] = (string) rand(100000, 999999);
        }

        $otp = Otp::create($validated);

        return response()->json($otp, 201);
    }

    public function show(Otp $otp)
    {
        return $otp;
    }

    public function update(Request $request, Otp $otp)
    {
        $validated = $request->validate([
            'sender' => 'string',
            'mobile' => 'string',
            'message' => 'string',
            'code' => 'string',
            'is_used' => 'boolean',
        ]);

        $otp->update($validated);

        return $otp;
    }

    public function destroy(Otp $otp)
    {
        $otp->delete();
        return response()->noContent();
    }
}
