import { visualDiff } from '@web/test-runner-visual-regression';

import './open-scd.js';
import type { OpenSCD } from './open-scd.js';

import {
  newCreateWizardEvent,
  newEditWizardEvent,
} from './foundation/wizard-event.js';

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
  it(`renders code wizard on CreateWizard request`, async () => {
    await editor.updateComplete;

    const parent = doc.querySelector('Parent')!;

    editor.dispatchEvent(newCreateWizardEvent(parent, 'Element'));

    await timeout(100);
    await visualDiff(editor, `wizard-create`);
  });

  it(`renders code wizard on CreateWizard request`, async () => {
    await editor.updateComplete;

    const child2 = doc.querySelector('ChildElement2')!;

    editor.dispatchEvent(newEditWizardEvent(child2));

    await timeout(100);
    await visualDiff(editor, `wizard-edit`);
  });

  it(`renders wizards in FIFO que`, async () => {
    await editor.updateComplete;

    const child2 = doc.querySelector('ChildElement2')!;
    const child3 = doc.querySelector('ChildElement3')!;
    const child4 = doc.querySelector('Element')!;

    editor.dispatchEvent(newEditWizardEvent(child2));
    editor.dispatchEvent(newEditWizardEvent(child3));
    editor.dispatchEvent(newEditWizardEvent(child4));

    await timeout(100);
    await visualDiff(editor, `wizard-fifo`);
  });

  it(`renders subwizards in LIFO que`, async () => {
    await editor.updateComplete;

    const child2 = doc.querySelector('ChildElement2')!;
    const child3 = doc.querySelector('ChildElement3')!;

    editor.dispatchEvent(newEditWizardEvent(child2));
    editor.dispatchEvent(newEditWizardEvent(child3, true));

    await timeout(100);
    await visualDiff(editor, `wizard-subwizard`);
  });
});
