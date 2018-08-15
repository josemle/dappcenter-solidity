# SolidityContracts

![Travis Build](https://travis-ci.org/hardlydifficult/SolidityContracts.svg?branch=master)

## About

A WIP collection of smart contracts.

### DAO

The "Decentralized Autonomous Organization" contract holds funds to be redistributed to a team, manage the team, and allow members to vote to make arbitrary smart contract calls.

Possible Threats:
- Inactive members: after 2 weeks minority approval is sufficient, use that to kick 'em.
- Lost keys: Use swap member to replace the old address with a new.
- Malicious members: Vote them down and then kick 'em, it's important to keep an eye on new proposals.
- Stolen keys: Vote them down and then kick 'em or do the lost key swap.

Risks: 
- 2 member teams are not safe (unless one has more weight).  
  One member denies the other and the smart contract cannot know which is malicious.

TODO 
- Allow resubmitting of failed calls (e.g. an external dependancy had a short term freeze activated)
- Risk: someone votes on something really old to not get noticed?  Add an expiration.  Need a clear final bit for proposals (accepted or not).
    - 1 month default with configure option

