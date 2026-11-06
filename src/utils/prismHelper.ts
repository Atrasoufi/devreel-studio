import Prism from 'prismjs';
// Import required prism languages
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-docker';

export function highlightCode(code: string, language: string = 'python'): string {
  try {
    const langKey = language.toLowerCase();
    const grammar = Prism.languages[langKey] || Prism.languages.python || Prism.languages.javascript;
    return Prism.highlight(code || '', grammar, langKey);
  } catch (err) {
    console.warn('Prism highlight fallback:', err);
    return escapeHtml(code);
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
