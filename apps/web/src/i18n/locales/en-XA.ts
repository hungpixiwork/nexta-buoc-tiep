import { en } from './en';

/**
 * Transforms standard text into pseudo-localized text ([Ààéê... expanded])
 * Used during UI QA & DevTools inspection to stress-test text wrapping,
 * container sizes, and overflow prevention.
 */
function pseudoLocalize(text: string): string {
  const charMap: Record<string, string> = {
    a: 'à', b: 'ƀ', c: 'ç', d: 'đ', e: 'é', f: 'ƒ', g: 'ğ',
    h: 'ĥ', i: 'î', j: 'ĵ', k: 'ķ', l: 'ĺ', m: 'ɱ', n: 'ñ',
    o: 'ô', p: 'ƥ', q: 'ʠ', r: 'ř', s: 'š', t: 'ť', u: 'û',
    v: 'ṽ', w: 'ŵ', x: 'ẋ', y: 'ŷ', z: 'ž',
    A: 'À', B: 'Ɓ', C: 'Ç', D: 'Đ', E: 'É', F: 'Ƒ', G: 'Ğ',
    H: 'Ĥ', I: 'Î', J: 'Ĵ', K: 'Ķ', L: 'Ĺ', M: 'Ṁ', N: 'Ñ',
    O: 'Ô', P: 'Ƥ', Q: 'Ǫ', R: 'Ř', S: 'Š', T: 'Ť', U: 'Û',
    V: 'Ṽ', W: 'Ŵ', X: 'Ẋ', Y: 'Ŷ', Z: 'Ž'
  };

  let pseudo = '';
  let inVar = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '{') inVar = true;
    if (inVar) {
      pseudo += char;
      if (char === '}') inVar = false;
      continue;
    }
    pseudo += charMap[char] || char;
  }

  return `[ !!! ${pseudo} ~~~~ !!! ]`;
}

function transformObject(obj: any): any {
  if (typeof obj === 'string') {
    return pseudoLocalize(obj);
  }
  if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
    const res: Record<string, any> = {};
    for (const key of Object.keys(obj)) {
      res[key] = transformObject(obj[key]);
    }
    return res;
  }
  return obj;
}

export const enXA = transformObject(en) as typeof en;
