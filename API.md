# OpenSCD core API

## Overview

**OpenSCD** is a plugin-based editor for editing XML files in the IEC 61850-6 "SCL" dialect directly in the browser.

**OpenSCD core** is the central supervisory component which coordinates the work of all the plugins, allowing them to work together in editing the same SCL document.

An **OpenSCD plugin** is a [JavaScript module](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) which exports a particular [custom element class](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements#implementing_a_custom_element) as its [default export](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules#default_exports_versus_named_exports). OpenSCD core imports the module, registers its custom element under a uniquely generated tag name, and finally renders a new element with that tag name into the app.

An **OpenSCD menu plugin** is an OpenSCD plugin with an additional `run()` instance method which is called when the plugin's entry is clicked in OpenSCD's menu. It is continuously rendered into the app and is expected to normally not display any content of its own. It is meant for one-shot editing tasks or tasks that always run in the background (like validation).

An **OpenSCD editor plugin** is a modal OpenSCD plugin that is only rendered as long as the user has its tab selected in OpenSCD's tab bar. It is meant for rendering the main part of OpenSCD's user interface.

The **OpenSCD core API** is:
- the way in which OpenSCD core communicates relevant data to the plugins and
- the way in which plugins communicate user intent to OpenSCD core.
- the way in which OpenSCD sets CSS fonts and colors for plugins

## Communicating data to plugins

OpenSCD core communicates the data necessary for editing SCL documents by setting the following [properties](https://developer.mozilla.org/en-US/docs/Glossary/Property/JavaScript) on the plugin's [DOM Element](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement):


```typescript
export default class Plugin extends LitElement {
  docs: Record<string, XMLDocument> = {};
  doc?: XMLDocument;
  docName?: string;
  editable: string[] = [
    'cid',
    'icd',
    'iid',
    'scd',
    'sed',
    'ssd',
  ];
  history: LogEntry[];
  editCount: number = 0;
  plugins: { menu: Plugin[], editor: Plugin[] }[];
  locale: string = 'en';
}

/** Helper types exported by OpenSCD core **/

type LogEntry = {
  redo: Edit; // `Edit` defined below
  undo: Edit;
  title?: string
}

type Plugin = {
  name: string;
  translations?: Record<string, string>;
  src: string;
  icon: string;
  requireDoc?: boolean; // disable plugin if no doc is opened
}
```

### `docs`

`docs` is set to an object mapping `string` keys (document names) to `XMLDocument` values.

### `docName`
The name of the `XMLDocument` currently being edited.

### `doc`
The `XMLDocument` currently being edited.

### `editable`
Filename extensions of user-editable documents.

### `history`
History of edits done to `doc`.

### `editCount`

Index of the current log entry in the `history`. Is incremented with every new edit and updated on undo/redo. 

### `plugins`

Arrays of `Plugin` objects describing the currently loaded `menu` and `editor` plugins, respectively.

### `locale`

Selected language (IETF language tag).

## Communicating user intent to OpenSCD core

Plugins communicate user intent to OpenSCD core by dispatching the following [custom events](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent):

### `EditEventV2`

The **edit event** allows a plugin to describe the changes it wants to make to the current `doc`.

```typescript
export type EditDetailV2<E extends Edit = Edit> = {
  edit: E;
  title?: string;
  squash?: boolean;
}

export type EditEventV2<E extends Edit = Edit> = CustomEvent<EditDetailV2<E>>;

export type EditEventOptions = {
  title?: string;
  squash?: boolean;
}

export function newEditEventV2<E extends Edit>(edit: E, options: EditEventOptions): EditEventV2<E> {
  return new CustomEvent<E>('oscd-edit-v2', {
    composed: true,
    bubbles: true,
    detail: {...options, edit},
  });
}

declare global {
  interface ElementEventMap {
    ['oscd-edit-v2']: EditEventV2;
  }
}
```

Its `title` property is a human-readable description of the edit, and `squash` is a boolean indicating whether the edit should be merged with the previous edit in the history.

#### `Edit` type

The `EditDetailV2` defined above contains an `edit` of this type:

```typescript
export type Edit = Insert | SetAttributes | SetTextContent | Remove | Edit[];
```

This means that a single edit can either consist in a sequence of other edits or in one of the following atomic edit types:

> Intent to set or remove (if null) attributes on `element`.
```typescript
export type SetAttributes = {
  element: Element;
  attributes: Partial<Record<string, string | null>>;
  attributesNS: Partial<Record<string, Partial<Record<string, string | null>>>>;
};
```

> Intent to set the `textContent` of `element`.
```typescript
export type SetTextContent = {
  element: Element;
  textContent: string | null;
};
```

> Intent to `parent.insertBefore(node, reference)`
```typescript
export type Insert = {
  parent: Node;
  node: Node;
  reference: Node | null;
};
```

> Intent to remove a `node` from its `ownerDocument`.
```typescript
export type Remove = {
  node: Node;
};
```


### `OpenEvent`

The **open event** allows a plugin to add a document `doc` to the `docs` collection under the name `docName`.

```typescript
export type OpenDetail = {
  doc: XMLDocument;
  docName: string;
};

export type OpenEvent = CustomEvent<OpenDetail>;

export function newOpenEvent(doc: XMLDocument, docName: string): OpenEvent {
  return new CustomEvent<OpenDetail>('oscd-open', {
    bubbles: true,
    composed: true,
    detail: { doc, docName },
  });
}

declare global {
  interface ElementEventMap {
    ['oscd-open']: OpenEvent;
  }
}
```

### `WizardEvent`

The **wizard event** allows the plugin to request opening a modal dialog enabling the user to edit an arbitrary SCL `element`, regardless of how the dialog for editing this particular type of element looks and works.

```typescript
/* eslint-disable no-undef */
interface WizardRequestBase {
  subWizard?: boolean;
}

export interface EditWizardRequest extends WizardRequestBase {
  element: Element;
}

export interface CreateWizardRequest extends WizardRequestBase {
  parent: Element;
  tagName: string;
}

export type WizardRequest = EditWizardRequest | CreateWizardRequest;

type EditWizardEvent = CustomEvent<EditWizardRequest>;
type CreateWizardEvent = CustomEvent<CreateWizardRequest>;
export type WizardEvent = EditWizardEvent | CreateWizardEvent;

type CloseWizardEvent = CustomEvent<WizardRequest>;

export function newEditWizardEvent(
  element: Element,
  subWizard?: boolean,
  eventInitDict?: CustomEventInit<Partial<EditWizardRequest>>
): EditWizardEvent {
  return new CustomEvent<EditWizardRequest>('oscd-edit-wizard-request', {
    bubbles: true,
    composed: true,
    ...eventInitDict,
    detail: { element, subWizard, ...eventInitDict?.detail },
  });
}

export function newCreateWizardEvent(
  parent: Element,
  tagName: string,
  subWizard?: boolean,
  eventInitDict?: CustomEventInit<Partial<CreateWizardRequest>>
): CreateWizardEvent {
  return new CustomEvent<CreateWizardRequest>('oscd-create-wizard-request', {
    bubbles: true,
    composed: true,
    ...eventInitDict,
    detail: {
      parent,
      tagName,
      subWizard,
      ...eventInitDict?.detail,
    },
  });
}

export function newCloseWizardEvent(
  wizard: WizardRequest,
  eventInitDict?: CustomEventInit<Partial<WizardRequest>>
): CloseWizardEvent {
  return new CustomEvent<WizardRequest>('oscd-close-wizard', {
    bubbles: true,
    composed: true,
    ...eventInitDict,
    detail: wizard,
  });
}

declare global {
  interface ElementEventMap {
    ['oscd-edit-wizard-request']: EditWizardRequest;
    ['oscd-create-wizard-request']: CreateWizardRequest;
    ['oscd-close-wizard']: WizardEvent;
  }
}
```

## Theming

OpenSCD core sets the following CSS variables on the plugin:

```css
* {
  --oscd-primary: var(--oscd-theme-primary, #2aa198);
  --oscd-secondary: var(--oscd-theme-secondary, #6c71c4);
  --oscd-error: var(--oscd-theme-error, #dc322f);

  --oscd-base03: var(--oscd-theme-base03, #002b36);
  --oscd-base02: var(--oscd-theme-base02, #073642);
  --oscd-base01: var(--oscd-theme-base01, #586e75);
  --oscd-base00: var(--oscd-theme-base00, #657b83);
  --oscd-base0: var(--oscd-theme-base0, #839496);
  --oscd-base1: var(--oscd-theme-base1, #93a1a1);
  --oscd-base2: var(--oscd-theme-base2, #eee8d5);
  --oscd-base3: var(--oscd-theme-base3, #fdf6e3);

  --oscd-text-font: var(--oscd-theme-text-font, 'Roboto');
  --oscd-icon-font: var(--oscd-theme-icon-font, 'Material Icons');
}
```

It is expected that the fonts `--oscd-theme-text-font` and `--oscd-theme-icon-font` will be loaded in OpenSCD's `index.html` file. OpenSCD core does not load any fonts by itself.

## Missing

### Events for adding and removing plugins

This is still needed if we want to enable plugins themselves to manage other plugins.

### Plugin manifest, searchable plugin store

This is still needed if we want to enable plugins to be installed and updated from within OpenSCD. If the above is implemented, this could be done by a plugin itself. Otherwise, this could be done by the OpenSCD distribution.

A good candidate for a plugin manifest format is the Plugin type defined above, with the addition of a `kind` flag indicating whether it is a `"menu"` or `"editor"` plugin (or maybe `"both"`), and possibly a `version` property.

### Plugin bundle archive format

For offline installation of plugins (e.g. by dragging and dropping a `.zip` file into OpenSCD), a format for bundling the plugin's JavaScript and resource files along with a manifest file is needed. This could either be implemented by the OpenSCD distribution or by a "plugin management" plugin as described in the previous section.

### Plugin update notifications

Given a plugin manifest with a `version` number, OpenSCD core could check for updates to the plugins and notify the user when updates are available.

Within the current architecture, the plugin's own service worker is expected to handle this.

### Deep linking to editor plugins

Currently, the only way to open an editor plugin is by clicking on its tab in the tab bar. It would be nice to be able to deep link to a particular editor plugin, for example by clicking on a link in another plugin.

This could be handled by the OpenSCD distribution, which could e.g. listen for `hashchange` events and open the appropriate editor plugin by setting the OpenSCD core's `editorIndex` property.
