var vscode = require('vscode');

function activate(context) {
    vscode.window.onDidChangeActiveTextEditor(editor => {
        if (!editor) {
            return;
        }
        updateDecorations(editor);
    }, null, context.subscriptions);

    vscode.window.onDidChangeTextEditorSelection(event => {
        if (!event.textEditor) {
            console.error("onDidChangeTextEditorSelection(" + event + "): no active text editor.");
            return;
        }
        updateDecorations(event.textEditor);
    }, null, context.subscriptions);

    vscode.workspace.onDidChangeTextDocument(event => {
        if (!vscode.window.activeTextEditor) {
            console.error("onDidChangeTextDocument(" + event + "): no active text editor.");
            return;
        }
        updateDecorations(vscode.window.activeTextEditor);
    }, null, context.subscriptions);

    const zeroWidthSpaceDecorationType = vscode.window.createTextEditorDecorationType({
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
        gutterIconSize: 'contain'
    });

    function updateDecorations(activeTextEditor) {
        if (!activeTextEditor) {
            console.error("updateDecorations(): no active text editor.");
            return;
        }

        const regEx = /\u200b+/g;
        const doc = activeTextEditor.document;
        const decorationOptions = [];
        for (let i = 0; i < doc.lineCount; i++) {
            let lineText = doc.lineAt(i);
            let line = lineText.text;
            if (i === activeTextEditor.selection.active.line) {
                continue;
            }

            let match;
            while (match = regEx.exec(line)) {
                let startPos = new vscode.Position(i, match.index);
                let endPos = new vscode.Position(i, match.index + match[0].length);
                const decoration = { range: new vscode.Range(startPos, endPos), hoverMessage: match[0].length + " zero-width space" + (match[0].length > 1 ? "s" : "") + " (unicode U+200B) here"};
                decorationOptions.push(decoration);
            }
        }
        activeTextEditor.setDecorations(zeroWidthSpaceDecorationType, decorationOptions);
    }

    updateDecorations(vscode.window.activeTextEditor);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;