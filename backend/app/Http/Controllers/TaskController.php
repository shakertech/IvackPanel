<?php

namespace App\Http\Controllers;

use App\Http\Resources\TaskResource;
use App\Models\License;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class TaskController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Task::with(['license', 'user'])->latest();

        // Admin sees all tasks, others see their own
        if (!($user instanceof User && $user->role === 'admin')) {
            if ($user instanceof User) {
                $query->where('user_id', $user->id);
            } elseif ($user instanceof License) {
                $query->where('license_id', $user->id);
            } else {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
            }
        }

        // Search filter
        if ($request->has('search') && $request->search != '') {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('phone', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('result', 'like', "%{$search}%");
            });
        }

        // Status filter
        if ($request->has('status') && $request->status != 'all') {
            $status = $request->status;
            if ($status === 'active') {
                $query->whereNull('paylink');
            } elseif ($status === 'completed') {
                $query->whereNotNull('paylink');
            } elseif ($status === 'online') {
                $query->where('device_last_seen', '>=', now()->subMinutes(5));
            } elseif ($status === 'offline') {
                $query->where('device_last_seen', '<', now()->subMinutes(5));
            } elseif (in_array($status, ['pending', 'success', 'error'])) {
                $query->where('status', $status);
            }
        }

        $tasks = $query->get();

        return response()->json([
            'success' => true,
            'data' => TaskResource::collection($tasks),
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        
        $validated = $request->validate([
            'phone' => 'required|string',
            'email' => 'required|email',
            'password' => 'required|string',
            'priority' => 'nullable|string|in:low,medium,high',
            'files' => 'nullable|array|max:10',
            'files.*' => 'file|mimes:pdf|max:10240', // max 10MB per PDF
        ]);

        $data = [
            'phone' => $validated['phone'],
            'email' => $validated['email'],
            'password' => $validated['password'],
            'priority' => $validated['priority'] ?? 'medium',
        ];

        if ($user instanceof User) {
            $data['user_id'] = $user->id;
        } elseif ($user instanceof License) {
            $data['license_id'] = $user->id;
        }

        // Handle PDF file uploads
        if ($request->hasFile('files')) {
            $paths = [];
            foreach ($request->file('files') as $file) {
                $path = $file->store('task-files', 'public');
                $paths[] = $path;
            }
            $data['files'] = $paths;
        }

        $task = Task::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Task created successfully',
            'data' => new TaskResource($task),
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
            'data' => new TaskResource($task),
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
            'priority' => 'sometimes|string|in:low,medium,high',
            'files' => 'nullable|array|max:10',
            'files.*' => 'file|mimes:pdf|max:10240',
            'remove_files' => 'nullable|array', // array of file paths to remove
            'remove_files.*' => 'string',
        ]);

        $data = collect($validated)->only(['phone', 'email', 'password', 'priority'])->toArray();

        // Handle file removal
        if ($request->has('remove_files')) {
            $existingFiles = $task->files ?? [];
            foreach ($request->remove_files as $filePath) {
                Storage::disk('public')->delete($filePath);
                $existingFiles = array_filter($existingFiles, fn($f) => $f !== $filePath);
            }
            $data['files'] = array_values($existingFiles);
        }

        // Handle new file uploads (append to existing)
        if ($request->hasFile('files')) {
            $existingFiles = $data['files'] ?? $task->files ?? [];
            foreach ($request->file('files') as $file) {
                $path = $file->store('task-files', 'public');
                $existingFiles[] = $path;
            }
            $data['files'] = $existingFiles;
        }

        $task->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Task updated successfully',
            'data' => new TaskResource($task),
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
            'data' => new TaskResource($task),
        ]);
    }

    public function destroy(Request $request, $task_id)
    {
        $user = $request->user();

        $task = Task::find($task_id);
        if($task == null){
            return response()->json([
                'success' => false,
                'message' => 'Task not found',
            ], 404);
        }

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

        // Delete associated files from storage
        if ($task->files) {
            foreach ($task->files as $filePath) {
                Storage::disk('public')->delete($filePath);
            }
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

        // Bot only gets active tasks that are not yet completed
        $tasks = Task::where('paylink', null)
            ->whereIn('status', ['active', 'pending'])
            ->orderByRaw("CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 ELSE 4 END")
            ->offset($offset)
            ->limit($limit)
            ->get();

        return response()->json([
            'success' => true,
            'data' => TaskResource::collection($tasks),
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
        $task->status = 'complete';
        $task->result = 'Success';
        $task->success_at = now();
        $task->save();

        return response()->json([
            'success' => true,
            'message' => 'Paylink updated successfully',
            'data' => new TaskResource($task)
        ]);
    }



    public function update_result(Request $request){
        $request->validate([
            'task_id' => 'required|exists:tasks,id',
            'result' => 'required|string',
            'status' => 'nullable|string|in:active,inactive,pending,success,error,complete',
        ]);

        $task = Task::find($request->task_id);
        $task->result = $request->result;
        if ($request->has('status')) {
            $task->status = $request->status;
        }
        $task->save();

        return response()->json([
            'success' => true,
            'message' => 'Result updated successfully',
            'data' => new TaskResource($task)
        ]);
    }

    public function update_device_status(Request $request){
        $request->validate([
            'phone1' => 'required|string', 
            'phone2' => 'required|string', 
        ]);

        // Update all active tasks for this phone number
        Task::where('phone1', $request->phone1)->orWhere('phone2', $request->phone2)
            ->whereNull('paylink')
            ->update(['device_last_seen' => now()]);

        return response()->json([
            'success' => true,
            'message' => 'Device status updated'
        ]);
    }

    public function update_bot_details(Request $request){
        $request->validate([
            'task_id' => 'required|exists:tasks,id',
            'mission' => 'nullable|string',
            'visatype' => 'nullable|string',
            'peoples' => 'nullable|integer',
            'ivacCenter' => 'nullable|string',
        ]);

        $task = Task::find($request->task_id);
        if ($request->has('mission')) $task->mission = $request->mission;
        if ($request->has('visatype')) $task->visatype = $request->visatype;
        if ($request->has('peoples')) $task->peoples = $request->peoples;
        if ($request->has('ivacCenter')) $task->ivacCenter = $request->ivacCenter;
        $task->save();

        return response()->json([
            'success' => true,
            'message' => 'Bot details updated'
        ]);
    }


}
