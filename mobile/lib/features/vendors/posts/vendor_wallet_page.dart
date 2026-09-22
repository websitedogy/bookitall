import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../data/api.dart';
import '../../../data/booking.dart';
import '../../../theme/app_colors.dart';

const _presets = [500, 1000, 2000, 5000];

const _reasonLabels = {
  'TOPUP': 'Wallet top-up',
  'BOOKING_EARNING': 'Booking earning',
  'COMMISSION': 'Commission',
  'PAYOUT': 'Payout',
  'REFUND': 'Refund',
  'ADJUSTMENT': 'Adjustment',
};

String _reasonLabel(String reason) {
  return _reasonLabels[reason] ?? reason.replaceAll('_', ' ').toLowerCase();
}

class VendorWalletPage extends StatefulWidget {
  const VendorWalletPage({super.key});

  @override
  State<VendorWalletPage> createState() => _VendorWalletPageState();
}

class _VendorWalletPageState extends State<VendorWalletPage> {
  final _amount = TextEditingController();
  WalletInfo? _wallet;
  bool _loading = true;
  bool _busy = false;
  String _error = '';
  String _saved = '';

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _amount.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = '';
    });
    try {
      final wallet = await fetchWallet();
      if (!mounted) return;
      setState(() {
        _wallet = wallet;
        _loading = false;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _error = error.toString().replaceFirst('Exception: ', '');
        _loading = false;
      });
    }
  }

  Future<void> _add() async {
    final value = int.tryParse(_amount.text.trim()) ?? 0;
    if (value < 100 || value > 20000) {
      setState(() {
        _error = 'Add between ₹100 and ₹20,000';
        _saved = '';
      });
      return;
    }
    setState(() {
      _busy = true;
      _error = '';
      _saved = '';
    });
    try {
      final next = await topUpWallet(value);
      if (!mounted) return;
      setState(() {
        _wallet = WalletInfo(available: next, pending: _wallet?.pending ?? 0);
        _amount.clear();
        _saved = 'Added ${inr(value)} to your wallet.';
        _busy = false;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _error = error.toString().replaceFirst('Exception: ', '');
        _busy = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final available = _wallet?.available ?? 0;
    final pending = _wallet?.pending ?? 0;
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
      children: [
        const Text(
          'WALLET',
          style: TextStyle(
            color: AppColors.primary,
            fontSize: 11,
            fontWeight: FontWeight.w700,
            letterSpacing: 1.6,
          ),
        ),
        const SizedBox(height: 12),
        Material(
          color: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(24),
            side: const BorderSide(color: AppColors.studioLine),
          ),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(18, 16, 18, 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'CURRENT WALLET AMOUNT',
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 1.2, color: AppColors.textMuted),
                ),
                const SizedBox(height: 8),
                Text(
                  _loading ? '…' : inr(available),
                  style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w700, color: AppColors.text),
                ),
                const SizedBox(height: 4),
                Text(
                  pending > 0 ? '${inr(pending)} pending from bookings' : 'Available to spend on bookings',
                  style: const TextStyle(color: AppColors.textMuted),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        Material(
          color: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(24),
            side: const BorderSide(color: AppColors.studioLine),
          ),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(18, 16, 18, 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'ADD TO WALLET AMOUNT',
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 1.2, color: AppColors.textMuted),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: _amount,
                  keyboardType: TextInputType.number,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(5)],
                  decoration: const InputDecoration(
                    hintText: 'Enter ₹100 – ₹20,000',
                    border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(16))),
                  ),
                  onChanged: (_) => setState(() {
                    _error = '';
                    _saved = '';
                  }),
                ),
                const SizedBox(height: 10),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    for (final preset in _presets)
                      ChoiceChip(
                        label: Text(inr(preset)),
                        selected: _amount.text == '$preset',
                        onSelected: (_) {
                          setState(() {
                            _amount.text = '$preset';
                            _error = '';
                            _saved = '';
                          });
                        },
                      ),
                  ],
                ),
                if (_error.isNotEmpty) ...[
                  const SizedBox(height: 10),
                  Text(_error, style: const TextStyle(color: Color(0xFFB91C1C))),
                ],
                if (_saved.isNotEmpty) ...[
                  const SizedBox(height: 10),
                  Text(_saved, style: const TextStyle(color: Color(0xFF15803D))),
                ],
                const SizedBox(height: 14),
                FilledButton(
                  onPressed: _busy || _amount.text.isEmpty ? null : _add,
                  style: FilledButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    minimumSize: const Size.fromHeight(48),
                    shape: const StadiumBorder(),
                  ),
                  child: Text(_busy ? 'Adding…' : 'Add to wallet'),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class VendorWalletHistoryPage extends StatefulWidget {
  const VendorWalletHistoryPage({super.key});

  @override
  State<VendorWalletHistoryPage> createState() => _VendorWalletHistoryPageState();
}

class _VendorWalletHistoryPageState extends State<VendorWalletHistoryPage> {
  List<WalletTx> _rows = [];
  bool _loading = true;
  String _error = '';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = '';
    });
    try {
      final rows = await fetchWalletTransactions();
      if (!mounted) return;
      setState(() {
        _rows = rows;
        _loading = false;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _error = error.toString().replaceFirst('Exception: ', '');
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
        children: [
          const Text(
            'WALLET HISTORY',
            style: TextStyle(
              color: AppColors.primary,
              fontSize: 11,
              fontWeight: FontWeight.w700,
              letterSpacing: 1.6,
            ),
          ),
          const SizedBox(height: 12),
          if (_loading)
            const Padding(
              padding: EdgeInsets.only(top: 32),
              child: Center(child: CircularProgressIndicator()),
            )
          else if (_error.isNotEmpty)
            Text(_error, style: const TextStyle(color: Color(0xFFB91C1C)))
          else if (_rows.isEmpty)
            const Text('No wallet history yet. Add money from the Wallet tab.', style: TextStyle(color: AppColors.textMuted))
          else
            for (final row in _rows)
              Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Material(
                  color: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(18),
                    side: const BorderSide(color: AppColors.studioLine),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(_reasonLabel(row.reason), style: const TextStyle(fontWeight: FontWeight.w600)),
                              if ((row.note ?? '').isNotEmpty || (row.createdAt ?? '').isNotEmpty) ...[
                                const SizedBox(height: 2),
                                Text(
                                  [
                                    if ((row.note ?? '').isNotEmpty) row.note,
                                    if ((row.createdAt ?? '').isNotEmpty) _when(row.createdAt!),
                                  ].join(' · '),
                                  style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
                                ),
                              ],
                              const SizedBox(height: 2),
                              Text('Balance ${inr(row.balanceAfter)}', style: const TextStyle(fontSize: 12, color: AppColors.textMuted)),
                            ],
                          ),
                        ),
                        Text(
                          '${row.type == 'CREDIT' ? '+' : '−'}${inr(row.amount)}',
                          style: TextStyle(
                            fontWeight: FontWeight.w700,
                            color: row.type == 'CREDIT' ? const Color(0xFF15803D) : const Color(0xFFB91C1C),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
        ],
      ),
    );
  }

  String _when(String raw) {
    final date = DateTime.tryParse(raw)?.toLocal();
    if (date == null) return raw;
    return '${date.day}/${date.month}/${date.year} ${pad2(date.hour)}:${pad2(date.minute)}';
  }
}
