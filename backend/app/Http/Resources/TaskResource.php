<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class TaskResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'license_id' => $this->license_id,
            'user_id' => $this->user_id,

            // User-created fields
            'phone' => $this->phone,
            'email' => $this->email,
            'password' => $this->password,
            'priority' => $this->priority,

            // PDF files — return full URLs
            'files' => $this->files ? collect($this->files)->map(function ($path) {
                return [
                    'name' => basename($path),
                    'path' => $path,
                    'url' => Storage::disk('public')->url($path),
                ];
            })->values()->all() : [],

            // Bot-updated fields
            'peoples' => $this->peoples,
            'ivacCenter' => $this->ivacCenter,
            'mission' => $this->mission,
            'visatype' => $this->visatype,
            'status' => $this->status,
            'result' => $this->result,
            'paylink' => $this->paylink,
            'success_at' => $this->success_at,
            'device_last_seen' => $this->device_last_seen,
            'device_online' => $this->device_last_seen
                ? $this->device_last_seen->diffInMinutes(now()) < 5
                : false,

            // Relationships
            'license' => $this->whenLoaded('license'),
            'user' => $this->whenLoaded('user'),

            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
