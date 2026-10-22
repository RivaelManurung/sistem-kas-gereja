<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Wilayah;
use App\Models\WilayahOfficer;
use App\Support\Lookups;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class WilayahOfficerController extends Controller
{
    public function store(Request $request, Wilayah $wilayah): RedirectResponse
    {
        $data = $this->validated($request, $wilayah);
        $officer = $wilayah->officers()->create($data);

        return back()->with('success', "{$officer->member->name} dicatat sebagai pengurus {$wilayah->name}.");
    }

    public function update(Request $request, Wilayah $wilayah, WilayahOfficer $officer): RedirectResponse
    {
        abort_unless($officer->wilayah_id === $wilayah->id, 404);
        $officer->update($this->validated($request, $wilayah, $officer));

        return back()->with('success', 'Data pengurus diperbarui.');
    }

    public function destroy(Wilayah $wilayah, WilayahOfficer $officer): RedirectResponse
    {
        abort_unless($officer->wilayah_id === $wilayah->id, 404);
        $officer->delete();

        return back()->with('success', 'Pengurus dihapus dari wilayah.');
    }

    /** @return array<string, mixed> */
    private function validated(Request $request, Wilayah $wilayah, ?WilayahOfficer $officer = null): array
    {
        $data = $request->validate([
            'member_id' => ['required', 'integer', Rule::exists('members', 'id')->where('is_active', true)->when($officer, fn ($r) => $r->orWhere('id', $officer->member_id))],
            'role' => ['required', Lookups::rule('wilayah_role')],
            'start_date' => ['nullable', 'date_format:Y-m-d'],
            'end_date' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:start_date'],
            'notes' => ['nullable', 'string', 'max:500'],
        ], [
            'member_id.required' => 'Pilih jemaat yang menjadi pengurus.',
            'member_id.exists' => 'Jemaat ini tidak aktif atau tidak ditemukan.',
            'role.required' => 'Pilih jabatan pengurus.',
            'end_date.after_or_equal' => 'Tanggal selesai tidak boleh sebelum tanggal mulai.',
        ], ['member_id' => 'jemaat', 'role' => 'jabatan', 'start_date' => 'tanggal mulai', 'end_date' => 'tanggal selesai']);

        $duplicate = $wilayah->officers()
            ->where('member_id', $data['member_id'])->where('role', $data['role'])
            ->whereNull('end_date')
            ->when($officer, fn ($q) => $q->where('id', '!=', $officer->id))
            ->exists();

        if ($duplicate && empty($data['end_date'])) {
            throw ValidationException::withMessages(['role' => 'Jemaat ini sudah menjabat dengan jabatan yang sama di wilayah ini.']);
        }

        return $data;
    }
}
