var vscode = require('vscode')

function activate(context) {
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

  const zeroWidthSpaceDecorationType = vscode.window.createTextEditorDecorationType(
    {
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'red',
      overviewRulerColor: 'darkred',
      overviewRulerLane: vscode.OverviewRulerLane.Right,
      light: {
        gutterIconPath: context.asAbsolutePath('images/gremlins-light.svg'),
      },
      dark: {
        gutterIconPath: context.asAbsolutePath('images/gremlins-dark.svg'),
      },
      gutterIconSize: 'contain',
    },
  )

  const nonBreakingSpaceDecorationType = vscode.window.createTextEditorDecorationType(
    {
      backgroundColor: 'rgba(255,128,128,.5)',
      overviewRulerColor: 'darkred',
      overviewRulerLane: vscode.OverviewRulerLane.Right,
      light: {
        gutterIconPath: context.asAbsolutePath('images/gremlins-light.svg'),
      },
      dark: {
        gutterIconPath: context.asAbsolutePath('images/gremlins-dark.svg'),
      },
      gutterIconSize: 'contain',
    },
  )

  function updateDecorations(activeTextEditor) {
    if (!activeTextEditor) {
      return
    }

    const zeroWidthSpaceRegEx = /\u200b+/g
    const nonBreakingSpaceRegEx = /\u00a0+/g

    const doc = activeTextEditor.document
    const decorationOptions = {
      zeroWidthSpace: [],
      nonBreakingSpace: [],
    }
    for (let i = 0; i < doc.lineCount; i++) {
      let lineText = doc.lineAt(i)
      let line = lineText.text
      let match
      while ((match = zeroWidthSpaceRegEx.exec(line))) {
        let startPos = new vscode.Position(i, match.index)
        let endPos = new vscode.Position(i, match.index + match[0].length)
        const decoration = {
          range: new vscode.Range(startPos, endPos),
          hoverMessage:
            match[0].length +
            ' zero-width space' +
            (match[0].length > 1 ? 's' : '') +
            ' (unicode U+200b) here',
        }
        decorationOptions.zeroWidthSpace.push(decoration)
      }
      while ((match = nonBreakingSpaceRegEx.exec(line))) {
        let startPos = new vscode.Position(i, match.index)
        let endPos = new vscode.Position(i, match.index + match[0].length)
        const decoration = {
          range: new vscode.Range(startPos, endPos),
          hoverMessage:
            match[0].length +
            ' non-breaking space' +
            (match[0].length > 1 ? 's' : '') +
            ' (unicode U+00a0) here',
        }
        decorationOptions.nonBreakingSpace.push(decoration)
      }
    }

    activeTextEditor.setDecorations(
      zeroWidthSpaceDecorationType,
      decorationOptions.zeroWidthSpace,
    )
    activeTextEditor.setDecorations(
      nonBreakingSpaceDecorationType,
      decorationOptions.nonBreakingSpace,
    )
  }

  updateDecorations(vscode.window.activeTextEditor)
}
exports.activate = activate

// this method is called when your extension is deactivated
function deactivate() {}
exports.deactivate = deactivate
