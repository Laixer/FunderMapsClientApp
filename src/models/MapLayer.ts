/**
 * The MVT layer model.
 */
export class MapLayer {
  id: string;
  markup: LayerMarkup;
  name: string;
  slug: string;
  visibility: string;

  constructor(id: string,
    markup: string,
    name: string,
    slug: string) {
    const _markup = JSON.parse(markup);
    this.id = id;
    this.markup = new LayerMarkup(_markup.type, _markup.column, _markup.values);
    this.name = name;
    this.slug = slug;
    this.visibility = 'invisible';
  }
}

export class LayerMarkup {
  type: string;
  column: string;
  values: any;

  constructor(type: string,
    column: string,
    values: Range[] | Range_Num[] | Case[] | Case_Multimatch[] | Color) {
    this.type = type;
    this.column = column;

    switch (type) {
      case ValueType.Range:
        this.values = (values as Range[]).map(val => new Range(val.min, val.max, val.color, val.label));
        break;
      case ValueType.Range_Num:
        this.values = (values as Range_Num[]).map(val => new Range_Num(val.min, val.max, val.color, val.label));
        break;
      case ValueType.Case:
        this.values = (values as Case[]).map(val => new Case(val.match, val.color, val.label));
        break;
      case ValueType.Case_Multimatch:
        this.values = (values as Case_Multimatch[]).map(val => new Case_Multimatch(val.match, val.color, val.label));
        break;
      case ValueType.Color:
      case ValueType.Color_Hash:
        this.values = new Color((values as Color).color);
        break;
    }
  }

  translateProp(propKey: string, propValue: string): { translatedKey: string, translatedValue: string } {
    switch (propKey) {
      case 'overall_quality': return { translatedKey: 'Funderingskwaliteit', translatedValue: this.translatePropValue(propValue) }
      case 'damage_cause': return { translatedKey: 'Schadeoorzaak', translatedValue: this.translatePropValue(propValue) }
      case 'category': return { translatedKey: 'Categorie', translatedValue: propValue }
      case 'incidents': return { translatedKey: 'Incidenten', translatedValue: propValue }
      case 'building_height': return { translatedKey: 'Gebouwhoogte', translatedValue: propValue }
      case 'foundation_risk': return { translatedKey: 'Funderingsrisico', translatedValue: this.translatePropValue(propValue) }
      case 'built_year': return { translatedKey: 'Bouwjaar', translatedValue: propValue }
      case 'foundation_type': return { translatedKey: 'Funderingstype', translatedValue: this.translatePropValue(propValue) }
      case 'enforcement_term': return { translatedKey: 'Handhavingstermijn', translatedValue: `${propValue} jaar` }
      case 'velocity': return { translatedKey: 'Zakkingssnelheid', translatedValue: `${parseFloat(propValue).toFixed(2)}mm/jaar` }
      default: return { translatedKey: propKey.charAt(0).toUpperCase() + propKey.slice(1), translatedValue: this.translatePropValue(propValue) };
    }
  }

  private translatePropValue(propValue: any): string {
    switch (this.type) {
      case ValueType.Case: return (this.values as Case[]).find(val => val.match == propValue)?.label || propValue;
      case ValueType.Case_Multimatch: return (this.values as Case_Multimatch[]).find(val => val.match.includes(propValue))?.label || propValue;
      default: return propValue;
    }
  }
}

export enum ValueType {
  Range = "range",
  Range_Num = "range_num",
  Case = "case",
  Case_Multimatch = "case_multimatch",
  Color = "color",
  Color_Hash = "hash_color"
}

export class Range {
  min: string;
  max: string;
  color: string;
  label: string;

  constructor(min: string, max: string, color: string, label: string) {
    this.min = min;
    this.max = max;
    this.color = color;
    this.label = label;
  }
}

export class Range_Num {
  min: number;
  max: number;
  color: string;
  label: string;

  constructor(min: number, max: number, color: string, label: string) {
    this.min = min;
    this.max = max;
    this.color = color;
    this.label = label;
  }
}

export class Case {
  match: string;
  color: string;
  label: string;

  constructor(match: string, color: string, label: string) {
    this.match = match;
    this.color = color;
    this.label = label;
  }
}

export class Case_Multimatch {
  match: string[];
  color: string;
  label: string;

  constructor(match: string[], color: string, label: string) {
    this.match = match;
    this.color = color;
    this.label = label;
  }
}

export class Color {
  color: string;

  constructor(color: string) {
    this.color = color;
  }
}
