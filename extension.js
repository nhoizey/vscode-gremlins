var vscode = require('vscode')

const gremlinsConfig = [
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
    char: '201c',
    regex: /\u201c+/g,
    width: 1,
    message: 'left double quotation mark',
    backgroundColor: 'rgba(255,127,80,.5)',
    overviewRulerColor: 'rgba(255,127,80,1)',
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

function activate(context) {
  const lightIcon = {
    gutterIconPath: context.asAbsolutePath('images/gremlins-light.svg'),
    gutterIconSize: 'contain',
  }
  const darkIcon = {
    gutterIconPath: context.asAbsolutePath('images/gremlins-dark.svg'),
    gutterIconSize: 'contain',
  }

  vscode.window.onDidChangeActiveTextEditor(
    editor => {
      if (!editor) {
        return
      }
      updateDecorations(editor)
    },
    null,
    context.subscriptions,
  )

  vscode.window.onDidChangeTextEditorSelection(
    event => {
      if (!event.textEditor) {
        return
      }
      updateDecorations(event.textEditor)
    },
    null,
    context.subscriptions,
  )

  vscode.workspace.onDidChangeTextDocument(
    event => {
      if (!vscode.window.activeTextEditor) {
        return
      }
      updateDecorations(vscode.window.activeTextEditor)
    },
    null,
    context.subscriptions,
  )

  const gremlins = gremlinsConfig.map(gremlin => {
    let decorationType
    switch (gremlin.width) {
      case 0:
        decorationType = vscode.window.createTextEditorDecorationType({
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: gremlin.borderColor || 'darkred',
          overviewRulerColor: gremlin.overviewRulerColor || 'darkred',
          overviewRulerLane: vscode.OverviewRulerLane.Right,
          light: lightIcon,
          dark: darkIcon,
        })
        break
      case 1:
        decorationType = vscode.window.createTextEditorDecorationType({
          backgroundColor: gremlin.backgroundColor || 'rgba(255,128,128,.5)',
          overviewRulerColor: gremlin.overviewRulerColor || 'darkred',
          overviewRulerLane: vscode.OverviewRulerLane.Right,
          light: lightIcon,
          dark: darkIcon,
        })
        break
      default:
        break
    }

    return Object.assign({}, gremlin, { decorationType })
  })

  function updateDecorations(activeTextEditor) {
    if (!activeTextEditor) {
      return
    }

    const doc = activeTextEditor.document

    for (const gremlin of gremlins) {
      const decorationOption = []

      for (let lineNum = 0; lineNum < doc.lineCount; lineNum++) {
        let lineText = doc.lineAt(lineNum)
        let line = lineText.text

        let match
        while ((match = gremlin.regex.exec(line))) {
          let startPos = new vscode.Position(lineNum, match.index)
          let endPos = new vscode.Position(
            lineNum,
            match.index + match[0].length,
          )
          const decoration = {
            range: new vscode.Range(startPos, endPos),
            hoverMessage:
              match[0].length +
              ' ' +
              gremlin.message +
              (match[0].length > 1 ? 's' : '') +
              ' (unicode U+' +
              gremlin.char +
              ') here',
          }
          decorationOption.push(decoration)
        }
      }

      activeTextEditor.setDecorations(gremlin.decorationType, decorationOption)
    }
  }

  updateDecorations(vscode.window.activeTextEditor)
}
exports.activate = activate

// this method is called when your extension is deactivated
function deactivate() {}
exports.deactivate = deactivate
