<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Warta Jemaat - {{ $period_label }}</title>
    <style>
        @page { size: A4 portrait; margin: 1.2cm 1.6cm 1.1cm 1.6cm; }
        body { font-family: 'Times New Roman', Times, serif; font-size: 10pt; color: #111; line-height: 1.3; margin: 0; padding: 0; }
        table { width: 100%; border-collapse: collapse; }
        .letterhead { border-bottom: 3px double #111; padding-bottom: 6px; margin-bottom: 8px; }
        .letterhead td { vertical-align: middle; }
        .logo { max-height: 62px; max-width: 80px; }
        .church-name { font-size: 16pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; text-align: center; }
        .church-meta { font-size: 9.5pt; text-align: center; color: #333; }
        .title { text-align: center; margin: 4px 0 8px; }
        .title .main { font-size: 14pt; font-weight: bold; letter-spacing: 4px; text-transform: uppercase; }
        .title .sub { font-size: 11pt; margin-top: 2px; }
        .title .date { font-size: 10pt; color: #333; margin-top: 2px; }
        .greeting { margin: 0 0 6px; text-align: justify; }
        h2 { font-size: 10.5pt; margin: 8px 0 3px; text-transform: uppercase; letter-spacing: 0.5px; }
        .data th { text-align: left; font-size: 10pt; border-top: 1px solid #111; border-bottom: 1px solid #111; padding: 3px 5px; }
        .data td { padding: 2px 5px; border-bottom: 0.5px solid #999; font-size: 9.5pt; }
        .data .num { text-align: right; white-space: nowrap; }
        .data .total td { font-weight: bold; border-top: 1px solid #111; border-bottom: 2px double #111; }
        .muted { color: #555; font-style: italic; text-align: center; }
        .summary td { padding: 2px 5px; font-size: 10pt; }
        .summary .final td { font-weight: bold; border-top: 1px solid #111; border-bottom: 2px double #111; }
        .verse { margin: 10px 24px 6px; padding: 4px 12px; border-top: 0.5px solid #888; border-bottom: 0.5px solid #888; text-align: center; font-style: italic; font-size: 9.5pt; }
        .thanks { text-align: justify; margin: 4px 0 6px; }
        .sign { margin-top: 8px; }
        .sign td { text-align: center; vertical-align: top; width: 50%; font-size: 10.5pt; }
        .sign .space { height: 40px; }
        .sign .name { font-weight: bold; text-decoration: underline; }
        .place { text-align: right; margin-bottom: 4px; font-size: 10.5pt; }
        .footer { margin-top: 8px; border-top: 0.5px solid #999; padding-top: 3px; font-size: 8pt; color: #666; text-align: center; }
    </style>
</head>
<body>
    <table class="letterhead">
        <tr>
            <td style="width: 90px;">
                @if (!empty($church['logo_base64']))
                    <img class="logo" src="{{ $church['logo_base64'] }}" alt="">
                @endif
            </td>
            <td>
                <div class="church-name">{{ $church['name'] }}</div>
                <div class="church-meta">
                    {{ collect([$church['address'] ?? null, $church['city'] ?? null])->filter()->implode(', ') }}<br>
                    {{ collect([!empty($church['phone']) ? 'Telp. '.$church['phone'] : null, $church['email'] ?? null])->filter()->implode('  |  ') }}
                </div>
            </td>
            <td style="width: 90px;"></td>
        </tr>
    </table>

    <div class="title">
        <div class="main">Warta Jemaat</div>
        <div class="sub">Laporan Persembahan dan Keuangan Mingguan</div>
        <div class="date">{{ $period_label }} &middot; Periode {{ $date_range }}</div>
    </div>

    <p class="greeting">Shalom, Bapak/Ibu/Saudara jemaat yang dikasihi Tuhan. Berikut laporan persembahan dan keuangan gereja pada pekan ini, sebagai bentuk pertanggungjawaban kita bersama.</p>

    <h2>I. Persembahan yang Diterima</h2>
    @php($detailed = count($sessions_breakdown) > 0 && count($sessions_breakdown) <= 8)
    <table class="data">
        @if ($detailed)
            <thead><tr><th>Ibadah</th><th>Jenis Persembahan</th><th class="num" style="text-align:right">Jumlah</th></tr></thead>
        @else
            <thead><tr><th colspan="2">Jenis Persembahan (seluruh ibadah pekan ini)</th><th class="num" style="text-align:right">Jumlah</th></tr></thead>
        @endif
        <tbody>
        @if ($detailed)
            @foreach ($sessions_breakdown as $row)
                <tr><td>{{ $row['session_name'] }}</td><td>{{ $row['category_name'] }}</td><td class="num">Rp {{ number_format($row['amount'], 0, ',', '.') }}</td></tr>
            @endforeach
        @else
            @forelse (collect($incomes)->filter(fn ($row) => $row['total'] > 0) as $row)
                <tr><td colspan="2">{{ $row['category_name'] }}</td><td class="num">Rp {{ number_format($row['total'], 0, ',', '.') }}</td></tr>
            @empty
                <tr><td colspan="3" class="muted">Tidak ada persembahan tercatat pada pekan ini.</td></tr>
            @endforelse
        @endif
        <tr class="total"><td colspan="2">Jumlah penerimaan</td><td class="num">Rp {{ number_format($total_income, 0, ',', '.') }}</td></tr>
        </tbody>
    </table>

    <h2>II. Pengeluaran Kas</h2>
    <table class="data">
        <thead><tr><th>Uraian</th><th class="num" style="text-align:right">Jumlah</th></tr></thead>
        <tbody>
        @forelse (collect($expenses)->filter(fn ($row) => $row['total'] > 0) as $row)
            <tr><td>{{ $row['category_name'] }}</td><td class="num">Rp {{ number_format($row['total'], 0, ',', '.') }}</td></tr>
        @empty
            <tr><td colspan="2" class="muted">Tidak ada pengeluaran kas pada pekan ini.</td></tr>
        @endforelse
        <tr class="total"><td>Jumlah pengeluaran</td><td class="num">Rp {{ number_format($total_expense, 0, ',', '.') }}</td></tr>
        </tbody>
    </table>

    <h2>III. Ringkasan Kas</h2>
    <table class="summary">
        <tr><td>Saldo awal pekan</td><td class="num" style="text-align:right">Rp {{ number_format($opening_balance, 0, ',', '.') }}</td></tr>
        <tr><td>Penerimaan pekan ini</td><td class="num" style="text-align:right">Rp {{ number_format($total_income, 0, ',', '.') }}</td></tr>
        <tr><td>Pengeluaran pekan ini</td><td class="num" style="text-align:right">(Rp {{ number_format($total_expense, 0, ',', '.') }})</td></tr>
        <tr class="final"><td>Saldo kas akhir pekan</td><td class="num" style="text-align:right">Rp {{ number_format($closing_balance, 0, ',', '.') }}</td></tr>
    </table>

    <div class="verse">&ldquo;Hendaklah masing-masing memberikan menurut kerelaan hatinya, jangan dengan sedih hati atau karena paksaan, sebab Allah mengasihi orang yang memberi dengan sukacita.&rdquo; &mdash; 2 Korintus 9:7</div>

    <p class="thanks">Majelis Jemaat dan Bendahara mengucapkan terima kasih atas kesetiaan dan persembahan seluruh jemaat. Tuhan Yesus memberkati.</p>

    @if (!empty($signatories))
        <div class="place">{{ $place_date }}</div>
        <table class="sign">
            <tr>
                @foreach ($signatories as $sig)
                    <td>{{ $sig['position'] }}<div class="space"></div><span class="name">{{ $sig['name'] }}</span></td>
                @endforeach
            </tr>
        </table>
    @endif

    <div class="footer">Warta ini dicetak dari sistem Kas Gereja pada {{ now()->translatedFormat('d F Y, H.i') }}</div>
</body>
</html>
