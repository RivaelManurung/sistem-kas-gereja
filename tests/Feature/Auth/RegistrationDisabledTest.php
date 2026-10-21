<?php

it('does not expose registration', function () {
    $this->get('/register')->assertNotFound();
    $this->post('/register', [
        'name' => 'x',
        'email' => 'x@x.id',
        'password' => 'password',
        'password_confirmation' => 'password',
    ])->assertNotFound();
});
