# Gremlins, for Visual Studio Code

This [Visual Studio Code](https://code.visualstudio.com/) extension reveals invisible whitespace characters (zero-width spaces) and non-breaking spaces in code.

Heavily inspired by [Sublime Gremlins](https://packagecontrol.io/packages/Gremlins).

## Features

- When there is a zero-width space in the code, the extension shows a red bar
- A few characters that can be harmful have a light red background
  - Non-breaking spaces
  - Right double quotation marks
- Move the cursor over the red bar or red background to have a hint of the potential issue
- A gremlin icon is show in the gutter for every line that contains one of these characters

![A screenshot of Gremlins in action](images/screenshot.png)

