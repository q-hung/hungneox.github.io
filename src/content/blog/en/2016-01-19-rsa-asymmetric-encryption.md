---
layout: post
title: "RSA asymmetric encryption"
date: 2016-01-19 19:55
categories: [security]
author: hungneox
description: A plain-language look at symmetric vs asymmetric cryptography, RSA, and why HTTPS needs both.
image: /assets/posts/rsa/asym-encryption.png
comments: true
---

# 1. Symmetric and asymmetric encryption in brief

![Asymmetric cryptography](/assets/posts/rsa/asym-encryption.png)

Almost anyone who has dipped a toe into information security has heard of the two common families: **symmetric cryptography** and **asymmetric cryptography**. In essence:

- **Symmetric encryption** (also called secret-key encryption): you use the *same* key to lock and unlock the data you want to keep secret. Whoever sends and whoever receives both need that key.

- **Asymmetric encryption** (also called public-key encryption): you use *two different* keys to lock and unlock confidential data. The **`public key`** is published and sent to whoever needs to encrypt for you; the **`private key`** stays secret and acts like a master key that can open everything that was locked with the matching public key.

# 2. Why do we need asymmetric encryption?

![https](/assets/posts/rsa/https.jpg)

In short, most apps you use every day—Facebook, Gmail, Amazon, PayPal, and so on—rely on **HTTPS**. HTTPS is “safer” than HTTP because traffic between the client and the server is protected by **SSL/TLS**, which uses *both* symmetric and asymmetric cryptography. That is how we can keep **sensitive** transactions on the Internet from having their contents stolen in transit. Frankly, without cryptography—and asymmetric encryption in particular—there would be **no e-commerce**.

Plain **HTTP** sends data as **plain text**: if someone **eavesdrops** on what you exchange with the server, they can read and tamper with it (a man-in-the-middle attack). Even if you used symmetric encryption for the traffic, you still have a weak spot: the two sides must exchange a **key** before they can encrypt and decrypt, and an attacker can still **snatch that key** and read the traffic.

Asymmetric encryption fixes that weakness. The idea: instead of sending a *key* to the client, the server sends a **lock**. The client locks the secret message in a box; only the server can decrypt it. So clients **cannot** read each other’s messages—only the server, with the **`private key`**, can open those boxes. (In practice the **`public key`** is used both to encrypt and to verify data sent to and from the server!)

# 3. RSA

**RSA** is one of the most widely used asymmetric schemes. It is named after three MIT researchers who designed it: Ron **Rivest**, Adi **Shamir**, and Leonard **Adleman**. The security of RSA hinges on the fact that **factoring a very large number into two primes** is hard. (If \(a \times b = c\), recovering \(a\) and \(b\) from \(c\) is integer factorization.)

The RSA workflow has four stages: **key generation**, **key distribution**, **encryption**, and **decryption**. To keep things secret, each deployment generates its **own** public and private keys. After the **handshake** and once the **public key** reaches the client, the channel is actually encrypted when server and client talk.

# 4. Encryption and decryption

Skipping for a moment *how* the keys are produced, the encrypt/decrypt formulas are:

- Encryption: $$m^e \mod n = c$$
- Decryption: $$c^d \mod n = m$$

Where:

* \(m\) is the original message  
* \(e\) and \(n\) form the **public key**  
* \(c\) is the ciphertext  
* \(d\) is the **private key**—usually a huge number, guarded absolutely  

Example with \(e = 17\), \(n = 3233\), \(d = 2753\), and message \(m = 42\):

* Encrypt: $$42^{17} \mod 3233 = 2557$$

Decrypting \(2557\) brings you back to \(42\):

* Decrypt: $$2557^{2753} \mod 3233 = 42$$

The private key \(d\) is derived from the two **prime factors** of \(n\). In production, \(n\) is the product of two large primes (e.g. 2048-bit), so computing \(d\) from \(p\) and \(q\) is easy, but recovering \(p\) and \(q\) from \(n\) to steal the private key is practically infeasible with today’s hardware.

# 5. Generating the public and private keys

This part is math-heavy; you can ignore most of it if you use built-in cipher APIs in [Java](https://docs.oracle.com/javase/7/docs/api/java/security/KeyPairGenerator.html) or [JavaScript](https://developer.mozilla.org/en/docs/Web/API/SubtleCrypto).

1. Pick two distinct random primes \(p\) and \(q\) (in practice, the bigger the better—2048 bits, on the order of 617 decimal digits).
	* Example: \(p = 61\) and \(q = 53\)
2. Compute the product $$n = p \times q = 61 \times 53 = 3233$$
3. Compute Euler’s totient: $$\Phi(n) = (p − 1)(q − 1)$$
	$$\Phi(3233) = (61 - 1) \times (53 - 1) = 3120$$
4. Choose some \(e\) with $$1 < e < 3120$$ that is [coprime](https://en.wikipedia.org/wiki/Coprime_integers) to \(3120\).
	* Take $$e = 17$$
5. Compute \(d\) as the [modular multiplicative inverse](https://en.wikipedia.org/wiki/Modular_multiplicative_inverse) of \(e \bmod \Phi(n)\):

$$ 
 \\ e \times d \mod \Phi(n) = 1
 \\ 17 \times d \mod 3120 = 1
$$

You can **brute-force** \(d\) (feasible here because the numbers are tiny), or use the extended Euclidean algorithm; you get $$d = 2753$$

Brute force looks like this (fewer than 15 iterations):

```python
def compute_d(phi_n, e):
	for i in range(1, 1000):
		x = ((i * phi_n) + 1) / e
		y = (e * x) % phi_n
		if y == 1:
			print(x)
			break

compute_d(3120, 17)
```

So we end up with **public key** \(e = 17\), \(n = 3233\) and **private key** \(d = 2753\).

# 6. How secure is RSA?

RSA’s strength depends heavily on the **random number generator** that produces the initial primes \(p\) and \(q\). Recovering \(p\) and \(q\) from \(n\) is essentially impossible for 2048-bit primes as described—but computing \(d\) from \(p\) and \(q\) is easy. So if anyone guesses or breaks the RNG, consider RSA **broken**. There has been reporting that the U.S. National Security Agency (**NSA**) slipped a **back door** into the **Dual Elliptic Curve** random-number generator so RSA could be cracked perhaps **10,000×** faster. Notably, that generator was shipped as the default by **RSA the company** (founded by the three authors of the RSA system) in many products. ([Exclusive: NSA infiltrated RSA security more deeply than thought - study](http://www.reuters.com/article/us-usa-security-nsa-rsa-idUSBREA2U0TY20140331))

# References

1. Thái DN, *Modern cryptography (1)* (Vietnamese series), [http://vnhacker.blogspot.fi/2010/05/mat-ma-hien-ai-1.html](http://vnhacker.blogspot.fi/2010/05/mat-ma-hien-ai-1.html)  
2. *Encryption Huge Number*, Numberphile, [https://www.youtube.com/watch?v=M7kEpw1tn50](https://www.youtube.com/watch?v=M7kEpw1tn50)
