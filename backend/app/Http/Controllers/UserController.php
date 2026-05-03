<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index()
    {
        return User::latest()->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'username' => 'required|string|unique:users,phone',
            'password' => 'required|string|min:6',
            'role' => 'nullable|string|in:user,admin',
            'status' => 'nullable|string',
        ]);

        $user = User::create([
            'phone' => $validated['username'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'] ?? 'user',
            'status' => $validated['status'] ?? 'active',
        ]);

        return response()->json($user, 201);
    }

    public function show(User $user)
    {
        return $user;
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'username' => 'string|unique:users,phone,' . $user->id,
            'password' => 'nullable|string|min:6',
            'role' => 'string|in:user,admin',
            'status' => 'string',
        ]);

        if (isset($validated['username'])) {
            $user->phone = $validated['username'];
        }

        if (isset($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }

        if (isset($validated['role'])) {
            $user->role = $validated['role'];
        }

        if (isset($validated['status'])) {
            $user->status = $validated['status'];
        }

        $user->save();

        return $user;
    }

    public function destroy(User $user)
    {
        $user->delete();
        return response()->noContent();
    }
}
