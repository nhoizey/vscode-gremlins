# Gremlins tracker for Visual Studio Code

[![GitHub package version](https://img.shields.io/github/package-json/v/nhoizey/vscode-gremlins.svg?style=for-the-badge&logo=visualstudiocode)](https://marketplace.visualstudio.com/items?itemName=nhoizey.gremlins)
[![Visual Studio Marketplace](https://img.shields.io/vscode-marketplace/d/nhoizey.gremlins.svg?style=for-the-badge&logo=visualstudiocode)](https://marketplace.visualstudio.com/items?itemName=nhoizey.gremlins)
[![GitHub stars](https://img.shields.io/github/stars/nhoizey/vscode-gremlins.svg?style=for-the-badge&logo=github)](https://github.com/nhoizey/vscode-gremlins/stargazers)
[![Follow @nhoizey@mamot.fr](https://img.shields.io/mastodon/follow/000262395?domain=https%3A%2F%2Fmamot.fr&style=for-the-badge&logo=mastodon&logoColor=white&color=6364FF)](https://mamot.fr/@nhoizey)

This [Visual Studio Code](https://code.visualstudio.com/) extension reveals some characters that can be harmful because they are invisible or looking like legitimate ones.

## Features

- When there is a zero-width space in the code, the extension shows a red bar
- When there is a zero-width non-joiner in the code, the extension shows a red bar
- A few characters that can be harmful have a light red or orange background
  - Non-breaking spaces
  - Left and right double quotation marks
  - Etc.
- Some other characters are less harmful, but you might be interested in knowing they're here, so they're also shown, in blue
- Move the cursor over the character to have a hint of the potential issue
- A gremlin icon is shown in the gutter for every line that contains at least one of these characters

![A screenshot of Gremlins in action](images/screenshot.png)

You can also use the [“Unicode code point of current character” extension](https://marketplace.visualstudio.com/items?itemName=zeithaste.cursorCharCode) to show information about the character under cursor in the status bar.

## Adding new gremlins characters

You can configure the list of additional characters and how they are shown under user settings key `gremlins.characters`.

As an example, the following snippet adds the "U+000C" FORM FEED character:

```jsonc
"gremlins.characters": {
  "000c" : {
    "zeroWidth": true,
    "description": "FORM FEED (FF)",
    "overviewRulerColor": "rgba(255,127,80,1)",
  }
}
```

Please help enhance the extension by suggesting new default characters, through Pull Requests or Issues.

You can find all characters in [Unicode Table](https://symbl.cc/en/).

## Language-specific gremlins characters

You can override the characters for a specific language by configuring them in the `gremlins.characters` property of the language-specific settings key (e.g. `[markdown]` for Markdown files).

> More information about language specific settings can be found in the [Language specific editor settings](https://code.visualstudio.com/docs/getstarted/settings#_language-specific-editor-settings) VSCode documentation page.

As an example, the following snippet adds the "U+000C" (form feed) character and disables the "U+00A0" (non-breaking space) character for markdown files:

```jsonc
"[markdown]": {
  "gremlins.characters": {
    // Add the form feed character for markdown files
    "000c" : {
      "zeroWidth": true,
      "description": "FORM FEED (FF)",
      "level": "error",
    },
    // Ignore the non-breaking space character for markdown files
    "00a0": {
      "level": "none"
    }
  }
}
```

## Specifying a Range of Invalid Characters

You can give a range to flag multiple characters with a single rule.

For example, if using macOS and the option key is set to a modifier, it's easy to accidentally include a [Latin-1 Supplemental Character](https://symbl.cc/en/blocks/latin-1-supplement/) that can be difficult to notice in your code.

To catch the entire range, the Latin-1-Supplement link provided shows a unicode range of: `0080—00FF`

Configure a rule like this:

```jsonc
"gremlins.characters": {
    "0080-00FF": {
        "level": "error",
        "zeroWidth": false,
        "description": "Latin-1 Supplement character identified",
        "overviewRulerColor": "rgba(255,127,80,1)",
    },
}
```

To test this out, copy some of the [characters](https://symbl.cc/en/blocks/latin-1-supplement/) or try the sample below.
If you have the problems pane set to flag as errors, this should show up immediately with each character being identified as a problem.

```text
»
×
Ö
```

## Hiding the gremlin icon in the gutter for a character

You can chose to hide the gremlin icon in the gutter for some characters.

Still under user settings key `gremlins.characters`, you can add the `hideGutterIcon` property to a character (even one from default settings) and set it to true.

For example, this removes the gremlin icon in the gutter for non breakable spaces:

```jsonc
"gremlins.characters": {
  "00a0" : {
    "hideGutterIcon": true
  }
}
```

## Displaying gremlins in the Problems pane

By default, gremlins will be highligted in the text editor and an icon will be displayed in the gutter for each line with at least one gremlin. You can toggle whether gremlins also show in the Problems pane with user settings key `gremlins.showInProblemPane`.

![A screenshot of Gremlins in Problem Pane](images/problems-screenshot.png)

## Displaying end-of-line characters

If you want to display end-of-line characters, you can use the [Render Line Endings plugin](https://marketplace.visualstudio.com/items?itemName=medo64.render-crlf).

# Standing on the shoulders of giants

VS Code Gremlins was initialy heavily inspired by [Sublime Gremlins](https://packagecontrol.io/packages/Gremlins), a [Sublime Text](https://www.sublimetext.com/) 3 plugin to help identify invisible and ambiguous Unicode whitespace characters (zero width spaces, no-break spaces, and similar.).

I later discovered the “Gremlins” name had already been used a long time before, in some editors:

[Bare Bones Software](http://www.barebones.com/)'s famous [BBEdit](http://www.barebones.com/products/bbedit/) HTML and text editor for macOS has a “Zap Gremlins” feature since [its first public release April 12th, 1992](https://groups.google.com/forum/#!topic/comp.sys.mac.announce/gvPGyuX3UCs)!

Here's how it looks in recent versions:

<p style="text-align: center"><img src="https://raw.githubusercontent.com/nhoizey/vscode-gremlins/master/images/bbedit-gremlins.png" width="50%" height="auto" alt="Searching for Gremlins in BBEdit" /></p>

It looks like people liked this feature so much that they made [a dedicated website](http://zapgremlins.com/), unfortunately not anymore. Thanks Archive.org for [the cached version](https://web.archive.org/web/20120618091150/http://zapgremlins.com/):

<p style="text-align: center"><img src="https://raw.githubusercontent.com/nhoizey/vscode-gremlins/master/images/zap-gremlins.jpg" width="75%" height="auto" alt="The Zap Gremlins website" /></p>

## License

MIT
