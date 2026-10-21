<?php

namespace App\Http\Controllers\Admin;

use App\Enums\AttributeEntity;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\MemberRequest;
use App\Models\AttributeDefinition;
use App\Models\Member;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class MemberController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->query('search');

        $members = Member::query()
            ->with('user:id,name,email')
            ->search($search)
            ->orderBy('name')
            ->paginate(25)
            ->withQueryString();

        return Inertia::render('admin/members/index', [
            'members' => $members,
            'search' => $search ?? '',
        ]);
    }

    public function create(): Response
    {
        $availableUsers = User::query()
            ->whereDoesntHave('member')
            ->orderBy('name')
            ->get(['id', 'name', 'email']);

        $definitions = AttributeDefinition::active()
            ->forEntity(AttributeEntity::Member)
            ->orderBy('sort_order')
            ->get();

        return Inertia::render('admin/members/form', [
            'member' => null,
            'users' => $availableUsers,
            'customFields' => [
                'definitions' => $definitions,
                'values' => (object) [],
            ],
        ]);
    }

    public function store(MemberRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $attributes = $request->input('attributes', []);

        DB::transaction(function () use ($validated, $attributes) {
            $member = Member::create($validated);
            if (! empty($attributes)) {
                $member->syncCustomAttributes($attributes);
            }
        });

        return redirect()->route('admin.members.index')->with('success', 'Data jemaat berhasil ditambahkan.');
    }

    public function edit(Member $member): Response
    {
        $availableUsers = User::query()
            ->whereDoesntHave('member')
            ->orWhere('id', $member->user_id)
            ->orderBy('name')
            ->get(['id', 'name', 'email']);

        $definitions = AttributeDefinition::active()
            ->forEntity(AttributeEntity::Member)
            ->orderBy('sort_order')
            ->get();

        return Inertia::render('admin/members/form', [
            'member' => $member,
            'users' => $availableUsers,
            'customFields' => [
                'definitions' => $definitions,
                'values' => $member->customAttributes(),
            ],
        ]);
    }

    public function update(MemberRequest $request, Member $member): RedirectResponse
    {
        $validated = $request->validated();
        $attributes = $request->input('attributes', []);

        DB::transaction(function () use ($member, $validated, $attributes) {
            $member->update($validated);
            if ($attributes !== null) {
                $member->syncCustomAttributes($attributes);
            }
        });

        return redirect()->route('admin.members.index')->with('success', 'Data jemaat berhasil diperbarui.');
    }

    public function toggle(Member $member): RedirectResponse
    {
        $member->update(['is_active' => ! $member->is_active]);

        return redirect()->back()->with('success', 'Status jemaat berhasil diubah.');
    }
}
