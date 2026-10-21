<?php

it('returns validation messages in Indonesian', function () {
    $this->post('/login', ['email' => '', 'password' => ''])
        ->assertSessionHasErrors(['email' => 'Email wajib diisi.']);
});
