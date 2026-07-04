import time
import sys
import json
import urllib.request
import urllib.error
from datetime import datetime, timezone

try:
    from scapy.all import sniff, IP, TCP
    SCAPY_AVAILABLE = True
except ImportError:
    SCAPY_AVAILABLE = False

flows = {}

def post_flow_to_api(src_ip, dest_ip, label, risk_score):
    severity_map = {
        "BENIGN": 1,
        "LOW": 2,
        "PortScan": 3,
        "BruteForce": 4,
        "WebAttack": 4,
        "DDoS": 5,
        "Botnet": 5,
        "Infiltration": 5
    }
    sev = severity_map.get(label, 3)
    flow_data = {
        "timestamp": datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
        "source_ip": src_ip,
        "dest_ip": dest_ip,
        "predicted_label": label,
        "severity": sev,
        "is_anomaly": 1 if label != "BENIGN" else 0,
        "risk_score": float(risk_score),
        "recommended_action": "",
        "status": "Open" if label != "BENIGN" else "Logged"
    }
    url = "http://127.0.0.1:8000/api/flows"
    req = urllib.request.Request(url, method="POST")
    req.add_header("Content-Type", "application/json")
    try:
        urllib.request.urlopen(req, data=json.dumps(flow_data).encode("utf-8"), timeout=1.0)
    except Exception:
        pass

def process_packet(packet):
    if not packet.haslayer(IP):
        return
    src_ip = packet[IP].src
    dest_ip = packet[IP].dst
    pkt_len = len(packet)
    flow_key = (src_ip, dest_ip)
    current_time = time.time()
    has_syn = 0
    if packet.haslayer(TCP):
        flags = packet[TCP].flags
        if flags & 0x02:
            has_syn = 1
    if flow_key not in flows:
        flows[flow_key] = {
            "start": current_time,
            "packets": 1,
            "bytes": pkt_len,
            "syn_count": has_syn
        }
    else:
        flow = flows[flow_key]
        flow["packets"] += 1
        flow["bytes"] += pkt_len
        flow["syn_count"] += has_syn
        duration = max(0.001, current_time - flow["start"])
        pkt_rate = flow["packets"] / duration
        risk_score = 0
        predicted_label = "BENIGN"
        if flow["syn_count"] > 15 and pkt_rate > 100:
            predicted_label = "DDoS"
            risk_score = min(100, 50 + flow["syn_count"] * 2)
        elif flow["packets"] > 25 and duration < 1.0:
            predicted_label = "PortScan"
            risk_score = 75
        elif flow["syn_count"] > 5 and flow["packets"] > 10:
            predicted_label = "BruteForce"
            risk_score = 65
        if risk_score > 30:
            trust_score = 100 - risk_score
            print(f"[LIVE DETECT] {src_ip} -> {dest_ip} | Type: {predicted_label} | Trust Level: {trust_score}% | Recommended: ISOLATE ACCESS")
            post_flow_to_api(src_ip, dest_ip, predicted_label, risk_score)
        else:
            if flow["packets"] % 50 == 0:
                post_flow_to_api(src_ip, dest_ip, "BENIGN", 15.0)

def start_sniffer(interface=None):
    print("=" * 60)
    print(" 🛡️  NetworkGuard Live Packets Sniffer (Zero-Trust Monitor)")
    print("=" * 60)
    if not SCAPY_AVAILABLE:
        print("[!] Error: Scapy is not installed or Npcap drivers are missing.")
        print("[!] Running in SIMULATION mode...")
        print("[*] Simulating live flow events. Press Ctrl+C to stop.")
        import random
        sim_ips = ["192.168.1.15", "10.0.0.4", "45.33.21.88", "172.16.0.4"]
        try:
            while True:
                time.sleep(random.uniform(1.0, 3.0))
                sip = random.choice(sim_ips)
                dip = "192.168.1.1"
                if random.random() > 0.6:
                    label = random.choice(["DDoS", "PortScan", "BruteForce", "WebAttack", "Botnet"])
                    risk = random.randint(60, 98)
                    trust = 100 - risk
                    print(f"[LIVE DETECT] {sip} -> {dip} | Type: {label} | Trust Level: {trust}% | Recommended: ISOLATE ACCESS")
                    post_flow_to_api(sip, dip, label, risk)
                else:
                    risk = random.randint(5, 25)
                    post_flow_to_api(sip, dip, "BENIGN", risk)
        except KeyboardInterrupt:
            print("\n[*] Simulation stopped.")
            sys.exit(0)
    print(f"[*] Sniffing active connections on interface: {interface or 'Default'}...")
    print("[*] Press Ctrl+C to terminate live capturing.")
    try:
        sniff(iface=interface, prn=process_packet, store=0)
    except PermissionError:
        print("[!] Error: Administrator/Root permissions are required to capture raw network packets.")
        print("[!] Run terminal/cmd as Administrator and execute: python sniffer.py")
    except KeyboardInterrupt:
        print("\n[*] Capture terminated.")

if __name__ == "__main__":
    target_iface = sys.argv[1] if len(sys.argv) > 1 else None
    start_sniffer(target_iface)
