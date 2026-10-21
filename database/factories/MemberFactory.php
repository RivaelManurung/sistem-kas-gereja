<?php

namespace Database\Factories;

use App\Models\Member;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Member> */
class MemberFactory extends Factory
{
    protected $model = Member::class;

    public function definition(): array
    {
        return [
            'member_number' => sprintf('JMT-%05d', fake()->unique()->numberBetween(1, 99999)),
            'name' => fake()->name(),
            'gender' => fake()->randomElement(['L', 'P']),
            'membership_status' => 'tetap',
            'is_active' => true,
        ];
    }
}
