---
layout: post
title: "Axios Supply Chain Attack axios@1.14.1"
date: 2026-03-31 21:00
categories: [security, til]
author: hungneox
tags: [security, supply-chain]
description: "A breakdown of the recent Axios supply chain attack: how the compromised package works, its execution phases, and strategies to protect your environment."
image: /assets/posts/supply-chain/supply_chain_vendor_cyber_attack.png
comments: true
published: true
---

# The incident

![Axios Supply Chain Attack](/assets/posts/supply-chain/tiredboss.png)

Early this morning, an engineer at my company discovered that the `axios` package had fallen victim to a supply chain attack. Specifically, the attacker published compromised releases of `axios` containing a malicious hidden dependency. Fortunately, my company utilizes [JFrog Artifactory](https://jfrog.com/artifactory/). So we were able to swiftly remove the malicious package from our environment, and npm subsequently pulled down the poisoned versions from the public registry.

In general, relying directly on public npm registries can be risky. Using a private registry like Artifactory is highly recommended to maintain control over your dependencies.

# How did it work?

### Maintainer account hijack

The attacker compromised the npm account of the primary `axios` maintainer, changing the registered email to an attacker-controlled address. Using a stolen long-lived classic npm access token, they manually published both `axios@1.14.1` and `axios@0.30.4`, bypassing the project's standard GitHub Actions pipeline entirely. In the `package.json` for these releases, the legitimate `husky` pre-commit hooks were removed, and the malicious dependency was injected.

![Maintainer account hijack](/assets/posts/supply-chain/jasonsaayman.png)

### The delivery chain

- Installing the compromised `axios@1.14.1` or `axios@0.30.4` pulls in `plain-crypto-js@^4.2.1` as a dependency.
- `plain-crypto-js` declares `"postinstall": "node setup.js"` in its `package.json` — this executes automatically upon running `npm install`.
- `setup.js` is an obfuscated multi-platform backdoor installer.

These malicious versions introduced a single new dependency: `plain-crypto-js`, a purpose-built package whose `postinstall` hook silently downloaded and executed platform-specific Stage-2 RAT (Remote Access Trojan) implants from `sfrclak[.]com:8000`.

### Execution flow

Once a victim installs the compromised version of `axios`, the attack executes a series of actions designed to take control of the machine and hide its presence:

**1. Silent installation (Stage 1)**
- **Automatic execution:** The attack leverages a `postinstall` hook in the malicious dependency. This means the malware runs automatically as soon as `npm install axios` finishes, requiring zero user interaction.
- **Anti-forensics:** The "dropper" immediately tries to cover its tracks by deleting itself. It achieves this by renaming a clean stub file (`package.md`) to `package.json`, which intentionally reports a fake decoy version `4.2.0` rather than the malicious `4.2.1`. If an administrator runs `npm list plain-crypto-js`, it will report `4.2.0`, creating a powerful secondary deception layer.

**2. Reconnaissance & Profiling**
Once the Stage-2 RAT is deployed, it gathers a detailed snapshot of the victim's machine and sends it to the attacker's Command & Control (C2) server. This includes:
- **System identity:** Hostname, username, OS version, and hardware model.
- **Timestamps:** When the OS was installed and the exact boot time.
- **Process list:** A full list of every program currently running on the machine (PIDs, paths, and users).
- **File discovery:** It automatically scans high-value directories like the User Profile, Documents, and Desktop.

# How to protect yourself

One effective strategy for mitigating these kinds of supply chain attacks is to establish a package quarantine policy. Because malicious packages are usually identified and removed shortly after publication, enforcing a minimum package age can protect your environment from zero-day threats. For example, we should have cooldown period for new packages, say 2-4 weeks, before using them in production. In some cases, the renovate bot always update packages, so we need to have a policy to control it.

In the case of this `axios` attack, the malicious dependency `plain-crypto-js@4.2.1` had existed for less than 24 hours. Had developers utilized tools that mandate a validation delay—such as the open-source [Aikido Safe Chain](https://github.com/AikidoSec/safe-chain), which enforces a default 48-hour package age and scans against threat feeds—this attack would have been automatically blocked before reaching local machines.

# References

- [GitHub Gist: Joe Desimone](https://gist.github.com/joe-desimone/36061dabd2bc2513705e0d083a9673e7)
- [Aikido Security: Axios npm compromised maintainer hijacked RAT](https://www.aikido.dev/blog/axios-npm-compromised-maintainer-hijacked-rat)
- [Elastic Security Labs: Axios - One RAT to rule them all](https://www.elastic.co/security-labs/axios-one-rat-to-rule-them-all)
- [Axios GitHub Issue](https://github.com/axios/axios/issues/10604)
- [StepSecurity: axios Compromised on npm - Malicious Versions Drop Remote Access Trojan](https://www.stepsecurity.io/blog/axios-compromised-on-npm-malicious-versions-drop-remote-access-trojan)