<?php

namespace App\Http\Controllers;

use App\Models\License;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        // Admin sees all tasks
        if ($user instanceof User && $user->role === 'admin') {
            return Task::with(['license', 'user'])->latest()->get();
        }

        // Regular user sees their tasks
        if ($user instanceof User) {
            return Task::where('user_id', $user->id)->latest()->get();
        }

        // License sees its own tasks
        if ($user instanceof License) {
            return Task::where('license_id', $user->id)->latest()->get();
        }

        return response()->json(['message' => 'Unauthorized'], 403);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        
        $validated = $request->validate([
            'phone' => 'required|string',
            'email' => 'required|email',
            'password' => 'required|string',
            'peoples' => 'required|string',
            'status' => 'nullable|string',
            'result' => 'nullable|string',
            'paylink' => 'nullable|string',
        ]);

        $data = $validated;

        if ($user instanceof User) {
            $data['user_id'] = $user->id;
        } elseif ($user instanceof License) {
            $data['license_id'] = $user->id;
        }

        $task = Task::create($data);

        return response()->json($task, 201);
    }

    public function show(Request $request, Task $task)
    {
        $user = $request->user();

        // Authorization check
        if ($user instanceof User) {
            if ($user->role !== 'admin' && $task->user_id !== $user->id) {
                return response()->json(['message' => 'Forbidden'], 403);
            }
        } elseif ($user instanceof License) {
            if ($task->license_id !== $user->id) {
                return response()->json(['message' => 'Forbidden'], 403);
            }
        }

        return $task->load(['license', 'user']);
    }

    public function update(Request $request, Task $task)
    {
        $user = $request->user();

        // Authorization check
        if ($user instanceof User) {
            if ($user->role !== 'admin' && $task->user_id !== $user->id) {
                return response()->json(['message' => 'Forbidden'], 403);
            }
        } elseif ($user instanceof License) {
            if ($task->license_id !== $user->id) {
                return response()->json(['message' => 'Forbidden'], 403);
            }
        }

        $validated = $request->validate([
            'phone' => 'sometimes|string',
            'email' => 'sometimes|email',
            'password' => 'sometimes|string',
            'peoples' => 'sometimes|string',
            'status' => 'nullable|string',
            'result' => 'nullable|string',
            'paylink' => 'nullable|string',
        ]);

        $task->update($validated);

        return $task;
    }

    public function destroy(Request $request, Task $task)
    {
        $user = $request->user();

        // Only owner or admin can delete
        if ($user instanceof User) {
            if ($user->role !== 'admin' && $task->user_id !== $user->id) {
                return response()->json(['message' => 'Forbidden'], 403);
            }
        } elseif ($user instanceof License) {
            if ($task->license_id !== $user->id) {
                return response()->json(['message' => 'Forbidden'], 403);
            }
        }

        $task->delete();
        return response()->noContent();
    }
}
