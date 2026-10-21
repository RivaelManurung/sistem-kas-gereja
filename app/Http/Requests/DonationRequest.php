<?php

namespace App\Http\Requests;

use App\Models\Category;
use App\Models\CountSheet;
use App\Models\Donation;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class DonationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'count_sheet_id' => ['nullable', 'exists:count_sheets,id'],
            'member_id' => ['nullable', 'exists:members,id'],
            'donor_name' => ['nullable', 'string', 'max:255'],
            'category_id' => ['required', 'exists:categories,id'],
            'amount' => ['required', 'integer', 'min:1'],
            'payment_method' => ['nullable', 'in:cash,transfer,qris'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function ($validator) {
            $categoryId = $this->input('category_id');
            $amount = (int) $this->input('amount', 0);
            $sheetId = $this->input('count_sheet_id');
            $memberId = $this->input('member_id');
            $donorName = $this->input('donor_name');

            if (empty($memberId) && empty($donorName)) {
                $validator->errors()->add('member_id', 'Nama donatur atau anggota jemaat wajib dipilih/diisi.');
            }

            if ($categoryId) {
                $category = Category::find($categoryId);
                if ($category && ! $category->allows_named) {
                    $validator->errors()->add('category_id', 'Kategori persembahan ini tidak mengizinkan pencatatan atas nama.');
                }
            }

            if ($sheetId && $categoryId && $amount > 0) {
                $sheet = CountSheet::with('lines')->find($sheetId);
                if ($sheet) {
                    $line = $sheet->lines->firstWhere('category_id', $categoryId);
                    if (! $line) {
                        $validator->errors()->add('category_id', 'Kategori ini tidak terdapat dalam berita acara terkait.');
                    } else {
                        $currentDonationId = $this->route('donation')?->id;
                        $existingSum = Donation::where('count_sheet_id', $sheetId)
                            ->where('category_id', $categoryId)
                            ->when($currentDonationId, fn ($q) => $q->where('id', '!=', $currentDonationId))
                            ->sum('amount');

                        if (($existingSum + $amount) > $line->amount) {
                            $subtotalStr = number_format($line->amount, 0, ',', '.');
                            $maxAllowed = max(0, $line->amount - $existingSum);
                            $maxAllowedStr = number_format($maxAllowed, 0, ',', '.');

                            $validator->errors()->add(
                                'amount',
                                "Total persembahan atas nama melebihi subtotal kategori pada berita acara (maksimal tersisa Rp {$maxAllowedStr} dari subtotal Rp {$subtotalStr})."
                            );
                        }
                    }
                }
            }
        });
    }

    public function messages(): array
    {
        return [
            'category_id.required' => 'Pos persembahan wajib dipilih.',
            'amount.required' => 'Nominal persembahan wajib diisi.',
            'amount.min' => 'Nominal persembahan harus lebih dari Rp 0.',
        ];
    }
}
