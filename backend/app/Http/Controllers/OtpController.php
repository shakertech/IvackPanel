<?php

namespace App\Http\Controllers;

use App\Models\Otp;
use Illuminate\Http\Request;

class OtpController extends Controller
{
    public function getOtpByPhone( $phone)
    {
        $otp = Otp::where('mobile', $phone)
            ->where('is_used', 0)
            ->where('message', 'LIKE', '%IVACBD%')
            ->latest()
            ->first();

        if (!$otp) {
            return response()->json([
                'success' => false,
                'message' => 'OTP not found'
            ], 404);
        }

        $this->clear_otp_internal($phone);

        $message = $otp->message;
        if (strpos($message, 'IVACBD') !== false) {
            if (empty($otp->code)) {
                $otp->code = $this->extractCode($message);
            }

            $otp->is_used = 1;
            $otp->save();

            return response()->json([
                'success' => true,
                'mobile' => $otp->mobile,
                'otp' => $otp->code,
                'time' => $otp->created_at->format('Y-m-d H:i:s'),
            ], 200);
        } else {
            return response()->json([
                'success' => false,
                'message' => 'OTP format not found'
            ], 400);
        }
    }


    public function clear_otp($mobile){
        $this->clear_otp_internal($mobile);
        return response()->json([
            'success' => true,
            'message' => 'OTP cleared successfully'
        ], 200);
    }

    private function clear_otp_internal($mobile){
        Otp::where("mobile", $mobile)
            ->where('is_used', 0)
            ->update(["is_used" => true]);
    }





    public function insertotp(Request $request)
    {
        $validated = $request->validate([
            'sender' => 'nullable|string',
            'mobile' => 'required|string',
            'message' => 'required|string',
            'code' => 'nullable|string',
        ]);

        // Mark all previous active OTPs for this mobile as used
        Otp::where("mobile", $validated['mobile'])
            ->where('is_used', 0)
            ->update(["is_used" => true]);

        // Use the provided code if available, otherwise try to extract it from the message
        $code = $validated['code'] ?? $this->extractCode($validated['message']);

        Otp::create([
            'sender' => $validated['sender'],
            'mobile' => $validated['mobile'],
            'message' => $validated['message'],
            'code' => $code,
            'is_used' => 0,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'OTP inserted successfully'
        ], 200);
    }





    public function extractCode($message)
    {
        if (strpos($message, 'IVACBD') !== false) {
        // Extract word sequence (e.g. Two-Seven-Seven...)
            preg_match('/([A-Za-z\-]+)\s*\.$/', $message, $matches);

            if (!isset($matches[1])) {
                return null;
            }

            $wordOtp = $matches[1];

            // Word → Digit map
            $map = [
                'Zero' => 0,
                'One' => 1,
                'Two' => 2,
                'Three' => 3,
                'Four' => 4,
                'Five' => 5,
                'Six' => 6,
                'Seven' => 7,
                'Eight' => 8,
                'Nine' => 9,
            ];

            $words = explode('-', $wordOtp);
            $digitOtp = '';

            foreach ($words as $word) {
                $word = ucfirst(strtolower($word));
                if (isset($map[$word])) {
                    $digitOtp .= $map[$word];
                }
            }

            return $digitOtp;
        }else{
            return "";
        }
    }



}
