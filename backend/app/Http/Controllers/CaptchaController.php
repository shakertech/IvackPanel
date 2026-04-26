<?php

namespace App\Http\Controllers;

use App\Models\Captcha;
use Illuminate\Http\Request;

class CaptchaController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return response()->json(Captcha::all());
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'license_id' => 'nullable|exists:licenses,id',
            'provider'   => 'nullable|string|max:255',
            'api_key'    => 'nullable|string|max:255',
        ]);

        $captcha = Captcha::create($validated);

        return response()->json($captcha, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Captcha $captcha)
    {
        return response()->json($captcha);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Captcha $captcha)
    {
        $validated = $request->validate([
            'license_id' => 'nullable|exists:licenses,id',
            'provider'   => 'nullable|string|max:255',
            'api_key'    => 'nullable|string|max:255',
        ]);

        $captcha->update($validated);

        return response()->json($captcha);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Captcha $captcha)
    {
        $captcha->delete();

        return response()->json(null, 204);
    }
}
