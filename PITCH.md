# cypherpost pitch

Hi.

Our team is in search of a bitcoin friendly end-to-end encrypted messaging solution, to support a bitcoin wallet in facilitating private p2p contracting.

Synchronizing multi party contract wallets has been problematic for coordination required for two specific tasks:

- Genesis: Each member has to share their `pubkey` and agree on the same terms of the contact i.e. policy.

- Send: Depending on the policy, members might have to pass a `psbt` until it all its conditions are satisfied and ready for broadcast.

- TapScript: For efficient tapscript path finding, members have to agree on which keys are going to sign before building the transaction.

Multi-party policies  also faces the issue of backup, since the seed alone is not enough to backup a wallet. The other member's public keys are also required to recreate the correct policy wallet.

Some interesting multi-party usescases:

- Onboarding a family member or friend to bitcoin? Join them in 1/2 time-locked insurance policy and help bail them out if they lose their key.

- Adding Bitcoin to company's reserve? Manage it as a multisig with your board members.

- 2/3 is the most popular form of multisig, most commonly used for a simple escrow policy - where a trade between two untrusted parties can be facilitated by a trusted escrow.
 
Currently, such communication between members in a bitcoin policy takes place on Messenger platforms such as Signal, Element, Threema etc.
A lot of copy-pasting back and forth between apps is required not only for setup but also daily operation. 

The primary requirement from these Messenger platforms is E2EE. Reliability would be the next.

CPost aims to solve that by providing a simple e2ee protocol, designed with bitcoin standards from the ground up.

Its main goal is to provide the minimum viable messaging requirement, to pass messages to peers in a private manner.

Anonymity: No email or phone-number required. How do we protect from spam? Lightning sats to register on our home server, or run your own private server with invite-only access? Hiding your IP from us is on you - VPN + TOR ;)
*CPost servers create their own private network. Servers do not communicate with each other.*

Bitcoin-Compatible: We use EC Keys created from a BIP39 mnemonic phrase and maintain a key-chain organized for each use-case using BIP32 derivation path scheme. All wallets are familiar with these operations.
Additionally, authentication uses schorr signatures, where every request is signed (tokenless auth). E2EE is done via ECDH Shared Secret. All bitcoin standard crypto.


p2p contracting would probably be better facilitated on a more distributed network like Matrix ?

- Matrix is a better networking (meeting new people) platform. CPost is designed to support private use between family, friends and business partners. It encourages building contracts only through your network of trust. 
We also found Matrix unecessarily complex. The result might be a stronger cryptographic protocol for long term storage. Since CPosts by default expire in a week and maximum a month from creation, CPost is not built to store data for extended periods. All that persists on CPost are badges that form a reputation system.
A badge on CPost is just a special signed message.

what if cpost home server is down and my team is maintaining a multisig wallet using cpost as a datastore i.e. what if the home servers are unavailable?

- we wont be down ;) if we are, unavailability will only affect your convenience. only public wallet data should ever be shared with cypherpost. Specifically, one of the three types mentioned earlier - pubkeys and psbt.
so if our home server is down, someone else can pop up as the new and more reliable public server or your linux buddy can easily run your own for the group.


Bitcoin Key UI has always been a mnemonic. 

This worked for single-sigs, but with multi-party scripts we require a L2 solution, where bitcoin keys are used to encrypt public descriptor backups on multiple locations on the internet: 
- DropBox
- GDrive
- iCloud

CPost moves the Bitcoin Key UI to mnemonic2x, where 1 mnemonic is the core key( used in many scripts ), and the second backup key, giving access to the backup of all the script wallet public descriptors.
Losing either one of these two mnemonics will lead to complete loss of funds.
