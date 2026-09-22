import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../data/api.dart';
import '../../data/booking.dart';
import '../../theme/app_colors.dart';
import 'checkout_success_page.dart';

const _methods = [
  ('UPI', 'UPI', 'GPay, PhonePe, Paytm', Icons.smartphone_outlined),
  ('CARD', 'Card', 'Visa, Mastercard, RuPay', Icons.credit_card),
  ('NET_BANKING', 'Net banking', 'All major banks', Icons.account_balance_outlined),
  ('WALLET', 'Wallet', 'Book It All wallet', Icons.account_balance_wallet_outlined),
  ('CASH', 'Pay after service', 'Cash / UPI to vendor after work', Icons.payments_outlined),
];

const _banks = [
  ('HDFC', 'HDFC Bank'),
  ('SBI', 'State Bank of India'),
  ('ICICI', 'ICICI Bank'),
  ('AXIS', 'Axis Bank'),
  ('KOTAK', 'Kotak Mahindra'),
  ('PNB', 'Punjab National Bank'),
  ('BOB', 'Bank of Baroda'),
  ('UNION', 'Union Bank'),
];

class CheckoutPage extends StatefulWidget {
  const CheckoutPage({super.key, required this.draft});

  final BookingDraft draft;

  @override
  State<CheckoutPage> createState() => _CheckoutPageState();
}

class _CheckoutPageState extends State<CheckoutPage> {
  late final TextEditingController _address;
  final _upi = TextEditingController();
  final _cardNumber = TextEditingController();
  final _cardHolder = TextEditingController();
  final _cardExpiry = TextEditingController();
  final _cardCvv = TextEditingController();
  String _method = 'UPI';
  String _bank = 'HDFC';
  BookingQuote? _quote;
  double _wallet = 0;
  bool _busy = false;
  bool _topupBusy = false;
  bool _editAddress = false;
  String _error = '';

  @override
  void initState() {
    super.initState();
    _address = TextEditingController(
      text: widget.draft.address ?? widget.draft.pickupAddress ?? '',
    );
    _loadQuote();
    _loadWallet();
  }

  @override
  void dispose() {
    _address.dispose();
    _upi.dispose();
    _cardNumber.dispose();
    _cardHolder.dispose();
    _cardExpiry.dispose();
    _cardCvv.dispose();
    super.dispose();
  }

  Future<void> _loadQuote() async {
    try {
      final quote = await quoteBooking(widget.draft);
      if (mounted) setState(() => _quote = quote);
    } catch (_) {}
  }

  Future<void> _loadWallet() async {
    try {
      final balance = await fetchWalletBalance();
      if (mounted) setState(() => _wallet = balance);
    } catch (_) {}
  }

  double get _total => _quote?.total ?? widget.draft.unitPrice;
  double get _subtotal => _quote?.subtotal ?? widget.draft.unitPrice;
  double get _tax => _quote?.tax ?? 0;

  String? _validatePay() {
    if (_method == 'UPI' && !RegExp(r'^[a-z0-9._-]{2,256}@[a-z]{2,64}$', caseSensitive: false).hasMatch(_upi.text.trim())) {
      return 'Enter a valid UPI ID, like name@oksbi';
    }
    if (_method == 'CARD') {
      final number = _cardNumber.text.replaceAll(RegExp(r'\s'), '');
      if (_cardHolder.text.trim().isEmpty) return 'Enter the name on the card';
      if (!RegExp(r'^\d{13,19}$').hasMatch(number)) return 'Enter a valid card number';
      if (!RegExp(r'^(0[1-9]|1[0-2])\s*/\s*\d{2}$').hasMatch(_cardExpiry.text.trim())) return 'Expiry must be MM/YY';
      if (!RegExp(r'^\d{3,4}$').hasMatch(_cardCvv.text.trim())) return 'Enter the CVV';
    }
    if (_method == 'WALLET' && _wallet + 0.001 < _total) {
      return 'Wallet balance is too low. Add money first.';
    }
    return null;
  }

  Future<void> _topup(int amount) async {
    setState(() {
      _topupBusy = true;
      _error = '';
    });
    try {
      final balance = await topUpWallet(amount);
      if (mounted) setState(() => _wallet = balance);
    } catch (error) {
      if (mounted) setState(() => _error = error.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _topupBusy = false);
    }
  }

  Future<void> _submit() async {
    if (_busy) return;
    if (widget.draft.needsAddress && _address.text.trim().isEmpty) {
      setState(() => _error = 'Add a service address so the vendor can reach you.');
      return;
    }
    final invalid = _validatePay();
    if (invalid != null) {
      setState(() => _error = invalid);
      return;
    }
    setState(() {
      _busy = true;
      _error = '';
    });
    try {
      final result = await checkoutBooking(
        draft: widget.draft,
        method: _method,
        address: _address.text.trim(),
        upiId: _method == 'UPI' ? _upi.text.trim() : null,
        cardNumber: _method == 'CARD' ? _cardNumber.text.replaceAll(RegExp(r'\s'), '') : null,
        cardHolder: _method == 'CARD' ? _cardHolder.text.trim() : null,
        cardExpiry: _method == 'CARD' ? _cardExpiry.text.trim() : null,
        bankCode: _method == 'NET_BANKING' ? _bank : null,
      );
      BookingsRefresh.bump();
      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute<void>(builder: (_) => CheckoutSuccessPage(result: result)),
      );
    } catch (error) {
      if (mounted) {
        setState(() => _error = error.toString().replaceFirst('Exception: ', ''));
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final payLabel = _method == 'CASH'
        ? 'Place booking'
        : _busy
            ? 'Paying…'
            : 'Pay ${inr(_total)}';
    return Scaffold(
      backgroundColor: AppColors.cream,
      appBar: AppBar(title: const Text('Checkout')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
        children: [
          const Text('Confirm details, choose payment, and place the booking.', style: TextStyle(color: AppColors.textMuted)),
          const SizedBox(height: 16),
          _card(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Contact', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                const SizedBox(height: 8),
                Text(SessionStore.fullName ?? '—'),
                Text(SessionStore.phone ?? '', style: const TextStyle(color: AppColors.textMuted)),
              ],
            ),
          ),
          if (widget.draft.needsAddress) ...[
            const SizedBox(height: 12),
            _card(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Expanded(child: Text('Service address', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16))),
                      if (_address.text.trim().isNotEmpty && !_editAddress)
                        TextButton(
                          onPressed: () => setState(() => _editAddress = true),
                          child: const Text('Change'),
                        ),
                    ],
                  ),
                  if (_address.text.trim().isNotEmpty && !_editAddress)
                    Text(_address.text, style: const TextStyle(height: 1.4))
                  else
                    TextField(
                      controller: _address,
                      minLines: 2,
                      maxLines: 4,
                      decoration: const InputDecoration(hintText: 'House no, building name, street, landmark, city'),
                    ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 12),
          _card(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Payment', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                const SizedBox(height: 8),
                for (final option in _methods)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Material(
                      color: _method == option.$1 ? AppColors.primarySoft : Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                        side: BorderSide(color: _method == option.$1 ? AppColors.primary : AppColors.border),
                      ),
                      child: ListTile(
                        onTap: () => setState(() {
                          _method = option.$1;
                          _error = '';
                        }),
                        leading: Icon(option.$4, color: AppColors.primary),
                        title: Text(option.$2, style: const TextStyle(fontWeight: FontWeight.w600)),
                        subtitle: Text(option.$3),
                      ),
                    ),
                  ),
                if (_method == 'UPI')
                  TextField(controller: _upi, decoration: const InputDecoration(labelText: 'UPI ID', hintText: 'name@oksbi'))
                else if (_method == 'CARD') ...[
                  TextField(
                    controller: _cardNumber,
                    keyboardType: TextInputType.number,
                    inputFormatters: [FilteringTextInputFormatter.digitsOnly, _CardNumberFormatter()],
                    decoration: const InputDecoration(labelText: 'Card number', hintText: '4111 1111 1111 1111'),
                  ),
                  const SizedBox(height: 8),
                  TextField(controller: _cardHolder, decoration: const InputDecoration(labelText: 'Name on card')),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _cardExpiry,
                          keyboardType: TextInputType.number,
                          inputFormatters: [_ExpiryFormatter()],
                          decoration: const InputDecoration(labelText: 'Expiry', hintText: 'MM/YY'),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: TextField(
                          controller: _cardCvv,
                          obscureText: true,
                          keyboardType: TextInputType.number,
                          inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(4)],
                          decoration: const InputDecoration(labelText: 'CVV'),
                        ),
                      ),
                    ],
                  ),
                ] else if (_method == 'NET_BANKING')
                  DropdownMenu<String>(
                    initialSelection: _bank,
                    onSelected: (value) => setState(() => _bank = value ?? 'HDFC'),
                    dropdownMenuEntries: [
                      for (final bank in _banks) DropdownMenuEntry(value: bank.$1, label: bank.$2),
                    ],
                  )
                else if (_method == 'CASH')
                  const Padding(
                    padding: EdgeInsets.only(top: 4),
                    child: Text(
                      'Booking is confirmed now. Pay cash or UPI to the vendor after the service.',
                      style: TextStyle(color: AppColors.textMuted, height: 1.4),
                    ),
                  )
                else if (_method == 'WALLET') ...[
                  const SizedBox(height: 4),
                  Text('Balance ${inr(_wallet)}', style: const TextStyle(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    children: [
                      for (final amount in [500, 1000, 2000, 5000])
                        OutlinedButton(
                          onPressed: _topupBusy ? null : () => _topup(amount),
                          child: Text('Add ${inr(amount)}'),
                        ),
                    ],
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 12),
          _card(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Order', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(child: Text('${widget.draft.title} × ${widget.draft.quantity}')),
                    Text(inr(widget.draft.unitPrice), style: const TextStyle(fontWeight: FontWeight.w600)),
                  ],
                ),
                const Divider(height: 24),
                _line('Subtotal', inr(_subtotal)),
                _line('Tax', inr(_tax)),
                _line(_method == 'CASH' ? 'To pay later' : 'To pay', inr(_total), bold: true),
                if (_error.isNotEmpty) ...[
                  const SizedBox(height: 10),
                  Text(_error, style: const TextStyle(color: Color(0xFFB91C1C))),
                ],
                const SizedBox(height: 16),
                FilledButton(
                  onPressed: _busy ? null : _submit,
                  style: FilledButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    minimumSize: const Size.fromHeight(48),
                    shape: const StadiumBorder(),
                  ),
                  child: Text(_busy && _method != 'CASH' ? 'Paying…' : payLabel),
                ),
                const SizedBox(height: 8),
                Text(
                  _method == 'CASH'
                      ? 'No money is collected now.'
                      : _method == 'WALLET'
                          ? 'Amount is deducted from your Book It All wallet.'
                          : 'Card and UPI details are checked here. Full card number is not stored.',
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _card({required Widget child}) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: AppColors.studioLine),
      ),
      child: child,
    );
  }

  Widget _line(String label, String value, {bool bold = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        children: [
          Expanded(child: Text(label, style: TextStyle(color: bold ? AppColors.text : AppColors.textMuted, fontWeight: bold ? FontWeight.w700 : FontWeight.w400))),
          Text(value, style: TextStyle(fontWeight: bold ? FontWeight.w700 : FontWeight.w500)),
        ],
      ),
    );
  }
}

class _CardNumberFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(TextEditingValue oldValue, TextEditingValue newValue) {
    final digits = newValue.text.replaceAll(RegExp(r'\D'), '');
    final clipped = digits.length > 16 ? digits.substring(0, 16) : digits;
    final buf = StringBuffer();
    for (var i = 0; i < clipped.length; i++) {
      if (i > 0 && i % 4 == 0) buf.write(' ');
      buf.write(clipped[i]);
    }
    final text = buf.toString();
    return TextEditingValue(text: text, selection: TextSelection.collapsed(offset: text.length));
  }
}

class _ExpiryFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(TextEditingValue oldValue, TextEditingValue newValue) {
    final digits = newValue.text.replaceAll(RegExp(r'\D'), '');
    final clipped = digits.substring(0, digits.length.clamp(0, 4));
    final text = clipped.length <= 2 ? clipped : '${clipped.substring(0, 2)}/${clipped.substring(2)}';
    return TextEditingValue(text: text, selection: TextSelection.collapsed(offset: text.length));
  }
}
