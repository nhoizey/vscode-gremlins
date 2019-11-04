var vscode = require('vscode')

const gremlinsDefaultColor = 'rgba(169, 68, 66, .75)'

const GREMLINS = 'gremlins';

const GREMLINS_LEVELS = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
}

const GREMLINS_SEVERITIES = {
  [GREMLINS_LEVELS.INFO]: vscode.DiagnosticSeverity.Information,
  [GREMLINS_LEVELS.WARNING]: vscode.DiagnosticSeverity.Warning,
  [GREMLINS_LEVELS.ERROR]: vscode.DiagnosticSeverity.Error,
}

const eventListeners = []

let configuration = null

let diagnosticCollection = null

function configureDiagnosticsCollection(showDiagnostics) {
  if (showDiagnostics && !diagnosticCollection) {
    diagnosticCollection = diagnosticCollection = vscode.languages.createDiagnosticCollection(GREMLINS)
  } else if (!showDiagnostics && diagnosticCollection) {
    diagnosticCollection.clear()
    diagnosticCollection.dispose()
    diagnosticCollection = null
  }
  return diagnosticCollection
}

function disposeDecorationTypes(gremlins) {
  Object.entries(gremlins).forEach(([key, config]) => {
    config.decorationType.dispose()
    delete gremlins[key]
  })
}

function loadConfiguration(context) {
  const gremlinsConfiguration = vscode.workspace.getConfiguration(GREMLINS)

  const gremlins = gremlinsFromConfig(gremlinsConfiguration, context)

  const showDiagnostics = vscode.workspace.getConfiguration(GREMLINS).showInProblemPane
  const diagnosticCollection = configureDiagnosticsCollection(showDiagnostics)

  let regexpWithAllChars = new RegExp(
    Object.keys(gremlins)
      .map(char => `${char}+`)
      .join('|'),
    'g',
  )

  const dispose = () => {
    if (diagnosticCollection) {
      diagnosticCollection.clear()
      diagnosticCollection.dispose()
    }
    disposeDecorationTypes(gremlins)
  }

  return {
    gremlins,
    regexpWithAllChars,
    diagnosticCollection,
    dispose,
  }
}

function gremlinsFromConfig(gremlinsConfiguration, context) {
  const gremlinsLevels = {
    [GREMLINS_LEVELS.INFO]: gremlinsConfiguration.color_info,
    [GREMLINS_LEVELS.WARNING]: gremlinsConfiguration.color_warning,
    [GREMLINS_LEVELS.ERROR]: gremlinsConfiguration.color_error,
  }
  const gremlinsCharacters = gremlinsConfiguration.characters
  const gutterIconSize = gremlinsConfiguration.gutterIconSize
  const hexCodePointsRangeRegex = /^([0-9a-f]+)(?:-([0-9a-f]+))?$/i

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

/**
 * 
 * @param {vscode.TextEditor} activeTextEditor 
 * @param {*} gremlins 
 * @param {RegExp} regexpWithAllChars 
 * @param {vscode.DiagnosticCollection} diagnosticCollection
 */
function updateDecorations(activeTextEditor, gremlins, regexpWithAllChars, diagnosticCollection) {
  if (!activeTextEditor) {
    return
  }

  const doc = activeTextEditor.document

  const decorationOption = {}
  for (const char in gremlins) {
    decorationOption[char] = []
  }
  /** vscode.Diagnostic[] */
  let diagnostics = [];

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
      
      if (diagnosticCollection) {
        const severity = GREMLINS_SEVERITIES[gremlin.level]
        const diagnostic = {
          range: decoration.range,
          message: decoration.hoverMessage,
          severity: severity,
          source: "Gremlins tracker",
        }
        diagnostics.push(diagnostic)
      }
    }
  }

  for (const [char, gremlin] of Object.entries(gremlins)) {
    activeTextEditor.setDecorations(
      gremlin.decorationType,
      decorationOption[char],
    )
  }

  if (diagnosticCollection) {
    diagnosticCollection.set(activeTextEditor.document.uri, diagnostics)
  }
}

function activate(context) {
  configuration = loadConfiguration(context)

  const doUpdateDecorations = editor => updateDecorations(
    editor,
    configuration.gremlins,
    configuration.regexpWithAllChars,
    configuration.diagnosticCollection,
  )

  eventListeners.push(
    vscode.workspace.onDidChangeConfiguration(
      event => {
        if (event.affectsConfiguration(GREMLINS)) {
          disposeDecorationTypes(configuration.gremlins)

          configuration = loadConfiguration(context)
          vscode.window.visibleTextEditors.forEach(editor => doUpdateDecorations(editor))
        }
      },
      null,
      context.subscriptions
    )
  )

  eventListeners.push(
    vscode.window.onDidChangeActiveTextEditor(
      editor => doUpdateDecorations(editor),
      null,
      context.subscriptions,
    )
  )

  eventListeners.push(
    vscode.window.onDidChangeTextEditorSelection(
      event => doUpdateDecorations(event.textEditor),
      null,
      context.subscriptions,
    )
  )

  eventListeners.push(
    vscode.workspace.onDidChangeTextDocument(
      event => doUpdateDecorations(vscode.window.activeTextEditor),
      null,
      context.subscriptions,
    )
  )

  eventListeners.push(
    vscode.workspace.onDidCloseTextDocument(
      textDocument => diagnosticCollection && diagnosticCollection.delete(textDocument.uri),
      null,
      context.subscriptions
    )
  )

  doUpdateDecorations(vscode.window.activeTextEditor)
}
exports.activate = activate

// this method is called when your extension is deactivated
function deactivate() {
  configuration.dispose()

  eventListeners.forEach(listener => listener.dispose())
  eventListeners.length = 0
}
exports.deactivate = deactivate
