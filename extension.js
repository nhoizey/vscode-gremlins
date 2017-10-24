var vscode = require('vscode')

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

  let decorationTypes = new Array()
  for (let i = 0; i < gremlins.length; i++) {
    switch (gremlins[i].width) {
      case 0:
        decorationTypes[i] = vscode.window.createTextEditorDecorationType({
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: gremlins[i].borderColor || 'darkred',
          overviewRulerColor: gremlins[i].overviewRulerColor || 'darkred',
          overviewRulerLane: vscode.OverviewRulerLane.Right,
          light: lightIcon,
          dark: darkIcon,
        })
        break
      case 1:
        decorationTypes[i] = vscode.window.createTextEditorDecorationType({
          backgroundColor:
            gremlins[i].backgroundColor || 'rgba(255,128,128,.5)',
          overviewRulerColor: gremlins[i].overviewRulerColor || 'darkred',
          overviewRulerLane: vscode.OverviewRulerLane.Right,
          light: lightIcon,
          dark: darkIcon,
        })
        break
      default:
        break
    }
  }

  function updateDecorations(activeTextEditor) {
    if (!activeTextEditor) {
      return
    }

    const doc = activeTextEditor.document

    let decorationOptions = new Array()
    for (let i = 0; i < gremlins.length; i++) {
      decorationOptions[i] = new Array()
    }
    for (let lineNum = 0; lineNum < doc.lineCount; lineNum++) {
      let lineText = doc.lineAt(lineNum)
      let line = lineText.text
      let match
      for (let i = 0; i < gremlins.length; i++) {
        while ((match = gremlins[i].regex.exec(line))) {
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
              gremlins[i].message +
              (match[0].length > 1 ? 's' : '') +
              ' (unicode U+' +
              gremlins[i].char +
              ') here',
          }
          decorationOptions[i].push(decoration)
        }
      }
    }

    for (let i = 0; i < gremlins.length; i++) {
      activeTextEditor.setDecorations(decorationTypes[i], decorationOptions[i])
    }
  }

  updateDecorations(vscode.window.activeTextEditor)
}
exports.activate = activate

// this method is called when your extension is deactivated
function deactivate() {}
exports.deactivate = deactivate
