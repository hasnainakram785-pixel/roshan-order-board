<?php

/*
| Lets the board (served from Netlify, a different domain) call /api/*.
| Set CORS_ALLOWED_ORIGINS in .env to your Netlify address, for example:
|   CORS_ALLOWED_ORIGINS=https://roshan-order-board.netlify.app
| Several origins can be separated with commas. The default "*" allows any site,
| which is fine for local testing but should be narrowed in production.
*/

return [
    'paths' => ['api/*'],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_values(array_filter(array_map('trim', explode(',', env('CORS_ALLOWED_ORIGINS', '*'))))),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,
];
