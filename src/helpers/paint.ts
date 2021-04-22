import { Case, Case_Multimatch, Color, MapLayer, ValueType, Range, LayerMarkup } from '@/models/MapLayer'
import { StringToColor } from './string'

class LegendEntry {
  constructor(public color: string, public label: string) { }
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