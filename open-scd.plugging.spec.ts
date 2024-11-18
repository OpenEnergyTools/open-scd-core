import { expect, fixture } from '@open-wc/testing';

import { html } from 'lit';

import type { OpenSCD } from './open-scd.js';

import './open-scd.js';
import { newConfigurePluginEvent } from './foundation/plugin-event.js';

const menuPlugin1 = {
  name: 'Test Menu Plugin',
  translations: { de: 'Test Menu Erweiterung' },
  src: 'data:text/javascript;charset=utf-8,export%20default%20class%20TestPlugin1%20extends%20HTMLElement%20%7B%0D%0A%20%20async%20run%28%29%20%7B%0D%0A%20%20%20%20return%20true%3B%0D%0A%20%20%7D%0D%0A%7D',
  icon: 'margin',
  active: true,
  requireDoc: false,
};

const menuPlugin2 = {
  name: 'Test Menu Plugin 2',
  src: 'data:text/javascript;charset=utf-8,export%20default%20class%20TestPlugin2%20extends%20HTMLElement%20%7B%0D%0A%20%20async%20run%28%29%20%7B%0D%0A%20%20%20%20return%20true%3B%0D%0A%20%20%7D%0D%0A%7D',
  icon: 'margin',
  active: true,
  requireDoc: false,
};

const menuPlugin3 = {
  name: 'Test Menu Plugin 2',
  src: 'data:text/javascript;charset=utf-8,export%20default%20class%20TestPlugin3%20extends%20HTMLElement%20%7B%0D%0A%20%20async%20run%28%29%20%7B%0D%0A%20%20%20%20return%20true%3B%0D%0A%20%20%7D%0D%0A%7D',
  icon: 'margin',
  active: true,
  requireDoc: false,
};

const editorPlugin1 = {
  name: 'Test Editor Plugin',
  translations: { de: 'Test Editor Erweiterung' },
  src: 'data:text/javascript;charset=utf-8,export%20default%20class%20TestEditorPlugin1%20extends%20HTMLElement%20%7B%0D%0A%20%20constructor%20%28%29%20%7B%20super%28%29%3B%20this.innerHTML%20%3D%20%60%3Cp%3ETest%20Editor%20Plugin%3C%2Fp%3E%60%3B%20%7D%0D%0A%7D',
  icon: 'coronavirus',
  active: true,
};

const editorPlugin2 = {
  name: 'Test Editor Plugin 2',
  src: 'data:text/javascript;charset=utf-8,export%20default%20class%20TestEditorPlugin2%20extends%20HTMLElement%20%7B%0D%0A%20%20constructor%20%28%29%20%7B%20super%28%29%3B%20this.innerHTML%20%3D%20%60%3Cp%3ETest%20Editor%20Plugin%3C%2Fp%3E%60%3B%20%7D%0D%0A%7D',
  icon: 'coronavirus',
  active: true,
};

const editorPlugin3 = {
  name: 'Test Editor Plugin 2',
  src: 'data:text/javascript;charset=utf-8,export%20default%20class%20TestEditorPlugin3%20extends%20HTMLElement%20%7B%0D%0A%20%20constructor%20%28%29%20%7B%20super%28%29%3B%20this.innerHTML%20%3D%20%60%3Cp%3ETest%20Editor%20Plugin%3C%2Fp%3E%60%3B%20%7D%0D%0A%7D',
  icon: 'coronavirus',
  active: true,
};

describe('Plugging Element', () => {
  let editor: OpenSCD;

  beforeEach(async () => {
    editor = <OpenSCD>await fixture(html`<open-scd></open-scd>`);
  });

  it('loads menu plugins', () => {
    editor.plugins = { menu: [menuPlugin1, menuPlugin1, menuPlugin2] };
    expect(editor).property('plugins').property('menu').to.have.lengthOf(3);
    expect(editor).property('loadedPlugins').to.have.length(2);
  });

  it('loads menu plugin through config-plugin event', () => {
    editor.plugins = {
      menu: [menuPlugin1, menuPlugin2],
      editor: [editorPlugin1, editorPlugin2],
    };

    const name = 'Test Menu Plugin 3';
    const kind = 'menu';

    editor.dispatchEvent(newConfigurePluginEvent(name, kind, menuPlugin3));

    expect(editor).property('loadedPlugins').to.have.length(5);
    expect(editor).property('plugins').property('editor').to.have.lengthOf(2);
    expect(editor).property('plugins').property('menu').to.have.lengthOf(3);
  });

  it('removes menu plugin through config-plugin event', () => {
    editor.plugins = {
      menu: [menuPlugin1, menuPlugin2],
      editor: [editorPlugin1, editorPlugin2],
    };

    const name = 'Test Menu Plugin';
    const kind = 'menu';

    editor.dispatchEvent(newConfigurePluginEvent(name, kind, null));

    expect(editor).property('loadedPlugins').to.have.length(3);
    expect(editor).property('plugins').property('menu').to.have.lengthOf(1);
    expect(editor).property('plugins').property('editor').to.have.lengthOf(2);
  });

  it('loads editor plugins', () => {
    editor.plugins = { editor: [editorPlugin1, editorPlugin2] };
    expect(editor).property('loadedPlugins').to.have.length(2);
    expect(editor).property('plugins').property('editor').to.have.lengthOf(2);
  });

  it('loads editor plugin through config-plugin event', async () => {
    editor.plugins = {
      menu: [menuPlugin1, menuPlugin2],
      editor: [editorPlugin1, editorPlugin2],
    };

    const name = 'Test Menu Plugin 3';
    const kind = 'editor';

    editor.dispatchEvent(newConfigurePluginEvent(name, kind, editorPlugin3));

    expect(editor).property('loadedPlugins').to.have.length(5);
    expect(editor).property('plugins').property('menu').to.have.lengthOf(2);
    expect(editor).property('plugins').property('editor').to.have.lengthOf(3);
  });

  it('removes editor plugin through config-plugin event', () => {
    editor.plugins = {
      menu: [menuPlugin1, menuPlugin2],
      editor: [editorPlugin1, editorPlugin2],
    };

    const name = 'Test Editor Plugin 2';
    const kind = 'editor';

    editor.dispatchEvent(newConfigurePluginEvent(name, kind, null));

    expect(editor).property('loadedPlugins').to.have.length(3);
    expect(editor).property('plugins').property('menu').to.have.lengthOf(2);
    expect(editor).property('plugins').property('editor').to.have.lengthOf(1);
  });

  it('ignores remove config-plugin event with incorrect name', () => {
    editor.plugins = {
      menu: [menuPlugin1, menuPlugin2],
      editor: [editorPlugin1, editorPlugin2],
    };

    const name = 'Test Editor Plugin 4';
    const kind = 'editor';

    editor.dispatchEvent(newConfigurePluginEvent(name, kind, null));

    expect(editor).property('loadedPlugins').to.have.length(4);
    expect(editor).property('plugins').property('menu').to.have.lengthOf(2);
    expect(editor).property('plugins').property('editor').to.have.lengthOf(2);
  });
});
