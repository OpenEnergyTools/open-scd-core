import { css, html, LitElement, nothing, TemplateResult } from 'lit';

import { customElement, property, query, state } from 'lit/decorators.js';

import 'ace-custom-element';
import '@material/mwc-dialog';

import type AceEditor from 'ace-custom-element';
import { Button } from '@material/mwc-button';
import type { Dialog } from '@material/mwc-dialog';

import { Insert, newEditEvent, Remove } from '../foundation.js';
import {
  isCreateRequest,
  newCloseWizardEvent,
  WizardRequest,
} from '../foundation/wizard-event.js';

function formatXml(xml: string, tab: string = '\t'): string {
  let formatted = '';
  let indent = '';

  xml.split(/>\s*</).forEach(node => {
    if (node.match(/^\/\w/)) indent = indent.substring(tab!.length);
    formatted += `${indent}<${node}>\r\n`;
    if (node.match(/^<?\w[^>]*[^/]$/)) indent += tab;
  });
  return formatted.substring(1, formatted.length - 3);
}

function codeEdits(
  oldElement: Element,
  newElementText: string
): (Remove | Insert)[] {
  const parent = oldElement.parentElement;
  if (!parent) return [];

  const remove: Remove = { node: oldElement };
  const insert: Insert = {
    parent: oldElement.parentElement,
    node: new DOMParser().parseFromString(newElementText, 'application/xml')
      .documentElement,
    reference: oldElement.nextSibling,
  };

  return [remove, insert];
}

@customElement('code-wizard')
export class CodeWizard extends LitElement {
  @property({ attribute: false })
  wizard?: WizardRequest;

  @state()
  get value(): string {
    return this.editor?.value ?? '';
  }

  set value(val: string) {
    if (this.editor) this.editor.value = val;

    this.requestUpdate();
  }

  @state()
  get element(): Element | null {
    if (!this.wizard) return null;

    return isCreateRequest(this.wizard)
      ? this.wizard.parent
      : this.wizard.element;
  }

  @query('ace-editor') editor!: AceEditor;

  @query('mwc-dialog') dialog!: Dialog;

  @query('.button.close') closeBtn!: Button;

  @query('.button.save') saveBtn!: Button;

  save(element: Element) {
    const text = this.editor.value;
    if (!text) return;

    const edits = codeEdits(element, text);
    if (!edits.length) return;

    this.dispatchEvent(newEditEvent(edits));
  }

  onClosed(ae: CustomEvent<{ action: string }>): void {
    if (ae.detail.action === 'save') this.save(this.element!);

    this.dispatchEvent(newCloseWizardEvent(this.wizard!));
  }

  updated(): void {
    this.editor.basePath = '/components/ace';
    this.editor.mode = 'ace/mode/xml';
    this.editor.theme = 'ace/theme/oscd_custom';
    this.dialog.show();
  }

  render(): TemplateResult {
    if (!this.element) return html`${nothing}`;

    return html`<mwc-dialog
      heading="Edit ${this.element.tagName}"
      defaultAction=""
      @closed=${this.onClosed}
    >
      <ace-editor
        wrap
        soft-tabs
        value="${formatXml(
          new XMLSerializer().serializeToString(this.element)
        )}"
      ></ace-editor>
      <mwc-button
        class="button close"
        slot="secondaryAction"
        dialogAction="close"
        >Cancel</mwc-button
      >
      <mwc-button
        class="button save"
        slot="primaryAction"
        icon="save"
        dialogAction="save"
        >Save</mwc-button
      >
    </mwc-dialog>`;
  }

  static styles = css`
    ace-editor {
      width: 60vw;
    }
  `;
}
