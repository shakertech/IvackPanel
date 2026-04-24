<?php

namespace App\Http\Controllers;

use App\Models\License;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class LicenseController extends Controller
{
    public function index()
    {
        return License::latest()->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'license_key' => 'required|string|unique:licenses',
            'machine' => 'nullable|string',
            'license_type' => 'nullable|string|in:trial,paid',
            'status' => 'nullable|string|in:active,suspended,expired',
            'expiry_date' => 'required|date',
        ]);

        $license = License::create([
            'license_key' => $validated['license_key'],
            'machine' => $validated['machine'] ?? null,
            'license_type' => $validated['license_type'] ?? 'trial',
            'status' => $validated['status'] ?? 'active',
            'expiry_date' => $validated['expiry_date'],
        ]);

        return response()->json($license, 201);
    }

    public function show(License $license)
    {
        return $license;
    }

    public function update(Request $request, License $license)
    {
        $validated = $request->validate([
            'license_key' => 'string|unique:licenses,license_key,' . $license->id,
            'machine' => 'nullable|string',
            'license_type' => 'string|in:trial,paid',
            'status' => 'string|in:active,suspended,expired',
            'expiry_date' => 'date',
        ]);

        $license->update($validated);

        return $license;
    }

    public function destroy(License $license)
    {
        $license->delete();
        return response()->noContent();
    }
}
