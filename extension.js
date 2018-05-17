var vscode = require('vscode')

const gremlinsConfig = {
  '200b': {
    zeroWidth: true,
    description: 'zero width space',
  },
  '00a0': {
    description: 'non breaking space',
  },
  '201c': {
    description: 'left double quotation mark',
    backgroundColor: 'rgba(255,127,80,.5)',
    overviewRulerColor: 'rgba(255,127,80,1)',
  },
  '201d': {
    description: 'right double quotation mark',
    backgroundColor: 'rgba(255,127,80,.5)',
    overviewRulerColor: 'rgba(255,127,80,1)',
  },
  '0003': {
    description: 'end of text',
    backgroundColor: 'rgba(255,127,80,.5)',
    overviewRulerColor: 'rgba(255,127,80,1)',
  },
}

function gremlinsFromConfig(context) {
  const lightIcon = {
    gutterIconPath: context.asAbsolutePath('images/gremlins-light.svg'),
    gutterIconSize: 'contain',
  }
  const darkIcon = {
    gutterIconPath: context.asAbsolutePath('images/gremlins-dark.svg'),
    gutterIconSize: 'contain',
  }

  const gremlins = {}
  for (const [hexCodePoint, config] of Object.entries(gremlinsConfig)) {
    let decorationType = {
      light: lightIcon,
      dark: darkIcon,
      overviewRulerColor: config.overviewRulerColor || 'darkred',
      overviewRulerLane: vscode.OverviewRulerLane.Right,
    }

    if (config.zeroWidth) {
      decorationType.borderWidth = '1px'
      decorationType.borderStyle = 'solid'
      decorationType.borderColor = config.borderColor || 'darkred'
    } else {
      decorationType.backgroundColor =
        config.backgroundColor || 'rgba(255,128,128,.5)'
    }

    gremlins[charFromHex(hexCodePoint)] = Object.assign({}, config, {
      hexCodePoint,
      decorationType: vscode.window.createTextEditorDecorationType(
        decorationType,
      ),
    })
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
    Object.keys(gremlinsConfig)
      .map(hexCodePoint => charFromHex(hexCodePoint) + '+')
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
