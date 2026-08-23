"""
SSRF Defense Engine & IP Blocklist Validator
============================================
Senior Design Note:
Blocks Server-Side Request Forgery (SSRF) by:
1. Enforcing HTTPS or HTTP scheme.
2. Resolving domain to IPv4/IPv6 address.
3. Rejecting loopback, private RFC 1918, link-local metadata (169.254.169.254), and carrier-grade NAT.
"""

import ipaddress
import socket
from typing import Tuple
from urllib.parse import urlparse

BLOCKED_NETWORKS = [
    ipaddress.ip_network("0.0.0.0/8"),
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("100.64.0.0/10"),       # Shared Address Space
    ipaddress.ip_network("127.0.0.0/8"),        # Loopback
    ipaddress.ip_network("169.254.0.0/16"),     # Link-local / Cloud Metadata (AWS/GCP/Azure)
    ipaddress.ip_network("172.16.0.0/12"),      # Private class B
    ipaddress.ip_network("192.0.0.0/24"),       # IETF Protocol Assignments
    ipaddress.ip_network("192.0.2.0/24"),       # TEST-NET-1
    ipaddress.ip_network("192.168.0.0/16"),     # Private class C
    ipaddress.ip_network("198.18.0.0/15"),      # Network benchmark tests
    ipaddress.ip_network("198.51.100.0/24"),    # TEST-NET-2
    ipaddress.ip_network("203.0.113.0/24"),     # TEST-NET-3
    ipaddress.ip_network("224.0.0.0/4"),        # Multicast
    ipaddress.ip_network("240.0.0.0/4"),        # Reserved
    ipaddress.ip_network("255.255.255.255/32"), # Broadcast
    ipaddress.ip_network("::1/128"),            # IPv6 Loopback
    ipaddress.ip_network("fc00::/7"),           # IPv6 Unique Local Address
    ipaddress.ip_network("fe80::/10"),          # IPv6 Link-Local
]


def is_safe_external_url(url: str) -> Tuple[bool, str]:
    try:
        parsed = urlparse(url)
        if parsed.scheme not in ["http", "https"]:
            return False, f"Prohibited URL scheme: '{parsed.scheme}'. Only HTTP and HTTPS are permitted."

        hostname = parsed.hostname
        if not hostname:
            return False, "Invalid URL: missing hostname."

        # Check raw IP or resolve domain
        try:
            ip = ipaddress.ip_address(hostname)
        except ValueError:
            # Resolve DNS
            try:
                resolved_ip_str = socket.gethostbyname(hostname)
                ip = ipaddress.ip_address(resolved_ip_str)
            except Exception:
                return False, f"Could not resolve hostname '{hostname}'"

        # Check against blocked private/internal CIDR ranges
        for net in BLOCKED_NETWORKS:
            if ip in net:
                return False, f"Access to private/internal IP '{ip}' (range: {net}) is forbidden (SSRF Protection)."

        return True, "URL is safe and points to a public external destination."
    except Exception as e:
        return False, f"URL validation failed: {str(e)}"
