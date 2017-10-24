[![Visual Studio Marketplace](https://img.shields.io/vscode-marketplace/d/nhoizey.gremlins.svg?style=plastic)](https://marketplace.visualstudio.com/items?itemName=nhoizey.gremlins)
[![GitHub package version](https://img.shields.io/github/package-json/v/nhoizey/vscode-gremlins.svg?style=plastic)](https://marketplace.visualstudio.com/items?itemName=nhoizey.gremlins)

# Gremlins, for Visual Studio Code

This [Visual Studio Code](https://code.visualstudio.com/) extension reveals some characters that can be harmful because they are invisible or looking like legitimate ones.

Heavily inspired by [Sublime Gremlins](https://packagecontrol.io/packages/Gremlins).

## Features

- When there is a zero-width space in the code, the extension shows a red bar
- A few characters that can be harmful have a light red or orange background
  - Non-breaking spaces
  - Left and right double quotation marks
- Move the cursor over the character to have a hint of the potential issue
- A gremlin icon is show in the gutter for every line that contains at least one of these characters

![A screenshot of Gremlins in action](images/screenshot.png)

## Adding new gremlins characters

The list of supported characters is an array at the begining of the extension source code:

```javascript
const gremlins = [
  {
    char: '200b',
    regex: /\u200b+/g,
    width: 0,
    message: 'zero width space',
  },
  {
    char: '00a0',
    regex: /\u00a0+/g,
    width: 1,
    message: 'non breaking space',
  },
  {
    char: '201d',
    regex: /\u201d+/g,
    width: 1,
    message: 'right double quotation mark',
    backgroundColor: 'rgba(255,127,80,.5)',
    overviewRulerColor: 'rgba(255,127,80,1)',
  },
]
```

Please help enhance the extension by suggesting new characters, through Pull Requests or Issues.