# VS Code Gremlins

This [Visual Studio Code](https://code.visualstudio.com/) extension reveals invisible whitespace characters (zero-width spaces) in code.

It is based on [Sublime Gremlins](https://packagecontrol.io/packages/Gremlins) for the feature, and [highlight trailing spaces](https://github.com/yifu/highlight-trailing-whitespaces) for most of the code.

## Features

When there is a zero-width space in the code, the characters before and after will have a red background.

![](screenshot.png)

## Known Issues

The extension should use a better visual hint without using other characters around the zero-width space, just like Sublime Gremlins.
