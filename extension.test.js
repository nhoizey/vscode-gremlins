let mockDocument = {
  text: '',
  get lineCount() {
    return this.text.split('\n').length
  },
  lineAt(index) {
    const lines = this.text.split('\n')
    return { text: lines[index] }
  },
}

const mockSetDecorations = jest.fn()

jest.mock(
  'vscode',
  () => {
    return {
      window: {
        onDidChangeActiveTextEditor: jest.fn(),
        onDidChangeTextEditorSelection: jest.fn(),
        createTextEditorDecorationType: jest.fn(arg => arg),
        activeTextEditor: {
          document: mockDocument,
          setDecorations: mockSetDecorations,
        },
      },
      workspace: {
        onDidChangeTextDocument: jest.fn(),
        getConfiguration: jest.fn(key => {
          const packageData = require('./package.json')
          const characters =
            packageData.contributes.configuration.properties[
              'gremlins.characters'
            ].default
          const gutterIconSize =
            packageData.contributes.configuration.properties[
              'gremlins.gutterIconSize'
            ].default
          return { characters: characters, gutterIconSize: gutterIconSize }
        }),
      },
      OverviewRulerLane: { Right: 'OverviewRulerLane.Right' },
      Position: jest.fn((line, char) => {
        return { line, char }
      }),
      Range: jest.fn((left, right) => {
        return { left, right }
      }),
    }
  },
  { virtual: true },
)

const { activate } = require('./extension')
const context = {
  asAbsolutePath: arg => arg,
}

beforeEach(() => {
  jest.clearAllMocks()
})

it('shows zero width space', () => {
  mockDocument.text = 'zero width space \u200b'
  activate(context)
  expect(mockSetDecorations.mock.calls).toMatchSnapshot()
})
it('shows zero width non-joiner', () => {
  mockDocument.text = 'zero width non-joiner \u200c'
  activate(context)
  expect(mockSetDecorations.mock.calls).toMatchSnapshot()
})

it('shows non breaking space', () => {
  mockDocument.text = 'non breaking space \u00a0'
  activate(context)
  expect(mockSetDecorations.mock.calls).toMatchSnapshot()
})

it('shows left double quotation mark', () => {
  mockDocument.text = 'left double quotation mark \u201c'
  activate(context)
  expect(mockSetDecorations.mock.calls).toMatchSnapshot()
})

it('shows right double quotation mark', () => {
  mockDocument.text = 'right double quotation mark \u201d'
  activate(context)
  expect(mockSetDecorations.mock.calls).toMatchSnapshot()
})

it('shows object replacement character', () => {
  mockDocument.text = 'object replacement character \ufffc'
  activate(context)
  expect(mockSetDecorations.mock.calls).toMatchSnapshot()
})

it('shows multiple characters on multiple lines', () => {
  mockDocument.text = `
  zero width space \u200b\u200b\u200b
  zero width non-joiner \u200c\u200c\u200c
  non breaking space \u00a0\u00a0\u00a0
  left double quotation mark \u201c\u201c\u201c
  right double quotation mark \u201d\u201d\u201d
  `
  activate(context)
  expect(mockSetDecorations.mock.calls).toMatchSnapshot()
})

it('clears decorations with a clean document', () => {
  mockDocument.text = `
  zero width space \u200b\u200b\u200b
  zero width non-joiner \u200c\u200c\u200c
  non breaking space \u00a0\u00a0\u00a0
  left double quotation mark \u201c\u201c\u201c
  right double quotation mark \u201d\u201d\u201d
  `
  activate(context)
  mockSetDecorations.mockClear()

  mockDocument.text = `
  zero width space
  zero width non-joiner
  non breaking space
  left double quotation mark
  right double quotation mark
  `
  activate(context)

  expect(mockSetDecorations.mock.calls).toMatchSnapshot()
})
