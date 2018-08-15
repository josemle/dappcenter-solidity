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
- Majority weight and count is instant, or requires a delay. Or super majority of either weight or people for instant.
- Test holding and sending an ERC20.
  - Do we support withdraw ERC20's by share as well?
- More events, every action - e.g. change minTime
- How to view all proposals?
- Only members can vote, else date can be abused
- Best practice: 2 man team uses 4 keys.  e.g. 49, 49, 1, 1
- Add a feature list to the readme.
- Front end.
  - Maybe make it easy to create and select your team(s)?
  - Teams per contract or in the same?
  - Profit with tipjar or signup fee or % of withdrawls?