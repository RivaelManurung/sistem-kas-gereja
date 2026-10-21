<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>{{ $report['title'] }}</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 1.5cm 1.5cm 2cm 1.5cm;
        }
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 10pt;
            color: #1e293b;
            line-height: 1.4;
            margin: 0;
            padding: 0;
        }
        .header-table {
            width: 100%;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 10px;
            margin-bottom: 15px;
        }
        .logo {
            max-height: 60px;
            max-width: 120px;
        }
        .church-name {
            font-size: 14pt;
            font-weight: bold;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .church-meta {
            font-size: 8.5pt;
            color: #475569;
        }
        .doc-title {
            text-align: center;
            font-size: 13pt;
            font-weight: bold;
            margin-top: 5px;
            margin-bottom: 3px;
            text-transform: uppercase;
        }
        .doc-period {
            text-align: center;
            font-size: 9.5pt;
            color: #475569;
            margin-bottom: 15px;
        }
        .section-title {
            font-size: 10.5pt;
            font-weight: bold;
            color: #0f172a;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 3px;
            margin-top: 15px;
            margin-bottom: 8px;
            text-transform: uppercase;
        }
        table.data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
            font-size: 9pt;
        }
        table.data-table th {
            background-color: #f1f5f9;
            color: #334155;
            font-weight: 600;
            text-align: left;
            padding: 6px 8px;
            border-top: 1px solid #cbd5e1;
            border-bottom: 1px solid #cbd5e1;
        }
        table.data-table td {
            padding: 5px 8px;
            border-bottom: 1px solid #f1f5f9;
        }
        table.data-table tr.total-row td {
            font-weight: bold;
            background-color: #f8fafc;
            border-top: 1px solid #cbd5e1;
            border-bottom: 2px solid #94a3b8;
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
        .summary-box {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            padding: 10px 12px;
            margin-top: 15px;
            margin-bottom: 20px;
        }
        .summary-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9.5pt;
        }
        .summary-table td {
            padding: 4px 6px;
        }
        .signatures-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 25px;
            page-break-inside: avoid;
        }
        .signature-box {
            text-align: center;
            vertical-align: top;
            padding: 0 10px;
        }
        .sig-title {
            font-size: 8.5pt;
            color: #64748b;
            margin-bottom: 2px;
        }
        .sig-position {
            font-size: 9pt;
            font-weight: bold;
            color: #1e293b;
            margin-bottom: 8px;
        }
        .sig-image-container {
            height: 60px;
            display: block;
            margin: 0 auto;
        }
        .sig-image {
            max-height: 55px;
            max-width: 120px;
        }
        .stamp-image {
            max-height: 65px;
            max-width: 100px;
            opacity: 0.85;
            position: absolute;
            margin-left: -40px;
            margin-top: -10px;
        }
        .sig-name {
            font-size: 9pt;
            font-weight: bold;
            border-top: 1px solid #94a3b8;
            padding-top: 4px;
            display: inline-block;
            min-width: 140px;
        }
        .sig-date {
            font-size: 7.5pt;
            color: #64748b;
        }
        .footer {
            position: fixed;
            bottom: -1cm;
            left: 0;
            right: 0;
            height: 1cm;
            border-top: 1px solid #e2e8f0;
            padding-top: 4px;
            font-size: 7.5pt;
            color: #64748b;
            display: flex;
            justify-content: space-between;
        }
        .badge-frozen {
            background-color: #dcfce7;
            color: #166534;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 7.5pt;
            font-weight: bold;
            display: inline-block;
        }
        .badge-draft {
            background-color: #fef3c7;
            color: #92400e;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 7.5pt;
            font-weight: bold;
            display: inline-block;
        }
    </style>
</head>
<body>

    <!-- KOP SURAT (LETTERHEAD) -->
    <table class="header-table">
        <tr>
            @if(!empty($church['logo_base64']))
                <td style="width: 80px; vertical-align: middle;">
                    <img src="{{ $church['logo_base64'] }}" class="logo" alt="Logo">
                </td>
            @endif
            <td style="vertical-align: middle;">
                <div class="church-name">{{ $church['name'] }}</div>
                <div class="church-meta">
                    @if($church['address']){{ $church['address'] }}@endif
                    @if($church['city']), {{ $church['city'] }}@endif
                    @if($church['phone']) &bull; Telp: {{ $church['phone'] }}@endif
                    @if($church['email']) &bull; Email: {{ $church['email'] }}@endif
                </div>
            </td>
            <td style="width: 140px; text-align: right; vertical-align: top;">
                @if($is_frozen)
                    <span class="badge-frozen">DIBEKUKAN &amp; SAH</span>
                @else
                    <span class="badge-draft">DRAFT LAPORAN</span>
                @endif
                <div style="font-size: 7pt; color: #94a3b8; margin-top: 4px;">
                    Kode: {{ $report['verification_code'] }}
                </div>
            </td>
        </tr>
    </table>

    <div class="doc-title">{{ $report['title'] }}</div>
    <div class="doc-period">Periode: {{ $report['start_date'] }} s/d {{ $report['end_date'] }}</div>

    <!-- 1. RINGKASAN EKSEKUTIF -->
    <div class="summary-box">
        <table class="summary-table">
            <tr>
                <td style="width: 25%;"><strong>Saldo Awal:</strong></td>
                <td class="text-right tabular-nums" style="width: 25%;">Rp {{ number_format($data['summary']['total_opening'], 0, ',', '.') }}</td>
                <td style="width: 25%;"><strong>Total Pemasukan:</strong></td>
                <td class="text-right tabular-nums" style="width: 25%; color: #166534;">+ Rp {{ number_format($data['summary']['total_income'], 0, ',', '.') }}</td>
            </tr>
            <tr>
                <td><strong>Saldo Akhir:</strong></td>
                <td class="text-right tabular-nums" style="font-weight: bold; color: #0f172a;">Rp {{ number_format($data['summary']['total_closing'], 0, ',', '.') }}</td>
                <td><strong>Total Pengeluaran:</strong></td>
                <td class="text-right tabular-nums" style="color: #991b1b;">- Rp {{ number_format($data['summary']['total_expense'], 0, ',', '.') }}</td>
            </tr>
        </table>
    </div>

    <!-- 2. PEMASUKAN PER KATEGORI -->
    <div class="section-title">Penerimaan &amp; Pemasukan Kas</div>
    <table class="data-table">
        <thead>
            <tr>
                <th>No</th>
                <th>Kategori Pemasukan</th>
                <th class="text-right">Jumlah (Rupiah)</th>
            </tr>
        </thead>
        <tbody>
            @forelse($data['incomes']['by_category'] as $idx => $inc)
                <tr>
                    <td style="width: 40px;">{{ $idx + 1 }}</td>
                    <td>{{ $inc['category_name'] }}</td>
                    <td class="text-right tabular-nums">Rp {{ number_format($inc['total'], 0, ',', '.') }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="3" class="text-center" style="color: #94a3b8;">Tidak ada data penerimaan pada periode ini.</td>
                </tr>
            @endforelse
            <tr class="total-row">
                <td colspan="2">TOTAL PENERIMAAN</td>
                <td class="text-right tabular-nums">Rp {{ number_format($data['incomes']['total'], 0, ',', '.') }}</td>
            </tr>
        </tbody>
    </table>

    <!-- 3. PENGELUARAN PER KATEGORI -->
    <div class="section-title">Pengeluaran &amp; Biaya Operasional</div>
    <table class="data-table">
        <thead>
            <tr>
                <th>No</th>
                <th>Kategori Pengeluaran</th>
                <th class="text-right">Jumlah (Rupiah)</th>
            </tr>
        </thead>
        <tbody>
            @forelse($data['expenses']['by_category'] as $idx => $exp)
                <tr>
                    <td style="width: 40px;">{{ $idx + 1 }}</td>
                    <td>{{ $exp['category_name'] }}</td>
                    <td class="text-right tabular-nums">Rp {{ number_format($exp['total'], 0, ',', '.') }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="3" class="text-center" style="color: #94a3b8;">Tidak ada data pengeluaran pada periode ini.</td>
                </tr>
            @endforelse
            <tr class="total-row">
                <td colspan="2">TOTAL PENGELUARAN</td>
                <td class="text-right tabular-nums">Rp {{ number_format($data['expenses']['total'], 0, ',', '.') }}</td>
            </tr>
        </tbody>
    </table>

    <!-- 4. MUTASI & SALDO AKHIR PER POS DANA -->
    <div class="section-title">Saldo &amp; Mutasi Pos Dana</div>
    <table class="data-table">
        <thead>
            <tr>
                <th>Kode</th>
                <th>Nama Pos Dana</th>
                <th class="text-right">Saldo Awal</th>
                <th class="text-right">Pemasukan</th>
                <th class="text-right">Pengeluaran</th>
                <th class="text-right">Pindah Dana</th>
                <th class="text-right">Saldo Akhir</th>
            </tr>
        </thead>
        <tbody>
            @foreach($data['closing_balances']['by_fund'] as $fb)
                <tr>
                    <td>{{ $fb['fund_code'] }}</td>
                    <td>{{ $fb['fund_name'] }}</td>
                    <td class="text-right tabular-nums">{{ number_format($fb['opening_balance'], 0, ',', '.') }}</td>
                    <td class="text-right tabular-nums">{{ number_format($fb['income'], 0, ',', '.') }}</td>
                    <td class="text-right tabular-nums">{{ number_format($fb['expense'], 0, ',', '.') }}</td>
                    <td class="text-right tabular-nums">{{ number_format($fb['net_transfer'], 0, ',', '.') }}</td>
                    <td class="text-right tabular-nums" style="font-weight: bold;">{{ number_format($fb['closing_balance'], 0, ',', '.') }}</td>
                </tr>
            @endforeach
            <tr class="total-row">
                <td colspan="2">TOTAL KAS GEREJA</td>
                <td class="text-right tabular-nums">{{ number_format($data['opening_balances']['total'], 0, ',', '.') }}</td>
                <td class="text-right tabular-nums">{{ number_format($data['incomes']['total'], 0, ',', '.') }}</td>
                <td class="text-right tabular-nums">{{ number_format($data['expenses']['total'], 0, ',', '.') }}</td>
                <td class="text-right tabular-nums">0</td>
                <td class="text-right tabular-nums">{{ number_format($data['closing_balances']['total'], 0, ',', '.') }}</td>
            </tr>
        </tbody>
    </table>

    <!-- 5. SALDO AKHIR PER REKENING KAS / BANK -->
    <div class="section-title">Posisi Saldo Kas &amp; Bank</div>
    <table class="data-table">
        <thead>
            <tr>
                <th>Kode</th>
                <th>Nama Rekening / Akun</th>
                <th>Jenis</th>
                <th class="text-right">Saldo Awal</th>
                <th class="text-right">Penerimaan</th>
                <th class="text-right">Pengeluaran</th>
                <th class="text-right">Saldo Akhir</th>
            </tr>
        </thead>
        <tbody>
            @foreach($data['closing_balances']['by_account'] as $ab)
                <tr>
                    <td>{{ $ab['account_code'] }}</td>
                    <td>{{ $ab['account_name'] }}</td>
                    <td>{{ ucfirst($ab['account_type']) }}</td>
                    <td class="text-right tabular-nums">{{ number_format($ab['opening_balance'], 0, ',', '.') }}</td>
                    <td class="text-right tabular-nums">{{ number_format($ab['in_amount'], 0, ',', '.') }}</td>
                    <td class="text-right tabular-nums">{{ number_format($ab['out_amount'], 0, ',', '.') }}</td>
                    <td class="text-right tabular-nums" style="font-weight: bold;">{{ number_format($ab['closing_balance'], 0, ',', '.') }}</td>
                </tr>
            @endforeach
            <tr class="total-row">
                <td colspan="3">TOTAL REKENING</td>
                <td class="text-right tabular-nums">{{ number_format($data['opening_balances']['total'], 0, ',', '.') }}</td>
                <td class="text-right tabular-nums">{{ number_format(collect($data['closing_balances']['by_account'])->sum('in_amount'), 0, ',', '.') }}</td>
                <td class="text-right tabular-nums">{{ number_format(collect($data['closing_balances']['by_account'])->sum('out_amount'), 0, ',', '.') }}</td>
                <td class="text-right tabular-nums">{{ number_format($data['closing_balances']['total'], 0, ',', '.') }}</td>
            </tr>
        </tbody>
    </table>

    <!-- TANDA TANGAN & PENGESAHAN -->
    @if(count($approvals) > 0)
        <table class="signatures-table">
            <tr>
                @foreach($approvals as $idx => $sig)
                    <td class="signature-box" style="width: {{ round(100 / count($approvals)) }}%;">
                        <div class="sig-title">{{ $sig['title'] }}</div>
                        <div class="sig-position">{{ $sig['position'] }}</div>

                        <div class="sig-image-container">
                            @if(!empty($sig['signature_base64']))
                                <img src="{{ $sig['signature_base64'] }}" class="sig-image" alt="TTD">
                            @else
                                <div style="height: 50px; line-height: 50px; color: #cbd5e1; font-style: italic; font-size: 8pt;">
                                    (Menunggu Persetujuan)
                                </div>
                            @endif

                            @if($loop->last && $stamp_applied && !empty($church['stamp_base64']))
                                <img src="{{ $church['stamp_base64'] }}" class="stamp-image" alt="Stempel">
                            @endif
                        </div>

                        <div class="sig-name">{{ $sig['signer_name'] }}</div>
                        @if($sig['approved_at'])
                            <div class="sig-date">{{ $sig['approved_at'] }}</div>
                        @endif
                    </td>
                @endforeach
            </tr>
        </table>
    @endif

    <!-- FOOTER VERIFIKASI -->
    <div class="footer">
        <div>
            Verifikasi Keaslian Dokumen: <strong>{{ $verification_url }}</strong>
            @if($report['sha256_hash'])
                <br>SHA256: <span style="font-family: monospace;">{{ substr($report['sha256_hash'], 0, 16) }}...{{ substr($report['sha256_hash'], -16) }}</span>
            @endif
        </div>
        <div style="text-align: right;">
            Dicetak: {{ now()->translatedFormat('d F Y H:i:s') }}
        </div>
    </div>

</body>
</html>
