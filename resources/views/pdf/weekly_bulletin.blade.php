<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Warta Keuangan Jemaat Mingguan</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 1cm 1.2cm 1cm 1.2cm;
        }
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 9pt;
            color: #1e293b;
            line-height: 1.35;
            margin: 0;
            padding: 0;
        }
        .header-table {
            width: 100%;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 6px;
            margin-bottom: 8px;
        }
        .logo {
            max-height: 48px;
            max-width: 90px;
        }
        .church-name {
            font-size: 13pt;
            font-weight: bold;
            color: #0f172a;
            text-transform: uppercase;
        }
        .church-meta {
            font-size: 8pt;
            color: #475569;
        }
        .bulletin-title {
            text-align: center;
            font-size: 12pt;
            font-weight: bold;
            color: #0f172a;
            margin-top: 4px;
            margin-bottom: 2px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .bulletin-subtitle {
            text-align: center;
            font-size: 9pt;
            color: #475569;
            margin-bottom: 10px;
        }
        .section-title {
            font-size: 9.5pt;
            font-weight: bold;
            color: #0f172a;
            background-color: #f1f5f9;
            padding: 3px 6px;
            border-left: 3px solid #2563eb;
            margin-top: 10px;
            margin-bottom: 6px;
        }
        table.bulletin-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 8px;
            font-size: 8.5pt;
        }
        table.bulletin-table th {
            background-color: #f8fafc;
            color: #334155;
            font-weight: 600;
            text-align: left;
            padding: 4px 6px;
            border-top: 1px solid #cbd5e1;
            border-bottom: 1px solid #cbd5e1;
        }
        table.bulletin-table td {
            padding: 3.5px 6px;
            border-bottom: 1px solid #f1f5f9;
        }
        table.bulletin-table tr.total-row td {
            font-weight: bold;
            background-color: #f8fafc;
            border-top: 1px solid #cbd5e1;
            border-bottom: 2px solid #64748b;
        }
        .text-right {
            text-align: right;
        }
        .text-center {
            text-align: center;
        }
        .tabular-nums {
            font-variant-numeric: tabular-nums;
        }
        .summary-card {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            padding: 8px 10px;
            margin-top: 8px;
            margin-bottom: 8px;
        }
        .verse-box {
            border: 1px dashed #cbd5e1;
            border-radius: 4px;
            padding: 6px 10px;
            margin-top: 10px;
            font-style: italic;
            font-size: 8pt;
            color: #475569;
            text-align: center;
        }
        .footer-note {
            text-align: center;
            font-size: 7.5pt;
            color: #94a3b8;
            margin-top: 10px;
        }
    </style>
</head>
<body>

    <!-- KOP -->
    <table class="header-table">
        <tr>
            @if(!empty($church['logo_base64']))
                <td style="width: 60px; vertical-align: middle;">
                    <img src="{{ $church['logo_base64'] }}" class="logo" alt="Logo">
                </td>
            @endif
            <td style="vertical-align: middle;">
                <div class="church-name">{{ $church['name'] }}</div>
                <div class="church-meta">
                    {{ $church['address'] }} @if($church['city']), {{ $church['city'] }}@endif
                </div>
            </td>
            <td style="width: 140px; text-align: right; vertical-align: middle; font-size: 8pt; color: #64748b;">
                Warta Jemaat Mingguan<br>
                <strong>{{ $period_label ?? 'Minggu Ini' }}</strong>
            </td>
        </tr>
    </table>

    <div class="bulletin-title">Laporan Keuangan &amp; Persembahan Jemaat</div>
    <div class="bulletin-subtitle">{{ $date_range ?? now()->translatedFormat('d F Y') }}</div>

    <!-- 1. PENERIMAAN PERSEMBAHAN IBADAH -->
    <div class="section-title">1. Penerimaan Persembahan Ibadah Mingguan</div>
    <table class="bulletin-table">
        <thead>
            <tr>
                <th>Ibadah / Sesi</th>
                <th>Kategori Persembahan</th>
                <th class="text-right">Jumlah (Rp)</th>
            </tr>
        </thead>
        <tbody>
            @forelse($sessions_breakdown ?? [] as $item)
                <tr>
                    <td>{{ $item['session_name'] }}</td>
                    <td>{{ $item['category_name'] }}</td>
                    <td class="text-right tabular-nums">{{ number_format($item['amount'], 0, ',', '.') }}</td>
                </tr>
            @empty
                @foreach($incomes ?? [] as $inc)
                    <tr>
                        <td colspan="2">{{ $inc['category_name'] }}</td>
                        <td class="text-right tabular-nums">{{ number_format($inc['total'], 0, ',', '.') }}</td>
                    </tr>
                @endforeach
            @endforelse
            <tr class="total-row">
                <td colspan="2">TOTAL PENERIMAAN MINGGU INI</td>
                <td class="text-right tabular-nums">Rp {{ number_format($total_income ?? 0, 0, ',', '.') }}</td>
            </tr>
        </tbody>
    </table>

    <!-- 2. PENGELUARAN MINGGU INI -->
    <div class="section-title">2. Pengeluaran Kas Minggu Ini</div>
    <table class="bulletin-table">
        <thead>
            <tr>
                <th colspan="2">Uraian / Kategori Pengeluaran</th>
                <th class="text-right">Jumlah (Rp)</th>
            </tr>
        </thead>
        <tbody>
            @forelse($expenses ?? [] as $exp)
                <tr>
                    <td colspan="2">{{ $exp['category_name'] }}</td>
                    <td class="text-right tabular-nums">{{ number_format($exp['total'], 0, ',', '.') }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="3" class="text-center" style="color: #94a3b8;">Tidak ada pengeluaran kas pada minggu ini.</td>
                </tr>
            @endforelse
            <tr class="total-row">
                <td colspan="2">TOTAL PENGELUARAN MINGGU INI</td>
                <td class="text-right tabular-nums">Rp {{ number_format($total_expense ?? 0, 0, ',', '.') }}</td>
            </tr>
        </tbody>
    </table>

    <!-- 3. RINGKASAN SALDO KAS -->
    <div class="section-title">3. Ringkasan Posisi Kas &amp; Dana Gereja</div>
    <div class="summary-card">
        <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt;">
            <tr>
                <td style="width: 30%;">Saldo Kas Awal Minggu:</td>
                <td class="text-right tabular-nums" style="width: 20%;">Rp {{ number_format($opening_balance ?? 0, 0, ',', '.') }}</td>
                <td style="width: 30%;">Total Pemasukan:</td>
                <td class="text-right tabular-nums" style="width: 20%; color: #166534;">+ Rp {{ number_format($total_income ?? 0, 0, ',', '.') }}</td>
            </tr>
            <tr>
                <td><strong>Saldo Kas Akhir Minggu:</strong></td>
                <td class="text-right tabular-nums" style="font-weight: bold; color: #0f172a;">Rp {{ number_format($closing_balance ?? 0, 0, ',', '.') }}</td>
                <td>Total Pengeluaran:</td>
                <td class="text-right tabular-nums" style="color: #991b1b;">- Rp {{ number_format($total_expense ?? 0, 0, ',', '.') }}</td>
            </tr>
        </table>
    </div>

    <!-- AYAT FIRMAN -->
    <div class="verse-box">
        &ldquo;Hendaklah masing-masing memberikan menurut kerelaan hatinya, jangan dengan sedih hati atau karena paksaan, sebab Allah mengasihi orang yang memberi dengan sukacita.&rdquo; &mdash; 2 Korintus 9:7
    </div>

    <div class="footer-note">
        Majelis Jemaat &amp; Bendahara mengucapkan terima kasih atas partisipasi dan persembahan seluruh jemaat bagi pelayanan gereja.
    </div>

</body>
</html>
