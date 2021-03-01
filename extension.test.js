const configDefinition = require('./package.json').contributes.configuration

let incrementingUri = 1
const createMockDocument = (text = '') => {
  return {
    text: text,
    get lineCount() {
      return this.text.split('\n').length
    },
    lineAt(index) {
      const lines = this.text.split('\n')
      return { text: lines[index] }
    },
    uri: 'document' + incrementingUri++,
  }
}

let mockDocument = createMockDocument()
let mockVisibleDocuments = [createMockDocument(), createMockDocument()]

let mockDisposable = {
  dispose: jest.fn(),
}

let mockDecorationType = {
  dispose: jest.fn(),
}

let mockConfiguration = {}

const mockSetDecorations = jest.fn()
const mockSetDiagnostics = jest.fn()
const mockClearDiagnostics = jest.fn()
const mockDeleteDiagnostics = jest.fn()
const mockDisposeDiagnostics = jest.fn()

/**
 * Tag for use with template literals
 *
 * Finds the indentation on the first line after the opening backtick
 * and removes that indentation from every line in the template.
 * @param {String[]} strings Array of lines in the template literal
 */
function outdent(strings) {
  // Add in all of the expressions
  let outdented = strings
    .map((s, i) => `${s}${arguments[i + 1] || ''}`)
    .join('')
  // Find the indentation after the first newline
  const matches = /^\s+/.exec(outdented.split('\n')[1])
  if (matches) {
    const outdentRegex = new RegExp('\\n' + matches[0], 'g')
    outdented = outdented.replace(outdentRegex, '\n')
  }
  return outdented
}

jest.mock(
  'vscode',
  () => {
    return {
      window: {
        onDidChangeActiveTextEditor: jest.fn(() => mockDisposable),
        createTextEditorDecorationType: jest.fn(() => mockDecorationType),
        activeTextEditor: {
          document: mockDocument,
          setDecorations: mockSetDecorations,
        },
        visibleTextEditors: [
          {
            document: mockVisibleDocuments[0],
            setDecorations: jest.fn(),
          },
          {
            document: mockVisibleDocuments[1],
            setDecorations: jest.fn(),
          },
        ],
      },
      workspace: {
        onDidChangeTextDocument: jest.fn(() => mockDisposable),
        onDidCloseTextDocument: jest.fn(() => mockDisposable),
        onDidChangeConfiguration: jest.fn(() => mockDisposable),
        getConfiguration: jest.fn((key) => mockConfiguration),
      },
      languages: {
        createDiagnosticCollection: jest.fn((key) => ({
          set: mockSetDiagnostics,
          delete: mockDeleteDiagnostics,
          clear: mockClearDiagnostics,
          dispose: mockDisposeDiagnostics,
        })),
      },
      OverviewRulerLane: { Right: 'OverviewRulerLane.Right' },
      Position: jest.fn((line, char) => {
        return { line, char }
      }),
      Range: jest.fn((left, right) => {
        return { left, right }
      }),
      DiagnosticSeverity: {
        Information: 'DiagnosticSeverity.Information',
        Warning: 'DiagnosticSeverity.Warning',
        Error: 'DiagnosticSeverity.Error',
      },
    }
  },
  { virtual: true },
)

const mockVscode = require('vscode')
const { activate, deactivate } = require('./extension')
const context = {
  asAbsolutePath: (arg) => arg,
}

beforeEach(() => {
  jest.clearAllMocks()

  const characters = configDefinition.properties['gremlins.characters'].default
  const gutterIconSize = configDefinition.properties['gremlins.gutterIconSize'].default
  const showInProblemPane = true

  mockConfiguration = {
    characters: characters,
    gutterIconSize: gutterIconSize,
    showInProblemPane: showInProblemPane,
  }
})

afterEach(() => {
  deactivate()
})

describe('updateDecorations', () => {
  it('shows zero width space', () => {
    mockDocument.text = 'zero width space \u200b'
    activate(context)
    expect(mockSetDecorations.mock.calls).toMatchSnapshot()
  })

  it('shows zero width space in problems', () => {
    mockDocument.text = 'zero width space \u200b'
    activate(context)
    expect(mockSetDiagnostics.mock.calls).toMatchSnapshot()
  })

  it('shows zero width non-joiner', () => {
    mockDocument.text = 'zero width non-joiner \u200c'
    activate(context)
    expect(mockSetDecorations.mock.calls).toMatchSnapshot()
  })

  it('shows zero width non-joiner in problems', () => {
    mockDocument.text = 'zero width non-joiner \u200c'
    activate(context)
    expect(mockSetDiagnostics.mock.calls).toMatchSnapshot()
  })

  it('shows paragraph separator', () => {
    mockDocument.text = 'paragraph separator \u2029'
    activate(context)
    expect(mockSetDecorations.mock.calls).toMatchSnapshot()
  })

  it('shows paragraph separator in problems', () => {
    mockDocument.text = 'paragraph separator \u2029'
    activate(context)
    expect(mockSetDiagnostics.mock.calls).toMatchSnapshot()
  })

  it('shows non breaking space', () => {
    mockDocument.text = 'non breaking space \u00a0'
    activate(context)
    expect(mockSetDecorations.mock.calls).toMatchSnapshot()
  })

  it('shows non breaking space in problems', () => {
    mockDocument.text = 'non breaking space \u00a0'
    activate(context)
    expect(mockSetDiagnostics.mock.calls).toMatchSnapshot()
  })

  it('shows soft hyphen', () => {
    mockDocument.text = 'soft hyphen \u00ad'
    activate(context)
    expect(mockSetDecorations.mock.calls).toMatchSnapshot()
  })

  it('shows soft hyphen in problems', () => {
    mockDocument.text = 'soft hyphen \u00ad'
    activate(context)
    expect(mockSetDiagnostics.mock.calls).toMatchSnapshot()
  })

  it('shows left double quotation mark', () => {
    mockDocument.text = 'left double quotation mark \u201c'
    activate(context)
    expect(mockSetDecorations.mock.calls).toMatchSnapshot()
  })

  it('shows left double quotation mark in problems', () => {
    mockDocument.text = 'left double quotation mark \u201c'
    activate(context)
    expect(mockSetDiagnostics.mock.calls).toMatchSnapshot()
  })

  it('shows right double quotation mark', () => {
    mockDocument.text = 'right double quotation mark \u201d'
    activate(context)
    expect(mockSetDecorations.mock.calls).toMatchSnapshot()
  })

  it('shows right double quotation mark in problems', () => {
    mockDocument.text = 'right double quotation mark \u201d'
    activate(context)
    expect(mockSetDiagnostics.mock.calls).toMatchSnapshot()
  })

  it('shows object replacement character', () => {
    mockDocument.text = 'object replacement character \ufffc'
    activate(context)
    expect(mockSetDecorations.mock.calls).toMatchSnapshot()
  })

  it('shows object replacement character in problems', () => {
    mockDocument.text = 'object replacement character \ufffc'
    activate(context)
    expect(mockSetDiagnostics.mock.calls).toMatchSnapshot()
  })

  it('shows multiple characters on multiple lines', () => {
    mockDocument.text = outdent`
    zero width space \u200b\u200b\u200b
    zero width non-joiner \u200c\u200c\u200c
    paragraph separator \u2029\u2029\u2029
    non breaking space \u00a0\u00a0\u00a0
    left double quotation mark \u201c\u201c\u201c
    right double quotation mark \u201d\u201d\u201d
    `
    activate(context)
    expect(mockSetDecorations.mock.calls).toMatchSnapshot()
  })

  it('shows multiple characters on multiple lines in problems', () => {
    mockDocument.text = outdent`
    zero width space \u200b\u200b\u200b
    zero width non-joiner \u200c\u200c\u200c
    paragraph separator \u2029\u2029\u2029
    non breaking space \u00a0\u00a0\u00a0
    left double quotation mark \u201c\u201c\u201c
    right double quotation mark \u201d\u201d\u201d
    `
    activate(context)
    expect(mockSetDiagnostics.mock.calls).toMatchSnapshot()
  })

  it('clears decorations with a clean document', () => {
    mockDocument.text = outdent`
    zero width space \u200b\u200b\u200b
    zero width non-joiner \u200c\u200c\u200c
    paragraph separator \u2029\u2029\u2029
    non breaking space \u00a0\u00a0\u00a0
    left double quotation mark \u201c\u201c\u201c
    right double quotation mark \u201d\u201d\u201d
    `
    activate(context)
    mockSetDecorations.mockClear()

    mockDocument.text = outdent`
    zero width space
    zero width non-joiner
    paragraph separator
    non breaking space
    left double quotation mark
    right double quotation mark
    `
    activate(context)

    expect(mockSetDecorations.mock.calls).toMatchSnapshot()
  })

  it('clears problems with a clean document', () => {
    mockDocument.text = outdent`
    zero width space \u200b\u200b\u200b
    zero width non-joiner \u200c\u200c\u200c
    paragraph separator \u2029\u2029\u2029
    non breaking space \u00a0\u00a0\u00a0
    left double quotation mark \u201c\u201c\u201c
    right double quotation mark \u201d\u201d\u201d
    `
    activate(context)
    mockSetDiagnostics.mockClear()

    mockDocument.text = outdent`
    zero width space
    zero width non-joiner
    paragraph separator
    non breaking space
    left double quotation mark
    right double quotation mark
    `
    activate(context)

    expect(mockSetDiagnostics.mock.calls).toMatchSnapshot()
  })
})

describe('lifecycle registration', () => {
  it('registers with window.onDidChangeActiveTextEditor', () => {
    activate(context)

    expect(
      mockVscode.window.onDidChangeActiveTextEditor.mock.calls,
    ).toMatchSnapshot()
  })

  it('registers with workspace.onDidChangeTextDocument', () => {
    activate(context)

    expect(
      mockVscode.workspace.onDidChangeTextDocument.mock.calls,
    ).toMatchSnapshot()
  })

  it('registers with workspace.onDidCloseTextDocument', () => {
    activate(context)

    expect(
      mockVscode.workspace.onDidCloseTextDocument.mock.calls,
    ).toMatchSnapshot()
  })

  it('registers with workspace.onDidChangeConfiguration', () => {
    activate(context)

    expect(
      mockVscode.workspace.onDidChangeConfiguration.mock.calls,
    ).toMatchSnapshot()
  })
})

describe('lifecycle event handling', () => {
  function getEventHandlers(object) {
    return Object.keys(object)
      .filter((key) => key.startsWith('on'))
      .reduce((handlers, nextKey) => {
        handlers[nextKey] = object[nextKey].mock.calls[0][0]
        return handlers
      }, {})
  }

  let eventHandlers = {}
  beforeEach(() => {
    activate(context)
    mockDocument.text = 'zero width space \u200b'
    eventHandlers = {
      window: getEventHandlers(mockVscode.window),
      workspace: getEventHandlers(mockVscode.workspace),
    }
    jest.clearAllMocks()
  })

  it('processes new file on window.onDidChangeActiveTextEditor', () => {
    const newMockEditor = {
      document: createMockDocument('zero width space \u200b'),
      setDecorations: mockSetDecorations,
    }

    eventHandlers.window.onDidChangeActiveTextEditor(newMockEditor)

    expect(mockSetDecorations.mock.calls).toMatchSnapshot()
    expect(mockSetDiagnostics.mock.calls).toMatchSnapshot()
  })

  it('does NOT process already-processed file on window.onDidChangeActiveTextEditor', () => {
    eventHandlers.window.onDidChangeActiveTextEditor(
      mockVscode.window.activeTextEditor,
    )

    expect(mockSetDiagnostics.mock.calls.length).toBe(0)
  })

  it('re-paints gremlins for already-processed file on window.onDidChangeActiveTextEditor', () => {
    eventHandlers.window.onDidChangeActiveTextEditor(
      mockVscode.window.activeTextEditor,
    )

    expect(mockSetDecorations.mock.calls.length).toBe(1)
    expect(mockSetDecorations.mock.calls).toMatchSnapshot()
  })

  it('processes new file on workspace.onDidChangeTextDocument', () => {
    eventHandlers.workspace.onDidChangeTextDocument()

    expect(mockSetDecorations.mock.calls).toMatchSnapshot()
    expect(mockSetDiagnostics.mock.calls).toMatchSnapshot()
  })

  it('clears diagnostics on workspace.onDidCloseTextDocument', () => {
    eventHandlers.workspace.onDidCloseTextDocument({ uri: 'someUri' })

    expect(mockClearDiagnostics.calls).toMatchSnapshot()
  })

  it('processes visible text editors on workspace.onDidChangeConfiguration', () => {
    eventHandlers.workspace.onDidChangeConfiguration({
      affectsConfiguration: jest.fn((arg) => true),
    })

    expect(mockSetDecorations.mock.calls.length).toBe(0)
    mockVscode.window.visibleTextEditors.forEach((editor) => {
      expect(editor.setDecorations.mock.calls).toMatchSnapshot()
    })
    expect(mockSetDiagnostics.mock.calls).toMatchSnapshot()
  })
})

describe('deactivate', () => {
  beforeEach(() => {
    activate(context)
  })

  it('clears and then disposes diagnostics', () => {
    deactivate()

    const clearCallOrder = mockClearDiagnostics.mock.invocationCallOrder[0]
    const disposeCallOrder = mockDisposeDiagnostics.mock.invocationCallOrder[0]
    expect(clearCallOrder).toBeLessThan(disposeCallOrder)
  })

  it('disposes event handlers', () => {
    const totalEvents = 4

    deactivate()

    expect(mockDisposable.dispose.mock.calls.length).toBe(totalEvents)
  })

  it('disposes decorationTypes', () => {
    deactivate()

    expect(mockDecorationType.dispose.mock.calls.length).toBe(
      mockVscode.window.createTextEditorDecorationType.mock.calls.length,
    )
  })
})

describe('configuration', () => {
  describe('level', () => {
    it('setting level to none prevents decoration from being displayed', () => {
      // Default is to display decoration
      mockDocument.text = 'zero width space \u200b'
      activate(context)
      expect(mockSetDecorations.mock.calls).toMatchSnapshot()

      // When overriding level to 'none'
      mockSetDecorations.mockClear()
      mockConfiguration.characters['200b'].level = 'none'
      const configChangeHandler = mockVscode.workspace.onDidChangeConfiguration.mock.calls[0][0]
      configChangeHandler({ affectsConfiguration: () => true})

      // Decoration is no longer displayed
      expect(mockSetDecorations.mock.calls).toMatchSnapshot()
    })
    
    it('setting level to none prevents decoration from being displayed', () => {
      // Default is to create diagnostic
      mockDocument.text = 'zero width space \u200b'
      activate(context)
      expect(mockSetDiagnostics.mock.calls).toMatchSnapshot()

      // When overriding level to 'none'
      mockSetDecorations.mockClear()
      mockConfiguration.characters['200b'].level = 'none'
      const configChangeHandler = mockVscode.workspace.onDidChangeConfiguration.mock.calls[0][0]
      configChangeHandler({ affectsConfiguration: () => true})

      // Diagnostic is no longer created
      expect(mockSetDiagnostics.mock.calls).toMatchSnapshot()
    })
  })
})