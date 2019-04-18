> :construction: This project is currently in _alpha_ state. Put your :rescue_worker_helmet: on and acknowledge that certain features [may still be missing](https://github.com/nikku/wuffle/issues).


# Wuffle Board

A task board for [GitHub](https://github.com) issues.

![Wuffle Screenshot](./docs/screenshot.png)


## Features

* Multi-repository / organization support
* Private repository support (you only see the issues you'd see on GitHub, too)
* Only contributors can update issues
* Configure columns and GitHub label to column mappings
* Automatically moves across columns, as you develop
* Filter issues by name, label, and more
* Manual move across / reorder issues


## Project Scope

Some key aspects separate [Wuffle](https://github.com/nikku/wuffle) from the GitHub task board competition:

* __[GitHub issues](https://guides.github.com/features/issues/) are the source of truth.__ We read and store columns, relationships and everything else directly on GitHub. The only exception is issue order (not supported by GitHub, so far).

* __Tight integration with the [GitHub flow](https://guides.github.com/introduction/flow/).__ Your issues move automatically across the board. The board is always up to date with things going on in development.

* __Publicly accessible.__ The board is publicly accessible. It does, however, only display those issues to a visitor that she sees on GitHub, too. You'd like to see cards of your private repositories? Log-in with your GitHub identity and see them pop up on the board.

* __Hackable.__ Wuffle is open source, MIT licensed. Contribute to it to make it even better. Self-host it and stay the owner of your data. 


## Try it

```
npm install
npm start
```

Goto [`localhost:3001/board`](http://localhost:3001/board) to inspect the board.


## See Also

* [wuffle-sync](https://github.com/nikku/wuffle-sync) - the wuffle synchronization bot


## License

[MIT](LICENSE)
