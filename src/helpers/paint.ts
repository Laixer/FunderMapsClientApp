import { Case, Case_Multimatch, Color, MapLayer, ValueType, Range, LayerMarkup } from '@/models/MapLayer'
import { StringToColor } from './string'

class LegendEntry {
  constructor(public color: string, public label: string) { }
}

export function generatePaintStyleFromMarkup(markup: LayerMarkup) {
  return {
    'fill-outline-color': _generateFillOutlineColor(markup),
    'fill-opacity': _generateFillOpacity(markup),
    'fill-color': _generateFillColor(markup)
  }
}

function _generateFillOutlineColor(markup: LayerMarkup) {
  const data = markup.values
  switch (markup.type) {
    case ValueType.Range_Num: return _range_num(<Range[]>data, markup.column, true)
    case ValueType.Range: return _range(<Range[]>data, markup.column, true)
    case ValueType.Case: return _case(<Case[]>data, markup.column, true)
    case ValueType.Case_Multimatch: return _case_multimatch(<Case_Multimatch[]>data, markup.column, true)
    case ValueType.Color: return _color(markup, true)
    case ValueType.Color_Hash: return _hash_color(markup, true)
    default: return 'gray'
  }
}

function _generateFillOpacity(markup: LayerMarkup) {

  return [
    'case',
    ['==', ['get', 'is_active'], false],
    0.2,
    0.8
  ]
}

function _generateFillColor(markup: LayerMarkup) {
  const data = markup.values
  switch (markup.type) {
    case ValueType.Range_Num: return _range_num(<Range[]>data, markup.column)
    case ValueType.Range: return _range(<Range[]>data, markup.column)
    case ValueType.Case: return _case(<Case[]>data, markup.column)
    case ValueType.Case_Multimatch: return _case_multimatch(<Case_Multimatch[]>data, markup.column)
    case ValueType.Color: return _color(markup)
    case ValueType.Color_Hash: return _hash_color(markup)
    default: return 'gray'
  }
}

function _hash_color(json: LayerMarkup, darken: boolean = false) {
  const color = StringToColor(json.column)
  if (darken) {
    return changeColor(color)
  }
  return color
}

function _color(json: LayerMarkup, darken: boolean = false) {
  const color = (json.values as Color).color
  if (darken) {
    return changeColor(color)
  }
  return color
}

function _range(data: Range[], column: string, darken: boolean = false) {
  const cases: any[] = ['case']
  for (const range of data) {
    cases.push(['all',
      [">", ['upcase', ['to-string', ['get', column]]], range.min.toUpperCase()],
      ["<", ['upcase', ['to-string', ['get', column]]], range.max.toUpperCase()]
    ])
    if (darken) {
      cases.push(changeColor(range.color))
    } else {
      cases.push(range.color)
    }

  }
  cases.push('gray')
  return cases
}

function _range_num(data: Range[], column: string, darken: boolean = false) {
  const cases: any[] = ['case']
  for (const range of data) {
    cases.push(['all',
      [">", ['to-number', ['get', column]], ['to-number', range.min]],
      ["<=", ['to-number', ['get', column]], ['to-number', range.max]]
    ])
    if (darken) {
      cases.push(changeColor(range.color))
    } else {
      cases.push(range.color)
    }
  }
  cases.push('gray')
  return cases
}

function _case(data: Case[], column: string, darken: boolean = false) {
  const cases: any[] = ['case']
  for (const x of data) {
    cases.push(['==', ['upcase', ['to-string', ['get', column]]], x.match.toUpperCase()])
    if (darken) {
      cases.push(changeColor(x.color))
    } else {
      cases.push(x.color)
    }
  }
  cases.push('gray')
  return cases
}

function _case_multimatch(data: Case_Multimatch[], column: string, darken: boolean = false) {
  const cases: any[] = ['case']
  for (const x of data) {
    for (const m of x.match) {
      cases.push(['==', ['upcase', ['to-string', ['get', column]]], m.toUpperCase()])
      if (darken) {
        cases.push(changeColor(x.color))
      } else {
        cases.push(x.color)
      }
    }
  }
  cases.push('gray')
  return cases
}

export function generateLegend(markup: LayerMarkup): LegendEntry[] {
  const data = markup.values
  const arr = new Array<LegendEntry>();

  // TODO: Rewrite - it's no longer necessary to infer types from the type column as we now type the values in LayerMarkup constructor
  switch (markup.type) {
    case ValueType.Range_Num: return (data as Range[]).map(entry => new LegendEntry(entry.color, entry.label))
    case ValueType.Range: return (data as Range[]).map(entry => new LegendEntry(entry.color, entry.label))
    case ValueType.Case: return (data as Case[]).map(entry => new LegendEntry(entry.color, entry.label))
    case ValueType.Case_Multimatch: return (data as Case_Multimatch[]).map(entry => new LegendEntry(entry.color, entry.label))
    case ValueType.Color: return [new LegendEntry((markup.values as Color).color, "")]
    case ValueType.Color_Hash: return [new LegendEntry(StringToColor(markup.column), "")]
    default: return arr
  }
}

function changeColor(color: String): object {
  return [
    "let",
    "rgba", ["to-rgba", ["to-color", color]],

    ["let",
      "r", ["number", ["*", 0.75, ["at", 0, ["var", "rgba"]]]],
      "g", ["number", ["*", 0.75, ["at", 1, ["var", "rgba"]]]],
      "b", ["number", ["*", 0.75, ["at", 2, ["var", "rgba"]]]],
      "a", ["number", ["at", 3, ["var", "rgba"]]],
      ["let",
        "avg", ["+", ["*", 0.299, ["var", "r"]], ["*", 0.587, ["var", "g"]], ["*", 0.114, ["var", "b"]]],
        ["let",
          "desat_r", ["+", ["*", 0.4, ["var", "avg"]], ["*", 0.4, 128], ["*", 0.2, ["var", "r"]]],
          "desat_g", ["+", ["*", 0.4, ["var", "avg"]], ["*", 0.4, 128], ["*", 0.2, ["var", "g"]]],
          "desat_b", ["+", ["*", 0.4, ["var", "avg"]], ["*", 0.4, 128], ["*", 0.2, ["var", "b"]]],
          ["rgba", ["var", "r"], ["var", "g"], ["var", "b"], ["var", "a"]]
        ]
      ]
    ]
  ]
}

export function generateTooltipForFeature(layer: MapLayer, feature: any): string {
  const title = layer.name ? `<h5 class="card-title">${layer.name}</h5>` : '';
  
  let html = "<div class='card box-shadow'>";
  let body = "";

  for (const [key, value] of Object.entries(feature.properties).sort(([k1, v1], [k2, v2]) => k1 == 'inquiry_id' ? 1 : -1)) {
    body += propToHtml(key, value, layer.markup);
  }

  if (body == "") {
    body = "Geen informatie beschikbaar."
  }

  html += "<div class='card-body'>"
  html += title;
  html += body;
  html += "</div></div>"
  return html;
}

export function propToHtml(key: string, value: any, markup: LayerMarkup) {
  const { translatedKey, translatedValue } = markup.translateProp(key, value);
  switch (key) {
    case 'id': return '';
    case 'external_id': return '';
    case 'inquiry_id': return `<a class='card-link' target="_blank" href="/inquiry/${value}">Bekijk rapport</a>`;
    default: return `<p class='card-text'><b>${translatedKey}:</b> ${translatedValue}</p>`
  }
}