import { expect } from '@open-wc/testing';

import './open-scd.js';
import type { OpenSCD } from './open-scd.js';

import { newEditWizardEvent } from './foundation/wizard-event.js';

const factor = window.process && process.env.CI ? 4 : 2;

function timeout(ms: number) {
  return new Promise(res => setTimeout(res, ms * factor));
}

mocha.timeout(2000 * factor);

const doc = new DOMParser().parseFromString(
  `<Parent>
    <Element>
      <ChildElement childAttr="someAttr"></ChildElement>
      <ChildElement2 childAttr="someAttr"></ChildElement2>
      <ChildElement3 childAttr="someAttr"></ChildElement3>
      <ChildElement4 childAttr="someAttr"></ChildElement4>
    </Element>
  </Parent>`,
  'application/xml'
);

let editor: OpenSCD;
beforeEach(() => {
  editor = document.createElement('open-scd');
  document.body.prepend(editor);
});

afterEach(() => {
  editor.remove();
});

describe(`code wizard`, () => {
  it(`removes wizard from workflow on close wizard event`, async () => {
    await editor.updateComplete;

    const element = doc.querySelector('ChildElement')!;
    editor.dispatchEvent(newEditWizardEvent(element));

    await timeout(100);
    editor.codeWizard!.closeBtn.click();

    await timeout(200);
    expect(editor.workflow.length).to.equal(0);
  });

  it(`exchanges code wizard value on save`, async () => {
    await editor.updateComplete;

    const element = doc.querySelector('ChildElement')!;
    const parent = element.parentElement;
    const value = '<NewChildElement/>';

    editor.dispatchEvent(newEditWizardEvent(element));

    await timeout(50);
    editor.codeWizard!.editor.value = value;

    await timeout(200);
    editor.codeWizard?.saveBtn.click();

    await timeout(200);
    expect(element.parentElement).to.be.null;
    expect(parent?.querySelector('NewChildElement')).to.not.be.null;
    expect(editor.workflow.length).to.equal(0);
  });
});
