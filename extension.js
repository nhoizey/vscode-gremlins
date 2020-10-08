var vscode = require('vscode')

const GREMLINS = 'gremlins'

const GREMLINS_LEVELS = {
  NONE: 'none',
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
}

const GREMLINS_SEVERITIES = {
  [GREMLINS_LEVELS.INFO]: vscode.DiagnosticSeverity.Information,
  [GREMLINS_LEVELS.WARNING]: vscode.DiagnosticSeverity.Warning,
  [GREMLINS_LEVELS.ERROR]: vscode.DiagnosticSeverity.Error,
}

const gremlinsDefaultColor = 'rgba(169, 68, 66, .75)'

const eventListeners = []

let decorationTypes = {}

let processedDocuments = {}

let configuration = null

let diagnosticCollection = null

function configureDiagnosticsCollection(showDiagnostics) {
  if (showDiagnostics && !diagnosticCollection) {
    diagnosticCollection = diagnosticCollection = vscode.languages.createDiagnosticCollection(
      GREMLINS,
    )
  } else if (!showDiagnostics && diagnosticCollection) {
    diagnosticCollection.clear()
    diagnosticCollection.dispose()
    diagnosticCollection = null
  }
  return diagnosticCollection
}

function disposeDecorationTypes() {
  Object.entries(decorationTypes).forEach(([key, decorationType]) => {
    decorationType.dispose()
  })
  decorationTypes = {}
}

function loadConfiguration(context) {
  const gremlinsConfiguration = vscode.workspace.getConfiguration(GREMLINS)

  const gremlins = gremlinsFromConfig(gremlinsConfiguration, context)

  const showDiagnostics = vscode.workspace.getConfiguration(GREMLINS)
    .showInProblemPane
  const diagnosticCollection = configureDiagnosticsCollection(showDiagnostics)

  let regexpWithAllChars = new RegExp(
    Object.keys(gremlins)
      .map((char) => `${char}+`)
      .join('|'),
    'g',
  )

  const dispose = () => {
    if (diagnosticCollection) {
      diagnosticCollection.clear()
      diagnosticCollection.dispose()
    }
    disposeDecorationTypes()
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
    const severityLevel = (config.level ? config.level.toLowerCase() : GREMLINS_LEVELS.ERROR)
    if (severityLevel === GREMLINS_LEVELS.NONE) {
      // Ignore gremlins marked as "none"
      continue;
    }
    
    let decorationType = {
      light: config.hideGutterIcon ? {} : lightIcon,
      dark: config.hideGutterIcon ? {} : darkIcon,
      overviewRulerColor: config.overviewRulerColor || gremlinsDefaultColor,
      overviewRulerLane: vscode.OverviewRulerLane.Right,
    }

    if (config.zeroWidth) {
      decorationType.borderWidth = '1px'
      decorationType.borderStyle = 'solid'
      decorationType.borderColor = gremlinsLevels[severityLevel]
    } else {
      decorationType.backgroundColor = gremlinsLevels[severityLevel]
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
          decorationType: cachedDecorationType(decorationType),
        })
      }
    } else {
      // This is a single character
      gremlins[charFromHex(hexCodePoint)] = Object.assign({}, config, {
        hexCodePoint,
        decorationType: cachedDecorationType(decorationType),
      })
    }
  }

  return gremlins
}

function cachedDecorationType(decorationType) {
  const cacheKey = JSON.stringify(decorationType)
  if (!decorationTypes[cacheKey]) {
    decorationTypes[cacheKey] = vscode.window.createTextEditorDecorationType(
      decorationType,
    )
  }
  return decorationTypes[cacheKey]
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
function checkForGremlins(
  activeTextEditor,
  gremlins,
  regexpWithAllChars,
  diagnosticCollection,
) {
  if (!activeTextEditor) {
    return
  }

  const doc = activeTextEditor.document

  const decorationOption = {}
  for (const char in gremlins) {
    decorationOption[char] = []
  }
  /** vscode.Diagnostic[] */
  let diagnostics = []

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
          source: 'Gremlins tracker',
        }
        diagnostics.push(diagnostic)
      }
    }
  }

  const decorations = groupDecorationsByType(gremlins, decorationOption)

  drawDecorations(activeTextEditor, decorations)

  if (diagnosticCollection) {
    diagnosticCollection.set(activeTextEditor.document.uri, diagnostics)
  }

  processedDocuments[activeTextEditor.document.uri] = { decorations }
}

function groupDecorationsByType(gremlins, decorationOption) {
  return Object.entries(gremlins).reduce((obj, [char, gremlin]) => {
    const decorationType = gremlin.decorationType,
      options = decorationOption[char]

    if (!obj.hasOwnProperty(decorationType.key)) {
      obj[decorationType.key] = {
        decorationType: decorationType,
        options: options,
      }
    } else {
      obj[decorationType.key].options = obj[decorationType.key].options.concat(
        options,
      )
    }
    return obj
  }, {})
}

function drawDecorations(activeTextEditor, decorations) {
  for (const { decorationType, options } of Object.values(decorations)) {
    activeTextEditor.setDecorations(decorationType, options)
  }
}

function activate(context) {
  configuration = loadConfiguration(context)

  const doCheckForGremlins = (editor) =>
    checkForGremlins(
      editor,
      configuration.gremlins,
      configuration.regexpWithAllChars,
      configuration.diagnosticCollection,
    )

  eventListeners.push(
    vscode.workspace.onDidChangeConfiguration(
      (event) => {
        if (event.affectsConfiguration(GREMLINS)) {
          disposeDecorationTypes()
          processedDocuments = {}

          configuration = loadConfiguration(context)
          vscode.window.visibleTextEditors.forEach((editor) =>
            doCheckForGremlins(editor),
          )
        }
      },
      null,
      context.subscriptions,
    ),
  )

  eventListeners.push(
    vscode.window.onDidChangeActiveTextEditor(
      (editor) => {
        if (editor) {
          const processedDocument = processedDocuments[editor.document.uri]
          if (!processedDocument) {
            doCheckForGremlins(editor)
          } else {
            drawDecorations(editor, processedDocument.decorations)
          }
        }
      },
      null,
      context.subscriptions,
    ),
  )

  eventListeners.push(
    vscode.workspace.onDidChangeTextDocument(
      (_event) => doCheckForGremlins(vscode.window.activeTextEditor),
      null,
      context.subscriptions,
    ),
  )

  eventListeners.push(
    vscode.workspace.onDidCloseTextDocument(
      (textDocument) => {
        diagnosticCollection && diagnosticCollection.delete(textDocument.uri)
        delete processedDocuments[textDocument.uri]
      },
      null,
      context.subscriptions,
    ),
  )

  doCheckForGremlins(vscode.window.activeTextEditor)
}
exports.activate = activate

// this method is called when your extension is deactivated
function deactivate() {
  configuration.dispose()

  eventListeners.forEach((listener) => listener.dispose())
  eventListeners.length = 0
}
exports.deactivate = deactivate
