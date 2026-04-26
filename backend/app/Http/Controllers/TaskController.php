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
            $tasks = Task::with(['license', 'user'])->latest()->get();
            return response()->json([
                'success' => true,
                'data' => $tasks,
            ]);
        }

        // Regular user sees their tasks
        if ($user instanceof User) {
            $tasks = Task::where('user_id', $user->id)->latest()->get();
            return response()->json([
                'success' => true,
                'data' => $tasks,
            ]);
        }

        // License sees its own tasks
        if ($user instanceof License) {
            $tasks = Task::where('license_id', $user->id)->latest()->get();
            return response()->json([
                'success' => true,
                'data' => $tasks,
            ]);
        }

        return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        
        $validated = $request->validate([
            'phone' => 'required|string',
            'email' => 'required|email',
            'password' => 'required|string',
            'peoples' => 'required|string',
            'priority' => 'nullable|string|in:low,medium,high',
            'status' => 'nullable|string',
            'result' => 'nullable|string',
            'paylink' => 'nullable|string',
            'proxy_ip' => 'nullable|string',
            'proxy_port' => 'nullable|string',
            'proxy_username' => 'nullable|string',
            'proxy_password' => 'nullable|string',
        ]);

        $data = $validated;

        if ($user instanceof User) {
            $data['user_id'] = $user->id;
        } elseif ($user instanceof License) {
            $data['license_id'] = $user->id;
        }

        $task = Task::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Task created successfully',
            'data' => $task,
        ], 201);
    }

    public function show(Request $request, Task $task)
    {
        $user = $request->user();

        // Authorization check
        if ($user instanceof User) {
            if ($user->role !== 'admin' && $task->user_id !== $user->id) {
                return response()->json(['success' => false, 'message' => 'Forbidden'], 403);
            }
        } elseif ($user instanceof License) {
            if ($task->license_id !== $user->id) {
                return response()->json(['success' => false, 'message' => 'Forbidden'], 403);
            }
        }

        $task->load(['license', 'user']);

        return response()->json([
            'success' => true,
            'data' => $task,
        ]);
    }

    public function update(Request $request, Task $task)
    {
        $user = $request->user();

        // Authorization check
        if ($user instanceof User) {
            if ($user->role !== 'admin' && $task->user_id !== $user->id) {
                return response()->json(['success' => false, 'message' => 'Forbidden'], 403);
            }
        } elseif ($user instanceof License) {
            if ($task->license_id !== $user->id) {
                return response()->json(['success' => false, 'message' => 'Forbidden'], 403);
            }
        }

        // Prevent editing completed tasks (paylink is set)
        if ($task->paylink) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot edit a completed task',
            ], 422);
        }

        $validated = $request->validate([
            'phone' => 'sometimes|string',
            'email' => 'sometimes|email',
            'password' => 'sometimes|string',
            'peoples' => 'sometimes|string',
            'priority' => 'sometimes|string|in:low,medium,high',
            'status' => 'nullable|string',
            'result' => 'nullable|string',
            'paylink' => 'nullable|string',
            'proxy_ip' => 'nullable|string',
            'proxy_port' => 'nullable|string',
            'proxy_username' => 'nullable|string',
            'proxy_password' => 'nullable|string',
        ]);

        $task->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Task updated successfully',
            'data' => $task,
        ]);
    }

    public function updatePriority(Request $request, Task $task)
    {
        $user = $request->user();

        // Authorization check
        if ($user instanceof User) {
            if ($user->role !== 'admin' && $task->user_id !== $user->id) {
                return response()->json(['success' => false, 'message' => 'Forbidden'], 403);
            }
        } elseif ($user instanceof License) {
            if ($task->license_id !== $user->id) {
                return response()->json(['success' => false, 'message' => 'Forbidden'], 403);
            }
        }

        // Prevent editing completed tasks (paylink is set)
        if ($task->paylink) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot edit a completed task',
            ], 422);
        }

        $validated = $request->validate([
            'priority' => 'required|string|in:low,medium,high',
        ]);

        $task->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Priority updated successfully',
            'data' => $task,
        ]);
    }

    public function destroy(Request $request, Task $task)
    {
        $user = $request->user();

        // Only owner or admin can delete
        if ($user instanceof User) {
            if ($user->role !== 'admin' && $task->user_id !== $user->id) {
                return response()->json(['success' => false, 'message' => 'Forbidden'], 403);
            }
        } elseif ($user instanceof License) {
            if ($task->license_id !== $user->id) {
                return response()->json(['success' => false, 'message' => 'Forbidden'], 403);
            }
        }

        // Prevent deleting completed tasks (paylink is set)
        if ($task->paylink) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete a completed task',
            ], 422);
        }

        $task->delete();

        return response()->json([
            'success' => true,
            'message' => 'Task deleted successfully',
        ]);
    }



    public function get_all_tasks(Request $request){        
        $request->validate([
            'limit' => 'nullable|integer|min:1|max:1000',
            'offset' => 'nullable|integer|min:0',
        ]);

        $limit = $request->query('limit', 100);
        $offset = $request->query('offset', 0);

        $tasks = Task::where('paylink','=',null)
        ->where('status','!=','invalid')
        ->orderByRaw("CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 ELSE 4 END")
        ->offset($offset)
        ->limit($limit)
        ->get();

        return response()->json([
            'success' => true,
            'data' => $tasks,
        ]);

    }


    public function update_paylink(Request $request){
        $request->validate([
            'task_id' => 'required|exists:tasks,id',
            'paylink' => 'required|url',
        ]);

        $task = Task::find($request->task_id);
        
        if ($task->paylink) {
            return response()->json([
                'success' => false,
                'message' => 'Task already has a paylink and cannot be overwritten',
            ], 422);
        }

        $task->paylink = $request->paylink;
        $task->status = 'completed';
        $task->result = 'Done';
        $task->save();

        return response()->json([
            'success' => true,
            'message' => 'Paylink updated successfully',
            'data' => $task
        ]);
    }



    public function update_result(Request $request){
        $request->validate([
            'task_id' => 'required|exists:tasks,id',
            'result' => 'required|string',
        ]);

        $task = Task::find($request->task_id);
        $task->result = $request->result;
        $task->status = 'invalid';
        $task->save();

        return response()->json([
            'success' => true,
            'message' => 'Result updated successfully',
            'data' => $task
        ]);
    }


}
