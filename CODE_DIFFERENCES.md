### Code Changes from nikku/wuffle

#### Hiding Linked PRs
- `automatic-dev-flow` - move issue back to `in progress` if linked pr is closed or merged
- `Taskboard.svelte` - hide open PR's if they are linked using `isPRWithLinks`

#### Toggle Buttons to hide closed PRs and show keyword info
 - `Taskboard.svelte` - Make the buttons toggle info and display the text
 - `Taskboard.scss` - Make the buttons fit the Wuffle colour scheme
 - `Notification.svelte` - Show the text boxes in the correct place
 - `Card.svelte` - Toggle Card Link if merged/closed PR
 
#### Icons as filter and issue number as link
- `Card.svelte` - Make the Icon do the search instead of the issue number
- `CardLink.svelte` - Make the Icon do the search instead of the issue number
- `EpicIcon.svelte` - pass in onClick to filter issue by icon
- `ExpandIcon.svelte` - pass in onClick to filter issue by icon
- `LinkIcon.svelte` - pass in onClick to filter issue by icon
- `PullRequestIcon.svelte` - pass in onClick to filter issue by icon
