import 'package:flutter_test/flutter_test.dart';
import 'package:bookitall_mobile/main.dart';

void main() {
  testWidgets('shows Book It All home', (tester) async {
    await tester.pumpWidget(const BookItAllApp());
    expect(find.text('Book It All'), findsWidgets);
    expect(find.text('All services'), findsOneWidget);
  });
}
