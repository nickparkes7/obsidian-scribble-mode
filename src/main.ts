import { Plugin } from 'obsidian';

const BODY_CLASS = 'scribble-mode';

interface ScribbleModeSettings {
	enabled: boolean;
}

const DEFAULT_SETTINGS: ScribbleModeSettings = {
	enabled: false,
};

export default class ScribbleModePlugin extends Plugin {
	settings: ScribbleModeSettings = DEFAULT_SETTINGS;
	private statusBarEl: HTMLElement | null = null;

	async onload() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, (await this.loadData()) as Partial<ScribbleModeSettings> | null);

		this.statusBarEl = this.addStatusBarItem();
		this.statusBarEl.setText('〰 Scribble');
		this.statusBarEl.addClass('mod-clickable');
		this.statusBarEl.setAttribute('aria-label', 'Turn off scribble mode');
		this.registerDomEvent(this.statusBarEl, 'click', () => void this.toggle());

		this.addRibbonIcon('pen-line', 'Toggle scribble mode', () => void this.toggle());

		this.addCommand({
			id: 'toggle',
			name: 'Toggle on or off',
			callback: () => void this.toggle(),
		});

		// Pop-out windows have their own document, so they need the class too.
		this.registerEvent(
			this.app.workspace.on('window-open', (win) => {
				win.doc.body.toggleClass(BODY_CLASS, this.settings.enabled);
			}),
		);

		this.apply();
	}

	onunload() {
		this.forEachDocument((doc) => doc.body.removeClass(BODY_CLASS));
	}

	private async toggle() {
		this.settings.enabled = !this.settings.enabled;
		this.apply();
		await this.saveData(this.settings);
	}

	private apply() {
		const { enabled } = this.settings;
		this.forEachDocument((doc) => doc.body.toggleClass(BODY_CLASS, enabled));
		this.statusBarEl?.toggle(enabled);
	}

	private forEachDocument(callback: (doc: Document) => void) {
		callback(document);
		this.app.workspace.iterateAllLeaves((leaf) => {
			const doc = leaf.view.containerEl.ownerDocument;
			if (doc !== document) callback(doc);
		});
	}
}
