import { StringToColor } from './string'

interface JSONMarkup {
  column: string;
  type: string;
  values: Range[] | Case[] | Case_Multimatch[] | null;
}

interface Range {
  min: string,
  max: string,
  color: string,
  label: string
}

interface Case {
  match: string,
  color: string,
  label: string
}

interface Case_Multimatch {
  match: String[],
  color: string,
  label: string
}

class LegendEntry {
  constructor(public color: string, public label: string) {}
}

export function generatePaintStyleFromJSON(markup: JSONMarkup) {
  return {
    'fill-outline-color': _generateFillOutlineColor(markup),
    'fill-opacity': _generateFillOpacity(markup),
    'fill-color': _generateFillColor(markup)
  }
}

function _generateFillOutlineColor(markup: JSONMarkup) {
  return 'black'
}

function _generateFillOpacity(markup: JSONMarkup) {

  return [
    'case',
    ['==', ['get', 'is_active'], true],
    0.8,
    0.2
  ]
}

function _generateFillColor(markup: JSONMarkup) {
  const data = markup.values
  switch (markup.type) {
    case 'ranges': return _ranges(<Range[]>data, markup.column)
    case 'case': return _case(<Case[]>data, markup.column)
    case 'hash_color': return _hash_color(markup)
    case 'case_multimatch': return _case_multimatch(<Case_Multimatch[]>data, markup.column)
    default: return 'gray'
  }
}

function _hash_color(json: JSONMarkup) {
  return StringToColor(json.column)
}

function _ranges(data: Range[], column: string) {
  const cases: any[] = ['case']
  data.forEach(range => {
    cases.push(['all',
      [">", ['get', column], range.min],
      ["<", ['get', column], range.max]
    ])
    cases.push(range.color)
  })
  cases.push('gray')
  return cases
}

function _case(data: Case[], column: string) {
  const cases: any[] = ['case']
  data.forEach(x => {
    cases.push(['==', ['get', column], x.match])
    cases.push(x.color)
  });
  cases.push('gray')
  return cases
}

function _case_multimatch(data: Case_Multimatch[], column: string) {
  const cases: any[] = ['case']
  data.forEach(x => {
    x.match.forEach(m => {
      cases.push(['==', ['get', column], m.match])
      cases.push(x.color)
    })
  });
  cases.push('gray')
  return cases
}

export function generateLegend(markup: JSONMarkup): LegendEntry[] {
  const data = markup.values
  const arr = new Array<LegendEntry>();

  switch(markup.type) {
    case 'ranges': return (data as Range[]).map(entry => new LegendEntry(entry.color, entry.label))
    case 'case': return (data as Case[]).map(entry => new LegendEntry(entry.color, entry.label))
    case 'hash_color': return [new LegendEntry(StringToColor(markup.column), "")]
    case 'case_multimatch': return (data as Case_Multimatch[]).map(entry => new LegendEntry(entry.color, entry.label))
    default: return arr
  }
}