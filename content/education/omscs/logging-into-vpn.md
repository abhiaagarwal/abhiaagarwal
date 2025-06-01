---
title: "Logging into Georgia Tech's VPN without using GlobalProtect"
description: Using `openconnect` and `vpn-slice`, we can do better.
tags: [thoughts]
published: 2025-06-01T15:36:00-04:00
---

As part of the privilege of attending Georgia Institute of Technology, I get access to PACE, Georgia Tech's supercomputing cluster. Unfortunately, to access PACE, you need to connect to Georgia Tech's VPN. To connect to Georgia Tech's VPN, you need to use Palo Alto Network's GlobalProtect. It's... not fun. My biggest annoyance is that you can't actually exit the application on MacOS without running the following command:

```bash
launchctl unload /Library/LaunchAgents/com.paloaltonetworks.gp.pangp*
```

Additionally, even though I'm connecting to the VPN to do my computing homework, Georgia Tech can now see _all_ of my traffic. I'm not particularly comfortable with this. There _has_ to be a separate way.

And it turns out, by using [`openconnect`](https://www.infradead.org/openconnect/index.html) and [`vpn-slice`](https://www.infradead.org/openconnect/vpnc-script.html), you can!

First, install `openconnect` and `vpn-slice`:

```bash
brew install openconnect vpn-slice
```

Then, to connect to Georgia Tech's VPN, run the following command:

```bash
sudo openconnect --protocol=gp vpn.gatech.edu \
    -u <georgia_tech_username_without_email> # ex: jsmith123
    -p <georgia_tech_password> \ # can be omitted
    -s "vpn-slice login-ice.pace.gatech.edu"
```

Note that sudo perms are necessary since it messes with your networking devices. Then, it'll ask you for your georgia tech password if not provided, and then a secondary factor. Go to the duo app, and enter the 6 digits randomly generated, and you should be in!

Full tracelog provided below for reference:

```bash
abhiagarwal@Abhis-MacBook-Pro ~> sudo openconnect --protocol=gp vpn.gatech.edu -u jsmith123 -s "vpn-slice login-ice.pace.gatech.edu"
POST https://vpn.gatech.edu/global-protect/prelogin.esp?tmp=tmp&clientVer=4100&clientos=Mac
Connected to <--snip-->
SSL negotiation with vpn.gatech.edu
Connected to HTTPS on vpn.gatech.edu with ciphersuite (TLS1.2)-(ECDHE-SECP256R1)-(RSA-SHA256)-(AES-256-GCM)
Enter login credentials
Password: 
POST https://vpn.gatech.edu/global-protect/getconfig.esp
Choose a secondary factor from ('push1', 'phone1') or enter passcode:
Challenge: 
POST https://vpn.gatech.edu/global-protect/getconfig.esp
Portal reports GlobalProtect version 6.2.7-1047; we will report the same client version.
Portal set HIP report interval to 60 minutes).
2 gateway servers available:
  DC Gateway (dc-ext-gw.vpn.gatech.edu)
  NI Gateway (ni-ext-gw.vpn.gatech.edu)
Please select GlobalProtect gateway.
GATEWAY: [DC Gateway|NI Gateway]:DC Gateway
POST https://dc-ext-gw.vpn.gatech.edu/ssl-vpn/login.esp
Connected to <--snip-->
SSL negotiation with dc-ext-gw.vpn.gatech.edu
Connected to HTTPS on dc-ext-gw.vpn.gatech.edu with ciphersuite (TLS1.2)-(ECDHE-SECP256R1)-(RSA-SHA256)-(AES-256-GCM)
GlobalProtect login returned authentication-source=gp-auth-sequence-new
GlobalProtect login returned password-expiration-days=0
GlobalProtect login returned portal-userauthcookie=<--snip-->
GlobalProtect login returned portal-prelogonuserauthcookie=empty
GlobalProtect login returned usually-equals-4=4
POST https://dc-ext-gw.vpn.gatech.edu/ssl-vpn/getconfig.esp
Tunnel timeout (rekey interval) is 180 minutes.
Idle timeout is 180 minutes.
GlobalProtect IPv6 support is experimental. Please report results to <openconnect-devel@lists.infradead.org>.
No MTU received. Calculated 1326 for ESP tunnel
POST https://dc-ext-gw.vpn.gatech.edu/ssl-vpn/hipreportcheck.esp
WARNING: Server asked us to submit HIP report with md5sum <--snip-->.
    VPN connectivity may be disabled or limited without HIP report submission.
    You need to provide a --csd-wrapper argument with the HIP report submission script.
ESP session established with server
ESP tunnel connected; exiting HTTPS mainloop.
Configured as <--snip-->, with SSL disconnected and ESP established
Session authentication will expire at Tue Jul  1 15:27:45 2025

WARNING: IPv6 address or netmask set. Support for IPv6 in vpn-slice should be considered BETA-QUALITY.
WARNING: IPv6 address or netmask set. Support for IPv6 in vpn-slice should be considered BETA-QUALITY.
Got results: [<DNS IN A rdata: <--snip-->>]
```

Inspecting the `/etc/hosts` file, we can see that `openconnect` added the relevant hosts:

```bash
abhiagarwal@Abhis-MacBook-Pro ~> cat /etc/hosts
##
# Host Database
#
# localhost is used to configure the loopback interface
# when the system is booting.  Do not change this entry.
##
127.0.0.1       localhost
255.255.255.255 broadcasthost
::1             localhost
130.<--snip--> dns0.utun11             # vpn-slice-utun11 AUTOCREATED
130.<--snip--> dns1.utun11             # vpn-slice-utun11 AUTOCREATED
128.<--snip--> login-ice.pace.gatech.edu                # vpn-slice-utun11 AUTOCREATED
```

Finally, we can just `ssh jsmith123@login-ice.pace.gatech.edu` and we're in!