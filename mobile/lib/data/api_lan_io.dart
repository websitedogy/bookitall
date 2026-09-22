import 'dart:io';

const _apiSuffix = ':4000/api/v1';

bool _isPrivateIpv4(String ip) {
  if (ip.startsWith('127.') || ip.startsWith('169.254.')) return false;
  if (ip.startsWith('192.168.') || ip.startsWith('10.')) return true;
  final parts = ip.split('.');
  if (parts.length != 4) return false;
  final second = int.tryParse(parts[1]) ?? -1;
  return parts[0] == '172' && second >= 16 && second <= 31;
}

Future<List<String>> lanApiBases() async {
  final hosts = <String>{};
  try {
    for (final iface in await NetworkInterface.list(
      includeLoopback: false,
      type: InternetAddressType.IPv4,
    )) {
      for (final addr in iface.addresses) {
        final ip = addr.address;
        if (!_isPrivateIpv4(ip)) continue;
        final parts = ip.split('.');
        if (parts.length != 4) continue;
        final prefix = '${parts[0]}.${parts[1]}.${parts[2]}';
        final self = parts[3];
        for (var i = 1; i <= 254; i++) {
          if ('$i' == self) continue;
          hosts.add('http://$prefix.$i$_apiSuffix');
        }
      }
    }
  } catch (_) {}
  return hosts.toList();
}
