var vscode = require('vscode')

const gremlinsDefaultColor = 'rgba(169, 68, 66, .75)'
const gremlinsLevels = {
  info: vscode.workspace.getConfiguration('gremlins').color_info,
  warning: vscode.workspace.getConfiguration('gremlins').color_warning,
  error: vscode.workspace.getConfiguration('gremlins').color_error,
}
const gremlinsCharacters = vscode.workspace.getConfiguration('gremlins')
  .characters
const gutterIconSize = vscode.workspace.getConfiguration('gremlins')
  .gutterIconSize
const hexCodePointsRangeRegex = /^([0-9a-f]+)(?:-([0-9a-f]+))?$/i

function gremlinsFromConfig(context) {
  const lightIcon = {
    gutterIconPath: context.asAbsolutePath('images/gremlins-light.svg'),
    gutterIconSize: gutterIconSize,
  }
  const darkIcon = {
    gutterIconPath: context.asAbsolutePath('images/gremlins-dark.svg'),
    gutterIconSize: gutterIconSize,
  }

  const gremlins = {}
  for (const [hexCodePoint, config] of Object.entries(gremlinsCharacters)) {
    let decorationType = {
      light: lightIcon,
      dark: darkIcon,
      overviewRulerColor: config.overviewRulerColor || gremlinsDefaultColor,
      overviewRulerLane: vscode.OverviewRulerLane.Right,
    }

    if (config.zeroWidth) {
      decorationType.borderWidth = '1px'
      decorationType.borderStyle = 'solid'
      decorationType.borderColor =
        gremlinsLevels[config.level] || gremlinsDefaultColor
    } else {
      decorationType.backgroundColor =
        gremlinsLevels[config.level] || gremlinsDefaultColor
    }

    let hexCodePointsRange = hexCodePoint.match(hexCodePointsRangeRegex)
    if (hexCodePointsRange[2] !== undefined) {
      // This is a range of characters
      // Lets create all characters of the range, with the same configuration
      let firstChar = parseInt(`0x${hexCodePointsRange[1]}`, 16)
      let lastChar = parseInt(`0x${hexCodePointsRange[2]}`, 16)

      for (var index = firstChar; index <= lastChar; ++index) {
        let thisHexCodePoint = index.toString(16)

        gremlins[String.fromCharCode(index)] = Object.assign({}, config, {
          thisHexCodePoint,
          decorationType: vscode.window.createTextEditorDecorationType(
            decorationType,
          ),
        })
      }
    } else {
      // This is a single character
      gremlins[charFromHex(hexCodePoint)] = Object.assign({}, config, {
        hexCodePoint,
        decorationType: vscode.window.createTextEditorDecorationType(
          decorationType,
        ),
      })
    }
  }

  return gremlins
}

function charFromHex(hexCodePoint) {
  return String.fromCodePoint(`0x${hexCodePoint}`)
}

function updateDecorations(activeTextEditor, gremlins, regexpWithAllChars) {
  if (!activeTextEditor) {
    return
  }

  const doc = activeTextEditor.document

  const decorationOption = {}
  for (const char in gremlins) {
    decorationOption[char] = []
  }

  for (let lineNum = 0; lineNum < doc.lineCount; lineNum++) {
    let lineText = doc.lineAt(lineNum)
    let line = lineText.text

    let match
    while ((match = regexpWithAllChars.exec(line))) {
      const matchedCharacter = match[0][0]

      const gremlin = gremlins[matchedCharacter]
      let startPos = new vscode.Position(lineNum, match.index)
      let endPos = new vscode.Position(lineNum, match.index + match[0].length)
      const decoration = {
        range: new vscode.Range(startPos, endPos),
        hoverMessage:
          match[0].length +
          ' ' +
          gremlin.description +
          (match[0].length > 1 ? 's' : '') +
          ' (unicode U+' +
          gremlin.hexCodePoint +
          ') here',
      }

      decorationOption[matchedCharacter].push(decoration)
    }
  }

  for (const [char, gremlin] of Object.entries(gremlins)) {
    activeTextEditor.setDecorations(
      gremlin.decorationType,
      decorationOption[char],
    )
  }
}

function activate(context) {
  const gremlins = gremlinsFromConfig(context)
  const regexpWithAllChars = new RegExp(
    Object.keys(gremlins)
      .map(char => `${char}+`)
      .join('|'),
    'g',
  )

  vscode.window.onDidChangeActiveTextEditor(
    editor => updateDecorations(editor, gremlins, regexpWithAllChars),
    null,
    context.subscriptions,
  )

  vscode.window.onDidChangeTextEditorSelection(
    event => updateDecorations(event.textEditor, gremlins, regexpWithAllChars),
    null,
    context.subscriptions,
  )

  vscode.workspace.onDidChangeTextDocument(
    event =>
      updateDecorations(
        vscode.window.activeTextEditor,
        gremlins,
        regexpWithAllChars,
      ),
    null,
    context.subscriptions,
  )

  updateDecorations(
    vscode.window.activeTextEditor,
    gremlins,
    regexpWithAllChars,
  )
}
exports.activate = activate

// this method is called when your extension is deactivated
function deactivate() {}
exports.deactivate = deactivate
