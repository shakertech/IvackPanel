<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

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
            'phone' => $this->phone,
            'email' => $this->email,
            'password' => $this->password,
            'peoples' => $this->peoples,
            'priority' => $this->priority,
            'status' => $this->status,
            'result' => $this->result,
            'paylink' => $this->paylink,
            'license' => $this->whenLoaded('license'),
            'user' => $this->whenLoaded('user'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
