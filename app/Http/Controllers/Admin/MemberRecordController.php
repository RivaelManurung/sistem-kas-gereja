<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Member;
use App\Models\MemberDocument;
use App\Models\MemberMilestone;
use App\Models\MemberMinistry;
use App\Support\Lookups;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

/** Riwayat gerejawi, pelayanan, dan dokumen yang melekat pada satu jemaat. */
class MemberRecordController extends Controller
{
    // ---- peristiwa gerejawi (baptis, sidi, nikah, atestasi)

    public function storeMilestone(Request $request, Member $member): RedirectResponse
    {
        $data = $this->milestoneData($request, $member);
        $milestone = $member->milestones()->create($data);

        $note = $this->applyMilestoneEffects($member, $milestone);

        return back()->with('success', 'Peristiwa gerejawi dicatat.'.$note);
    }

    public function updateMilestone(Request $request, Member $member, MemberMilestone $milestone): RedirectResponse
    {
        abort_unless($milestone->member_id === $member->id, 404);
        $milestone->update($this->milestoneData($request, $member));

        return back()->with('success', 'Peristiwa gerejawi diperbarui.');
    }

    public function destroyMilestone(Member $member, MemberMilestone $milestone): RedirectResponse
    {
        abort_unless($milestone->member_id === $member->id, 404);
        $milestone->delete();

        return back()->with('success', 'Peristiwa gerejawi dihapus.');
    }

    /** @return array<string, mixed> */
    private function milestoneData(Request $request, Member $member): array
    {
        $data = $request->validate([
            'type' => ['required', Lookups::rule('milestone_type')],
            'date' => ['required', 'date_format:Y-m-d', 'before_or_equal:'.now()->toDateString(), $member->birth_date ? 'after_or_equal:'.$member->birth_date->toDateString() : 'nullable'],
            'church' => ['nullable', 'string', 'max:255'],
            'minister' => ['nullable', 'string', 'max:255'],
            'certificate_number' => ['nullable', 'string', 'max:80'],
            'civil_number' => ['nullable', 'string', 'max:80'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ], [
            'date.required' => 'Tanggal wajib diisi.',
            'date.before_or_equal' => 'Tanggal tidak boleh di masa depan.',
            'date.after_or_equal' => 'Tanggal tidak boleh sebelum tanggal lahir jemaat.',
        ], ['type' => 'jenis peristiwa', 'date' => 'tanggal']);

        return $data;
    }

    /** Peristiwa tertentu mengubah status keanggotaan; hasilnya disebutkan di pesan agar tidak mengejutkan. */
    private function applyMilestoneEffects(Member $member, MemberMilestone $milestone): string
    {
        if ($milestone->type === 'sidi' && $member->membership_status === 'anak') {
            $member->update(['membership_status' => 'tetap']);

            return ' Status keanggotaan berubah menjadi anggota tetap.';
        }

        if ($milestone->type === 'atestasi_keluar') {
            $member->update(['membership_status' => 'pindah', 'is_active' => false]);

            return ' Status keanggotaan berubah menjadi pindah dan jemaat dinonaktifkan.';
        }

        return '';
    }

    // ---- pelayanan dan jabatan

    public function storeMinistry(Request $request, Member $member): RedirectResponse
    {
        $member->ministries()->create($this->ministryData($request));

        return back()->with('success', 'Pelayanan dicatat.');
    }

    public function updateMinistry(Request $request, Member $member, MemberMinistry $ministry): RedirectResponse
    {
        abort_unless($ministry->member_id === $member->id, 404);
        $ministry->update($this->ministryData($request));

        return back()->with('success', 'Pelayanan diperbarui.');
    }

    public function destroyMinistry(Member $member, MemberMinistry $ministry): RedirectResponse
    {
        abort_unless($ministry->member_id === $member->id, 404);
        $ministry->delete();

        return back()->with('success', 'Pelayanan dihapus.');
    }

    /** @return array<string, mixed> */
    private function ministryData(Request $request): array
    {
        return $request->validate([
            'ministry' => ['required', Lookups::rule('ministry')],
            'role_title' => ['nullable', 'string', 'max:100'],
            'start_date' => ['nullable', 'date_format:Y-m-d'],
            'end_date' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:start_date'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ], [
            'ministry.required' => 'Pilih pelayanan atau jabatan.',
            'end_date.after_or_equal' => 'Tanggal selesai tidak boleh sebelum tanggal mulai.',
        ], ['ministry' => 'pelayanan', 'start_date' => 'tanggal mulai', 'end_date' => 'tanggal selesai']);
    }

    // ---- dokumen

    public function storeDocument(Request $request, Member $member): RedirectResponse
    {
        $data = $request->validate([
            'type' => ['required', Lookups::rule('member_document_type')],
            'title' => ['nullable', 'string', 'max:255'],
            'document_number' => ['nullable', 'string', 'max:80'],
            'issued_date' => ['nullable', 'date_format:Y-m-d', 'before_or_equal:'.now()->toDateString()],
            'notes' => ['nullable', 'string', 'max:1000'],
            'file' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png,webp', 'max:5120'],
        ], [
            'file.required' => 'Pilih berkas yang akan diunggah.',
            'file.mimes' => 'Berkas harus PDF, JPG, PNG, atau WebP.',
            'file.max' => 'Ukuran berkas maksimal 5 MB.',
            'issued_date.before_or_equal' => 'Tanggal terbit tidak boleh di masa depan.',
        ], ['type' => 'jenis dokumen', 'file' => 'berkas', 'issued_date' => 'tanggal terbit']);

        $file = $request->file('file');
        $member->documents()->create([
            ...collect($data)->except('file')->all(),
            'file_path' => $file->store("members/{$member->id}/documents", 'local'),
            'original_name' => $file->getClientOriginalName(),
            'mime' => $file->getMimeType() ?? 'application/octet-stream',
            'size' => $file->getSize(),
            'uploaded_by' => $request->user()->id,
        ]);

        return back()->with('success', 'Dokumen diunggah.');
    }

    public function downloadDocument(Member $member, MemberDocument $document): StreamedResponse
    {
        abort_unless($document->member_id === $member->id && Storage::disk('local')->exists($document->file_path), 404);

        return Storage::disk('local')->download($document->file_path, $document->original_name);
    }

    public function destroyDocument(Member $member, MemberDocument $document): RedirectResponse
    {
        abort_unless($document->member_id === $member->id, 404);

        Storage::disk('local')->delete($document->file_path);
        $document->delete();

        return back()->with('success', 'Dokumen dihapus.');
    }
}
