<?php

namespace App\Http\Controllers;

use App\Models\License;
use App\Models\Proxy;
use App\Models\User;
use Illuminate\Http\Request;

class ProxyController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        // Admin sees all proxies
        if ($user instanceof User && $user->role === 'admin') {
            return Proxy::with(['license', 'user'])->latest()->get();
        }

        // Regular user sees their proxies
        if ($user instanceof User) {
            return Proxy::where('user_id', $user->id)->latest()->get();
        }

        // License sees its own proxies
        if ($user instanceof License) {
            return Proxy::where('license_id', $user->id)->latest()->get();
        }

        return response()->json(['message' => 'Unauthorized'], 403);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        
        $validated = $request->validate([
            'type' => 'nullable|string',
            'ip' => 'required|string',
            'port' => 'required|integer',
            'username' => 'nullable|string',
            'password' => 'nullable|string',
        ]);

        $data = $validated;

        if ($user instanceof User) {
            $data['user_id'] = $user->id;
        } elseif ($user instanceof License) {
            $data['license_id'] = $user->id;
        }

        $proxy = Proxy::create($data);

        return response()->json($proxy, 201);
    }

    public function show(Request $request, Proxy $proxy)
    {
        $user = $request->user();

        // Authorization check
        if ($user instanceof User) {
            if ($user->role !== 'admin' && $proxy->user_id !== $user->id) {
                return response()->json(['message' => 'Forbidden'], 403);
            }
        } elseif ($user instanceof License) {
            if ($proxy->license_id !== $user->id) {
                return response()->json(['message' => 'Forbidden'], 403);
            }
        }

        return $proxy->load(['license', 'user']);
    }

    public function update(Request $request, Proxy $proxy)
    {
        $user = $request->user();

        // Authorization check
        if ($user instanceof User) {
            if ($user->role !== 'admin' && $proxy->user_id !== $user->id) {
                return response()->json(['message' => 'Forbidden'], 403);
            }
        } elseif ($user instanceof License) {
            if ($proxy->license_id !== $user->id) {
                return response()->json(['message' => 'Forbidden'], 403);
            }
        }

        $validated = $request->validate([
            'type' => 'sometimes|string|in:http,socks4,socks5',
            'ip' => 'sometimes|string',
            'port' => 'sometimes|integer',
            'username' => 'nullable|string',
            'password' => 'nullable|string',
        ]);

        $proxy->update($validated);

        return $proxy;
    }

    public function destroy(Request $request, Proxy $proxy)
    {
        $user = $request->user();

        // Only owner or admin can delete
        if ($user instanceof User) {
            if ($user->role !== 'admin' && $proxy->user_id !== $user->id) {
                return response()->json(['message' => 'Forbidden'], 403);
            }
        } elseif ($user instanceof License) {
            if ($proxy->license_id !== $user->id) {
                return response()->json(['message' => 'Forbidden'], 403);
            }
        }

        $proxy->delete();
        return response()->noContent();
    }
}
