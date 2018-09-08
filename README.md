# SolidityContracts

![Travis Build](https://travis-ci.org/hardlydifficult/SolidityContracts.svg?branch=master)

## About

A WIP collection of smart contracts.

### DAO

The "Decentralized Autonomous Organization" contract holds funds to be redistributed to a team, manage the team, and allow members to vote to make arbitrary smart contract calls.

Features:
- Manages a team of 1 or more.
- Recieve funds for the team from any source, using a standard transfer transaction.
  - This could be as simple as posting an address for tips or the benefitiary of a dapp's smart contract, taking a % of all transactions.
- Submit proposals and vote before they may be executed.
  - There is a weight for each member representing their percent stake, similiar to shares in a company.  
  - Proposals are approved if:
    - they get a super majority of weight or headcount voting in-favor.
    - they get a majority of weight and headcount voting in-favor.
    - voters are more in-favor than against in terms of both weight and headcount and two weeks have past.
- Members can vote to add new members, remove members, change member weights, or modify any of the smart contract's config (such as timeTillMinorityCanExecute).
- Members can vote to perform any smart contract call.  This could be used to:
  - Act as the 'owner' for another contract, giving multi-sig guarantees.
  - Manage ERC20 or ERC721 tokens for the group.
  - Or anything else, like gamble everything on a single flip of a coin... if the team agrees by way of a vote.
- When any member of the team requests a withdrawl (or when a new team member is added), the funds are immeditally distributed to all members.
  - There is a minimum reserve, which can be changed with a vote.  This is deducted before distributing funds on a withdrawl request.
  - Alternatively funds may be sent to another address directly, after a vote.
  - This withdrawl feature works for ETH and any ERC20 (or ERC777).

Possible Threats:
- Inactive members: after 2 weeks minority approval is sufficient, use that to kick 'em.
- Lost keys: Use the swap member function to replace the old address with a new.
- Malicious members: Vote them down and then kick 'em, it's important to keep an eye on new proposals.
- Stolen keys: Vote them down and then kick 'em or do the lost key swap.

Risks: 
- 1&2 member teams may not be safe in the case of lost/stolen keys or a malicious member.  
  e.g. One member denies the other and the smart contract cannot know which is malicious.
  You could consider 2 keys per person here, e.g. each member having both a 49% weight account and a 1% weight account (which is only used in case of emergancy).

TODO 
 - Should we add support for deploy contract?
 - Front end.
  - Maybe make it easy to create and select your team(s)?
  - Teams per contract or in the same?
  - Profit with tipjar or signup fee or % of withdrawls?