# Roll20 Dynamic Initiative and Status Tracker

The DIST script is a one-stop tool for:
  1. Advanced initiative tracking: DIST can automatically roll and track initiatives for all valid tokens on the map. It also supports ways for grouping and managing non-unique NPCs and getting initiative modifiers from unlinked character sheets (and can introduce status-based initiative modifiers).
  2. Managing dynamic initiative systems: DIST supports systems where the the initiative values for characters are re-rolled every round. DIST supports several different ways to track, modify, and manage the dynamic rolls (including initiative modifiers based on status effects).
  3. Tracking statuses and durations for extant tokens: DIST allows users to add and remove statuses (with durations) to and from any tokens on the map.
  4. Unique handling of statuses [IN PROGRESS]: DIST will soon be able to hook unique behaviors into status-related triggers, such as triggering damage rolls at the start of an affected token's turn.

## Getting Started
To get started with DIST:
1. Add the script to your campaign's API script page. 
2. Enable the script
3. [optional] Use the !Tracker configuration commands to set the configurable parameters as needed for your campaign.
4. [optional] Manually adjust the STATUS_ALIASES, INITIATIVE_MOD, and STATUS_TYPES objects to match the needs of your campaign.

### Prerequisites

DIST, as a roll20 API script, requires the DM to have access to the API scripts page.


## Contributing

If you'd like to contribute, please message me over on the [roll20 forums](https://app.roll20.net/users/58729/argagarg)

## Versioning

We use [SemVer](http://semver.org/) for versioning.

## Authors

* **Kirk Lundblade** - *Initial work* - [Argagarg](https://github.com/Argagarg)


## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details

## Acknowledgments

* This script was inspired by Manveti's roll20 Initiative Tracker (https://wiki.roll20.net/Script:Initiative_Tracker)
