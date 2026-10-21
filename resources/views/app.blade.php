<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        @php($brand = \App\Models\ChurchSetting::current()->brand())
        <title inertia>{{ $brand['name'] }}</title>
        @if ($brand['favicon_url'])
            <link rel="icon" href="{{ $brand['favicon_url'] }}">
        @endif
        <script>window.__brand = @json($brand);</script>
        <script>
            (function () {
                try {
                    var a = localStorage.getItem('appearance') || 'system';
                    if (a === 'dark' || (a === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                        document.documentElement.classList.add('dark');
                    }
                } catch (e) {}
            })();
        </script>

        @routes
        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
