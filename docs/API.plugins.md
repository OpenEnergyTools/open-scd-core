# OpenSCD core API for plugins

## Overview

**OpenSCD** is a plugin-based editor for editing XML files in the IEC 61850-6 "SCL" dialect directly in the browser.

**OpenSCD core** is the central supervisory component which coordinates the work of all the plugins, allowing them to work together in editing the same SCL document.

An **OpenSCD plugin** is a [custom element](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements#implementing_a_custom_element) that has been registered in the global [`customElements`](https://developer.mozilla.org/en-US/docs/Web/API/Window/customElements) registry under some tag name. OpenSCD core renders an element with that tag name into the app. The component may optionally provide a `run()` method for OpenSCD core to call in order to trigger an action.

The **OpenSCD core API** describes the ways in which:
- OpenSCD core communicates relevant data to the plugins,
- plugins communicate user intent to OpenSCD core, and
- OpenSCD sets CSS fonts and colors for plugins.

## Communicating data to plugins

OpenSCD core communicates the data necessary for editing SCL documents by setting the following [properties](https://developer.mozilla.org/en-US/docs/Glossary/Property/JavaScript) on the plugin's [DOM Element](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement):


```typescript
export default class MyPlugin extends HTMLElement {
  docs: Record<string, XMLDocument> = {}; // all loaded documents
  doc?: XMLDocument; // the document currently being edited
  docName?: string; // the current doc's name
  docVersion: unknown; // current doc's state indicator
  locale: string = 'en'; // the end user's chosen locale
}
```

### `docs`
`docs` is set to an object mapping `string` keys (document names) to `XMLDocument` values.

### `docName`
The name of the `XMLDocument` currently being edited.

### `doc`
The `XMLDocument` currently being edited.

### `docVersion`
A change in this property's value indicates a change to the `doc`.

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

Its `title` property is a human-readable description of the edit.

The `squash` flag indicates whether the edit should be merged with the previous edit in the history.

#### `Edit` type
The `EditDetailV2` defined above contains an `edit` of this type:

```typescript
export type EditV2 = Insert | SetAttributes | SetTextContent | Remove | EditV2[];
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
  textContent: string;
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
  subWizard?: boolean; // TODO: describe what this currently means
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
  --oscd-text-font-mono: var(--oscd-theme-text-font-mono, 'Roboto Mono');
  --oscd-icon-font: var(--oscd-theme-icon-font, 'Material Icons');
}
```
