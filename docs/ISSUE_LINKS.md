# Issue Links

Wuffle allows you to [connect issues via links](#recognized-links) that are displayed on the board and enable [automatic column sorting](#automatic-sorting).


## Recognized Links

The following links are recognized when found in an issues description:

| Type | Keywords |
| :--- | :--- |
| `CLOSES` | `closes`, `fixes` |
| `CHILD_OF` | `child of` |
| `PARENT_OF` | `parent of` |
| `DEPENDS_ON` | `depends on`, `requires` |
| `REQUIRED_BY` | `required by`, `needed by` |
| `LINKED_TO` | `related to` |


## Automatic Sorting

Based on established links, the board attempts to sort issues automatically.
Pre-sorted columns ensure that issues can be picked (or reviewed) from the top. To enable this feature per column, [mark it as sorting](./SETUP.md#configure-the-board).

The following link types influence sorting:

| Type |
| :--- |
| `CLOSES` |
| `CHILD_OF` |
| `PARENT_OF` |
| `DEPENDS_ON` |
| `REQUIRED_BY` |
