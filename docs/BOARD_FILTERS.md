# Board Filters

The board supports a [range of filters](#available-filters) that you can apply [in multiple ways](#applying-filters). Filters are deep links that can be [shared and bookmarked freely](#storing-and-sharing-filters).


## Available Filters

The board supports the following filters:

| Filter | Description | Example |
| :--- | :--- | :--- |
| Text | Filter by issue and body text | `Foo` |
| `is` | Filter by a card state | `is:assigned`, `is:open` |
| `created`, `updated` | Filter card by temporal state | `created>=2020-09-23` |
| `assignee`, `reviewer`, `author`, `involved` | Filter for cards that involve a specific user | `involves:nikku` |
| `milestone` | Filter by [milestone](https://docs.github.com/en/github/managing-your-work-on-github/about-milestones) | `milestone:M1` |
| `label` | Filter by [label](https://docs.github.com/en/github/managing-your-work-on-github/managing-labels) | `label:critical` |
| `repo` | Filter by repository | `repo:"nikku/wuffle"` |

Filters get chained together by the board with _and_ semantics.


## Applying Filters

Filters can be applied via the [filter widget](#filter-widget) or by [clicking board elements with modifier keys](#filtering-via-board-elements).


### Filter Widget

The filter widget supports you in creating your filters via auto-completion. It only considers data available on the board, thus providing a convenient way to refine your existing filters with additional modifiers.


### Filtering via Board Elements

Click board elements such as issue links, avatars, milestones, and tags with a modifier key to toggle filters for the respective details.

Add a filter via `SHIFT + click`, set a filter via `ALT + click`.


## Storing and Sharing Filters

A unique deep link identifies a filtered view. Bookmark a filtered view in your browser or share it with other stakeholders. Keep in mind that the cards someone sees depend on her access to the underlying GitHub issues.